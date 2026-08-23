-- Project-level RBAC: grants table, visibility columns, permission helper, data backfill

-- ---------------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------------

ALTER TABLE public.custom_records
  ADD COLUMN IF NOT EXISTS visibility_mode TEXT NOT NULL DEFAULT 'private',
  ADD COLUMN IF NOT EXISTS owner_user_id UUID;

CREATE INDEX IF NOT EXISTS idx_custom_records_visibility_mode
  ON public.custom_records (tenant_id, visibility_mode);

CREATE INDEX IF NOT EXISTS idx_custom_records_owner_user_id
  ON public.custom_records (owner_user_id)
  WHERE owner_user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.project_access_grants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.custom_records(id) ON DELETE CASCADE,
  subject_type TEXT NOT NULL CHECK (subject_type IN ('user', 'department', 'custom_role')),
  subject_id UUID NOT NULL,
  permission TEXT NOT NULL CHECK (permission IN ('view', 'edit', 'manage')),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, subject_type, subject_id, permission)
);

CREATE INDEX IF NOT EXISTS idx_project_access_grants_project
  ON public.project_access_grants (project_id);

CREATE INDEX IF NOT EXISTS idx_project_access_grants_tenant_subject
  ON public.project_access_grants (tenant_id, subject_type, subject_id);

ALTER TABLE public.project_access_grants ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Backfill visibility_mode + owner_user_id from legacy JSONB
-- ---------------------------------------------------------------------------

UPDATE public.custom_records cr
SET visibility_mode = CASE
  WHEN lower(coalesce(cr.record_data->>'visibility', '')) IN ('public', 'open') THEN 'open'
  WHEN lower(coalesce(cr.record_data->>'visibility', '')) IN ('just_admin', 'admin_only') THEN 'admin_only'
  WHEN lower(coalesce(cr.record_data->>'visibility', '')) = 'department' THEN 'department'
  ELSE 'private'
END
WHERE cr.visibility_mode IS NULL OR cr.visibility_mode = 'private';

UPDATE public.custom_records cr
SET owner_user_id = tu.user_id
FROM public.tenant_users tu
WHERE cr.owner_user_id IS NULL
  AND cr.tenant_id = tu.tenant_id
  AND lower(coalesce(tu.email, '')) = lower(coalesce(cr.record_data->>'owner_email', ''))
  AND tu.email IS NOT NULL;

-- Sync is_global_public column from JSONB share flags
UPDATE public.custom_records cr
SET is_global_public = TRUE
WHERE coalesce(cr.is_global_public, FALSE) = FALSE
  AND (
    lower(coalesce(cr.record_data->>'is_global_shared', 'false')) IN ('true', '1')
    OR lower(coalesce(cr.record_data->>'is_global_public', 'false')) IN ('true', '1')
  );

-- Mirror visibility_mode into record_data for transitional clients
UPDATE public.custom_records cr
SET record_data = cr.record_data || jsonb_build_object('visibility_mode', cr.visibility_mode)
WHERE coalesce(cr.record_data->>'visibility_mode', '') IS DISTINCT FROM cr.visibility_mode;

-- Backfill collaborator grants (editor -> edit, viewer -> view, admin -> manage)
INSERT INTO public.project_access_grants (tenant_id, project_id, subject_type, subject_id, permission)
SELECT DISTINCT
  cr.tenant_id,
  cr.id,
  'user',
  tu.user_id,
  CASE lower(coalesce(c.elem->>'role', 'editor'))
    WHEN 'viewer' THEN 'view'
    WHEN 'admin' THEN 'manage'
    ELSE 'edit'
  END
FROM public.custom_records cr
CROSS JOIN LATERAL jsonb_array_elements(coalesce(cr.record_data->'collaborators', '[]'::jsonb)) AS c(elem)
JOIN public.tenant_users tu
  ON tu.tenant_id = cr.tenant_id
 AND lower(coalesce(tu.email, '')) = lower(coalesce(c.elem->>'email', ''))
WHERE tu.user_id IS NOT NULL
ON CONFLICT (project_id, subject_type, subject_id, permission) DO NOTHING;

-- ---------------------------------------------------------------------------
-- Permission helper (SECURITY DEFINER — used by RLS)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public._perm_rank(p_perm TEXT)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE lower(coalesce(p_perm, 'view'))
    WHEN 'view' THEN 1
    WHEN 'edit' THEN 2
    WHEN 'manage' THEN 3
    WHEN 'delete' THEN 4
    ELSE 1
  END;
$$;

CREATE OR REPLACE FUNCTION public._collab_perm_rank(p_role TEXT)
RETURNS INT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE lower(coalesce(p_role, 'editor'))
    WHEN 'viewer' THEN 1
    WHEN 'editor' THEN 2
    WHEN 'admin' THEN 3
    ELSE 2
  END;
$$;

CREATE OR REPLACE FUNCTION public.has_project_permission(p_project_id UUID, p_perm TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
  v_rec public.custom_records%ROWTYPE;
  v_role TEXT;
  v_dept UUID;
  v_custom_role UUID;
  v_email TEXT;
  v_need INT;
  v_mode TEXT;
  v_grant_perm TEXT;
  v_collab_role TEXT;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL OR p_project_id IS NULL THEN
    RETURN FALSE;
  END IF;

  v_need := public._perm_rank(p_perm);

  SELECT * INTO v_rec FROM public.custom_records WHERE id = p_project_id;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  SELECT lower(coalesce(tu.role, 'employee')), tu.department_id, tu.custom_role_id, lower(coalesce(tu.email, ''))
    INTO v_role, v_dept, v_custom_role, v_email
  FROM public.tenant_users tu
  WHERE tu.tenant_id = v_rec.tenant_id AND tu.user_id = v_uid;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF v_role IN ('owner', 'admin') THEN
    RETURN TRUE;
  END IF;

  IF v_rec.owner_user_id = v_uid THEN
    RETURN TRUE;
  END IF;

  v_mode := lower(coalesce(v_rec.visibility_mode, 'private'));

  -- Explicit grants (user, department, custom_role)
  SELECT g.permission INTO v_grant_perm
  FROM public.project_access_grants g
  WHERE g.project_id = p_project_id
    AND (
      (g.subject_type = 'user' AND g.subject_id = v_uid)
      OR (g.subject_type = 'department' AND v_dept IS NOT NULL AND g.subject_id = v_dept)
      OR (g.subject_type = 'custom_role' AND v_custom_role IS NOT NULL AND g.subject_id = v_custom_role)
    )
  ORDER BY public._perm_rank(g.permission) DESC
  LIMIT 1;

  IF FOUND AND public._perm_rank(v_grant_perm) >= v_need THEN
    RETURN TRUE;
  END IF;

  -- Collaborators in JSONB
  SELECT coalesce(c.elem->>'role', 'editor') INTO v_collab_role
  FROM jsonb_array_elements(coalesce(v_rec.record_data->'collaborators', '[]'::jsonb)) AS c(elem)
  WHERE lower(coalesce(c.elem->>'email', '')) = v_email
  LIMIT 1;

  IF FOUND THEN
    IF public._collab_perm_rank(v_collab_role) >= v_need THEN
      RETURN TRUE;
    END IF;
    IF v_need = 1 THEN
      RETURN TRUE;
    END IF;
  END IF;

  -- Visibility modes
  IF v_mode = 'open' AND v_need = 1 THEN
    RETURN TRUE;
  END IF;

  IF v_mode = 'department' AND v_need = 1 AND v_dept IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text(coalesce(v_rec.record_data->'department_ids', '[]'::jsonb)) d(val)
      WHERE d.val::uuid = v_dept
    ) THEN
      RETURN TRUE;
    END IF;
  END IF;

  RETURN FALSE;
END;
$$;

REVOKE ALL ON FUNCTION public.has_project_permission(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_project_permission(UUID, TEXT) TO authenticated, anon;

-- Child records (tasks) inherit project permission via record_data.project_id
CREATE OR REPLACE FUNCTION public.has_record_permission(p_record_id UUID, p_perm TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec public.records%ROWTYPE;
  v_project_id UUID;
BEGIN
  SELECT * INTO v_rec FROM public.records WHERE id = p_record_id;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF NOT public.is_tenant_member(v_rec.tenant_id) THEN
    RETURN FALSE;
  END IF;

  BEGIN
    v_project_id := (v_rec.record_data->>'project_id')::uuid;
  EXCEPTION WHEN OTHERS THEN
    v_project_id := NULL;
  END;

  IF v_project_id IS NOT NULL THEN
    RETURN public.has_project_permission(v_project_id, p_perm);
  END IF;

  -- Legacy tasks without project_id: tenant members only
  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.has_record_permission(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_record_permission(UUID, TEXT) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS: project_access_grants (members read grants for their tenant projects)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS project_access_grants_select_member ON public.project_access_grants;
CREATE POLICY project_access_grants_select_member ON public.project_access_grants
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

-- Writes go through service_role (FastAPI)

-- ---------------------------------------------------------------------------
-- RLS: tighten custom_records (replace tenant-wide member UPDATE)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS custom_records_select_member ON public.custom_records;
DROP POLICY IF EXISTS custom_records_insert_member ON public.custom_records;
DROP POLICY IF EXISTS custom_records_update_member ON public.custom_records;
DROP POLICY IF EXISTS custom_records_delete_member ON public.custom_records;
DROP POLICY IF EXISTS custom_records_select_public_anon ON public.custom_records;

CREATE POLICY custom_records_select_member ON public.custom_records
  FOR SELECT TO authenticated
  USING (
    public.has_project_permission(id, 'view')
    OR coalesce(is_global_public, FALSE) = TRUE
  );

CREATE POLICY custom_records_insert_member ON public.custom_records
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY custom_records_update_member ON public.custom_records
  FOR UPDATE TO authenticated
  USING (public.has_project_permission(id, 'edit'))
  WITH CHECK (public.has_project_permission(id, 'edit'));

CREATE POLICY custom_records_delete_member ON public.custom_records
  FOR DELETE TO authenticated
  USING (public.has_project_permission(id, 'delete'));

CREATE POLICY custom_records_select_public_anon ON public.custom_records
  FOR SELECT TO anon
  USING (coalesce(is_global_public, FALSE) = TRUE);

-- ---------------------------------------------------------------------------
-- RLS: tighten records (tasks)
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS records_select_member ON public.records;
DROP POLICY IF EXISTS records_insert_member ON public.records;
DROP POLICY IF EXISTS records_update_member ON public.records;
DROP POLICY IF EXISTS records_delete_member ON public.records;
DROP POLICY IF EXISTS records_select_public_anon ON public.records;

CREATE POLICY records_select_member ON public.records
  FOR SELECT TO authenticated
  USING (
    public.has_record_permission(id, 'view')
    OR coalesce(is_global_public, FALSE) = TRUE
  );

CREATE POLICY records_insert_member ON public.records
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_tenant_member(tenant_id)
    AND (
      record_data->>'project_id' IS NULL
      OR public.has_project_permission((record_data->>'project_id')::uuid, 'edit')
    )
  );

CREATE POLICY records_update_member ON public.records
  FOR UPDATE TO authenticated
  USING (public.has_record_permission(id, 'edit'))
  WITH CHECK (public.has_record_permission(id, 'edit'));

CREATE POLICY records_delete_member ON public.records
  FOR DELETE TO authenticated
  USING (public.has_record_permission(id, 'delete'));

CREATE POLICY records_select_public_anon ON public.records
  FOR SELECT TO anon
  USING (coalesce(is_global_public, FALSE) = TRUE);

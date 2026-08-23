-- Close PostgREST privilege-escalation and cross-tenant read gaps.
-- FastAPI continues to use service_role (bypasses RLS); these policies
-- gate browser JWT + anon-key access.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.try_parse_uuid(p TEXT)
RETURNS UUID
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  IF p IS NULL OR btrim(p) = '' THEN
    RETURN NULL;
  END IF;
  RETURN btrim(p)::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.try_parse_uuid(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.try_parse_uuid(TEXT) TO authenticated, anon, service_role;

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
  v_parent UUID;
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

  -- Timeline rows inherit the parent project's ACL (module_name = timeline_data_{uuid})
  IF v_rec.module_name LIKE 'timeline_data_%' THEN
    v_parent := public.try_parse_uuid(substr(v_rec.module_name, 15));
    IF v_parent IS NULL OR v_parent = p_project_id THEN
      RETURN FALSE;
    END IF;
    RETURN public.has_project_permission(v_parent, p_perm);
  END IF;

  -- Workspace config: members may view; only owner/admin may mutate
  IF v_rec.module_name IN ('workspace_modules', 'activity_logs') THEN
    IF v_need <= 1 THEN
      RETURN TRUE;
    END IF;
    RETURN v_role IN ('owner', 'admin');
  END IF;

  IF v_role IN ('owner', 'admin') THEN
    RETURN TRUE;
  END IF;

  IF v_rec.owner_user_id = v_uid THEN
    RETURN TRUE;
  END IF;

  v_mode := lower(coalesce(v_rec.visibility_mode, 'private'));

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

  v_project_id := public.try_parse_uuid(v_rec.record_data->>'project_id');
  IF v_project_id IS NULL THEN
    -- Unscoped / invalid project_id: do not open the row to every member
    RETURN FALSE;
  END IF;

  RETURN public.has_project_permission(v_project_id, p_perm);
END;
$$;

-- ---------------------------------------------------------------------------
-- Freeze privileged membership / tenant columns for JWT role (triggers still
-- fire if a loose policy is re-added). service_role / postgres may update.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.protect_tenant_users_privileged_cols()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() IN ('authenticated', 'anon') THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.tenant_id IS DISTINCT FROM OLD.tenant_id
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
       OR NEW.department_id IS DISTINCT FROM OLD.department_id
       OR NEW.custom_role_id IS DISTINCT FROM OLD.custom_role_id THEN
      RAISE EXCEPTION 'Cannot change privileged membership fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_tenant_users_privileged_cols ON public.tenant_users;
CREATE TRIGGER trg_protect_tenant_users_privileged_cols
  BEFORE UPDATE ON public.tenant_users
  FOR EACH ROW
  EXECUTE PROCEDURE public.protect_tenant_users_privileged_cols();

CREATE OR REPLACE FUNCTION public.protect_tenants_privileged_cols()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() IN ('authenticated', 'anon') THEN
    IF NEW.tier IS DISTINCT FROM OLD.tier
       OR NEW.id IS DISTINCT FROM OLD.id
       OR NEW.slug IS DISTINCT FROM OLD.slug THEN
      RAISE EXCEPTION 'Cannot change privileged workspace fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_tenants_privileged_cols ON public.tenants;
CREATE TRIGGER trg_protect_tenants_privileged_cols
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW
  EXECUTE PROCEDURE public.protect_tenants_privileged_cols();

-- Writes go through FastAPI service_role
DROP POLICY IF EXISTS tenant_users_update_self ON public.tenant_users;
DROP POLICY IF EXISTS tenants_update_member ON public.tenants;

-- ---------------------------------------------------------------------------
-- custom_records: SELECT only for JWT; no anon dump of unsanitized public rows
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS custom_records_select_member ON public.custom_records;
DROP POLICY IF EXISTS custom_records_insert_member ON public.custom_records;
DROP POLICY IF EXISTS custom_records_update_member ON public.custom_records;
DROP POLICY IF EXISTS custom_records_delete_member ON public.custom_records;
DROP POLICY IF EXISTS custom_records_select_public_anon ON public.custom_records;

CREATE POLICY custom_records_select_member ON public.custom_records
  FOR SELECT TO authenticated
  USING (public.has_project_permission(id, 'view'));

-- INSERT/UPDATE/DELETE: no authenticated policies (service_role only)

-- ---------------------------------------------------------------------------
-- records (tasks): require a valid project + matching permission; no anon SELECT
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS records_select_member ON public.records;
DROP POLICY IF EXISTS records_insert_member ON public.records;
DROP POLICY IF EXISTS records_update_member ON public.records;
DROP POLICY IF EXISTS records_delete_member ON public.records;
DROP POLICY IF EXISTS records_select_public_anon ON public.records;

CREATE POLICY records_select_member ON public.records
  FOR SELECT TO authenticated
  USING (public.has_record_permission(id, 'view'));

CREATE POLICY records_insert_member ON public.records
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_tenant_member(tenant_id)
    AND public.has_project_permission(
      public.try_parse_uuid(record_data->>'project_id'),
      'edit'
    )
  );

CREATE POLICY records_update_member ON public.records
  FOR UPDATE TO authenticated
  USING (public.has_record_permission(id, 'edit'))
  WITH CHECK (public.has_record_permission(id, 'edit'));

-- Task rows are child data: editors may delete them (project delete stays manage/delete on custom_records)
CREATE POLICY records_delete_member ON public.records
  FOR DELETE TO authenticated
  USING (public.has_record_permission(id, 'edit'));

-- ---------------------------------------------------------------------------
-- Grants: only for projects the caller can view
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS project_access_grants_select_member ON public.project_access_grants;
CREATE POLICY project_access_grants_select_member ON public.project_access_grants
  FOR SELECT TO authenticated
  USING (public.has_project_permission(project_id, 'view'));

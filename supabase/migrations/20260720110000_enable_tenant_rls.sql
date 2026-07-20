-- Security hardening: multi-tenant RLS (defense-in-depth)
--
-- SERVICE ROLE BYPASS: The FastAPI backend uses SUPABASE_SERVICE_ROLE_KEY
-- (PostgREST role `service_role`), which bypasses RLS by design. These
-- policies protect `anon` / `authenticated` clients — including browser
-- Supabase JS and Realtime subscriptions that use the anon key. App-layer
-- checks remain required for service_role paths; RLS is the DB edge gate
-- for anything that is not service_role.

-- ---------------------------------------------------------------------------
-- Ensure tenant-scoped tables exist (schema-as-code; IF NOT EXISTS for prod)
-- ---------------------------------------------------------------------------

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS tier TEXT DEFAULT 'basic',
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
  ADD COLUMN IF NOT EXISTS date_format TEXT DEFAULT 'YYYY-MM-DD',
  ADD COLUMN IF NOT EXISTS usage_type TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants (slug)
  WHERE slug IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'employee',
  department_id UUID,
  custom_role_id UUID,
  job_title TEXT,
  timezone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_users_user_id ON public.tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant_id ON public.tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_email ON public.tenant_users(email);

CREATE TABLE IF NOT EXISTS public.custom_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  record_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_global_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_records_tenant_id ON public.custom_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_custom_records_module_name ON public.custom_records(module_name);

-- CREATE TABLE IF NOT EXISTS does not add missing columns on existing tables.
-- Prod may have records/custom_records without is_global_public; policies below need it.
-- (Public share flags in the app also live in record_data JSONB; this column matches
-- init_schema / generated types and keeps column-based RLS policies valid.)
ALTER TABLE public.records
  ADD COLUMN IF NOT EXISTS is_global_public BOOLEAN DEFAULT FALSE;

ALTER TABLE public.custom_records
  ADD COLUMN IF NOT EXISTS is_global_public BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS public.team_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID,
  user_email TEXT,
  user_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_messages_tenant_id ON public.team_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_team_messages_created_at ON public.team_messages(created_at);

CREATE TABLE IF NOT EXISTS public.departments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_departments_tenant_id ON public.departments(tenant_id);

CREATE TABLE IF NOT EXISTS public.custom_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_roles_tenant_id ON public.custom_roles(tenant_id);

-- ---------------------------------------------------------------------------
-- Membership helper (SECURITY DEFINER avoids recursive RLS on tenant_users)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_tenant_member(p_tenant_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_users tu
    WHERE tu.tenant_id = p_tenant_id
      AND tu.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_tenant_member(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_tenant_member(UUID) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.jwt_email()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

REVOKE ALL ON FUNCTION public.jwt_email() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.jwt_email() TO authenticated, anon;

-- ---------------------------------------------------------------------------
-- Enable RLS (deny-by-default for roles subject to RLS)
-- ---------------------------------------------------------------------------

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_roles ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies if re-running migration
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'tenants', 'tenant_users', 'records', 'custom_records',
        'team_messages', 'notifications', 'departments', 'custom_roles'
      )
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I',
      pol.policyname, pol.schemaname, pol.tablename
    );
  END LOOP;
END $$;

-- tenants: members can read their workspaces
CREATE POLICY tenants_select_member ON public.tenants
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(id));

CREATE POLICY tenants_update_member ON public.tenants
  FOR UPDATE TO authenticated
  USING (public.is_tenant_member(id))
  WITH CHECK (public.is_tenant_member(id));

-- tenant_users: members see roster for their tenants; users always see own rows
CREATE POLICY tenant_users_select_member ON public.tenant_users
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_tenant_member(tenant_id)
  );

-- Inserts/updates/deletes for membership go through service_role (FastAPI invites).
-- Authenticated users may update only their own non-role profile fields via app;
-- keep write policies narrow: no INSERT/DELETE for authenticated.

CREATE POLICY tenant_users_update_self ON public.tenant_users
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- records (tasks etc.)
CREATE POLICY records_select_member ON public.records
  FOR SELECT TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
    OR coalesce(is_global_public, false) = true
  );

CREATE POLICY records_insert_member ON public.records
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY records_update_member ON public.records
  FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY records_delete_member ON public.records
  FOR DELETE TO authenticated
  USING (public.is_tenant_member(tenant_id));

-- custom_records (projects / modules)
CREATE POLICY custom_records_select_member ON public.custom_records
  FOR SELECT TO authenticated
  USING (
    public.is_tenant_member(tenant_id)
    OR coalesce(is_global_public, false) = true
  );

CREATE POLICY custom_records_insert_member ON public.custom_records
  FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY custom_records_update_member ON public.custom_records
  FOR UPDATE TO authenticated
  USING (public.is_tenant_member(tenant_id))
  WITH CHECK (public.is_tenant_member(tenant_id));

CREATE POLICY custom_records_delete_member ON public.custom_records
  FOR DELETE TO authenticated
  USING (public.is_tenant_member(tenant_id));

-- Public share reads for anon when explicitly marked global-public
CREATE POLICY custom_records_select_public_anon ON public.custom_records
  FOR SELECT TO anon
  USING (coalesce(is_global_public, false) = true);

CREATE POLICY records_select_public_anon ON public.records
  FOR SELECT TO anon
  USING (coalesce(is_global_public, false) = true);

-- team_messages (Realtime + REST)
CREATE POLICY team_messages_select_member ON public.team_messages
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY team_messages_insert_member ON public.team_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_tenant_member(tenant_id)
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- notifications: only the recipient email from JWT
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT TO authenticated
  USING (lower(target_email) = public.jwt_email());

CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE TO authenticated
  USING (lower(target_email) = public.jwt_email())
  WITH CHECK (lower(target_email) = public.jwt_email());

-- departments / custom_roles
CREATE POLICY departments_select_member ON public.departments
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

CREATE POLICY custom_roles_select_member ON public.custom_roles
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(tenant_id));

-- ============================================================
-- tighten_role_model_and_add_audit_log.sql
--
-- 1. Expands the profiles.role CHECK to support super_admin.
-- 2. Adds private.is_super_admin() SECURITY DEFINER helper.
-- 3. Widens private.is_admin() to include super_admin.
-- 4. Hardens the profile-fields trigger so only super_admin
--    can mutate role; ordinary admins retain other privileges.
-- 5. Converts the hard-coded countries_admin_all policy to use
--    private.is_admin() so super_admin inherits access.
-- 6. Introduces public.admin_role_audit_log for immutable
--    role-change history with RLS.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS private;

-- --------------------------------------------------------------
-- 1. Role helpers
-- --------------------------------------------------------------

-- is_admin() is true for both admin and super_admin
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
  );
$$;

-- is_super_admin() is true only for super_admin
CREATE OR REPLACE FUNCTION private.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'super_admin'
  );
$$;

-- --------------------------------------------------------------
-- 2. Profiles role constraint
-- --------------------------------------------------------------

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'admin', 'super_admin'));

-- --------------------------------------------------------------
-- 3. Harden profile-field protection trigger
-- --------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.protect_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, private
AS $$
DECLARE
  jwt_aal text;
BEGIN
  -- Allow service_role / backend / SQL editor operations.
  -- auth.uid() is NULL for SQL editor connections, and the role
  -- claim identifies service_role REST API calls.
  IF auth.uid() IS NULL OR auth.jwt()->>'role' = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Strict role-change gate: applies to ALL authenticated users,
  -- including super_admin. This ensures no one can bypass MFA or
  -- self-change rules via direct table updates.
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT private.is_super_admin() THEN
      RAISE EXCEPTION 'Only super admins can change profile roles';
    END IF;

    IF auth.uid() = NEW.id THEN
      RAISE EXCEPTION 'You cannot change your own role';
    END IF;

    jwt_aal := auth.jwt()->>'aal';
    IF jwt_aal IS DISTINCT FROM 'aal2' THEN
      RAISE EXCEPTION 'Multi-factor authentication required for role changes';
    END IF;
  END IF;

  -- Ordinary admins may change most fields but NOT role.
  -- (Role changes were already gated above.)
  IF private.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Non-admins cannot touch id, role, or email.
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Profile id cannot be changed';
  END IF;

  IF NEW.email IS DISTINCT FROM OLD.email THEN
    RAISE EXCEPTION 'Only admins can change profile emails';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_protect_fields ON public.profiles;
CREATE TRIGGER trg_profiles_protect_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.protect_profile_fields();

-- --------------------------------------------------------------
-- 4. Fix hard-coded countries_admin_all policy
-- --------------------------------------------------------------

DROP POLICY IF EXISTS "countries_admin_all" ON public.countries;
CREATE POLICY "countries_admin_all" ON public.countries FOR ALL
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- --------------------------------------------------------------
-- 5. Audit log table
-- --------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.admin_role_audit_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id  UUID REFERENCES public.profiles(id),
  target_user_id UUID REFERENCES public.profiles(id),
  old_role       TEXT NOT NULL,
  new_role       TEXT NOT NULL,
  actor_email    TEXT,
  target_email   TEXT,
  ip_address     TEXT,
  user_agent     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_role_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super_admins can read the audit log.
-- Service-role writes bypass RLS by design; no INSERT policy is
-- granted to authenticated/anon so they cannot write directly.
DROP POLICY IF EXISTS "audit_log_select_super_admin" ON public.admin_role_audit_log;
CREATE POLICY "audit_log_select_super_admin" ON public.admin_role_audit_log
  FOR SELECT USING (private.is_super_admin());

CREATE INDEX IF NOT EXISTS idx_audit_log_target_created
  ON public.admin_role_audit_log(target_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor_created
  ON public.admin_role_audit_log(actor_user_id, created_at DESC);

-- --------------------------------------------------------------
-- 6. Harden profiles insert policy
-- --------------------------------------------------------------

-- The old policy allowed any authenticated user to insert their own
-- profile with any valid role. Prevent self-creation of privileged
-- accounts by restricting self-inserts to role = 'user'.
-- Service-role and SECURITY DEFINER triggers bypass RLS, so they
-- are unaffected.
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id AND role = 'user');

-- --------------------------------------------------------------
-- 7. Grants
-- --------------------------------------------------------------

-- Re-tighten first in case prior migrations left broader grants.
REVOKE ALL ON SCHEMA private FROM authenticated, anon, service_role;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM authenticated, anon, service_role;

GRANT USAGE ON SCHEMA private TO authenticated, anon, service_role;

-- RLS policies need these to evaluate for session users.
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION private.is_super_admin() TO authenticated, anon;

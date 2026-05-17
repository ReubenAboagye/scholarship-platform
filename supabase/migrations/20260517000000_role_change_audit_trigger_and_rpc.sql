-- ============================================================
-- 20260517000000_role_change_audit_trigger_and_rpc.sql
--
-- 1. Adds an AFTER UPDATE OF role trigger on public.profiles
--    to guarantee audit logging for every role change, even
--    direct table updates that bypass the API.
-- 2. Introduces private.change_user_role RPC as the preferred
--    app-level path for role mutations.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS private;

-- --------------------------------------------------------------
-- 1. AFTER UPDATE audit trigger
-- --------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.audit_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_email text;
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    -- Look up actor email from profiles (NULL for service_role / SQL editor)
    SELECT email INTO v_actor_email
    FROM public.profiles
    WHERE id = auth.uid();

    INSERT INTO public.admin_role_audit_log (
      actor_user_id,
      target_user_id,
      old_role,
      new_role,
      actor_email,
      target_email
    ) VALUES (
      auth.uid(),
      NEW.id,
      OLD.role,
      NEW.role,
      v_actor_email,
      NEW.email
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_audit_role_change ON public.profiles;
CREATE TRIGGER trg_profiles_audit_role_change
  AFTER UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.audit_role_change();

-- --------------------------------------------------------------
-- 2. Locked-down RPC for role changes
-- --------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.change_user_role(
  target_user_id uuid,
  new_role text
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, private
AS $$
DECLARE
  jwt_aal text;
BEGIN
  -- Require super_admin
  IF NOT private.is_super_admin() THEN
    RAISE EXCEPTION 'Only super admins can change profile roles';
  END IF;

  -- Block self-role changes
  IF auth.uid() = target_user_id THEN
    RAISE EXCEPTION 'You cannot change your own role';
  END IF;

  -- Require MFA (AAL2)
  jwt_aal := auth.jwt()->>'aal';
  IF jwt_aal IS DISTINCT FROM 'aal2' THEN
    RAISE EXCEPTION 'Multi-factor authentication required for role changes';
  END IF;

  -- Validate role
  IF new_role NOT IN ('user', 'admin', 'super_admin') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;

  -- Perform update.
  -- The BEFORE UPDATE trigger (trg_profiles_protect_fields) is also
  -- evaluated here as a defense-in-depth layer.
  UPDATE public.profiles
  SET role = new_role
  WHERE id = target_user_id;
END;
$$;

-- --------------------------------------------------------------
-- 3. Grants
-- --------------------------------------------------------------

GRANT EXECUTE ON FUNCTION private.change_user_role(uuid, text) TO authenticated;

-- Private schema keeps SECURITY DEFINER functions off the exposed Data API
CREATE SCHEMA IF NOT EXISTS private;

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
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Drop the old public version (policies must be recreated first)
DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
CREATE POLICY "profiles_admin_all" ON profiles FOR ALL
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

DROP POLICY IF EXISTS "scholarships_admin_all" ON scholarships;
CREATE POLICY "scholarships_admin_all" ON scholarships FOR ALL
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

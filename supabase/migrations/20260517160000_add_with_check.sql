-- ============================================================
-- Add WITH CHECK to UPDATE policies for profiles and application_tracker
-- ============================================================

-- Recreate profile update policy
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" 
  ON profiles 
  FOR UPDATE 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

-- Recreate tracker update policy
DROP POLICY IF EXISTS "tracker_update_own" ON application_tracker;
CREATE POLICY "tracker_update_own" 
  ON application_tracker 
  FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

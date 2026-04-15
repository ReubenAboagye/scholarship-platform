-- ============================================================
-- 008_onboarding_complete.sql
-- Adds onboarding_complete flag to profiles table.
-- Used to redirect new users to the onboarding wizard
-- and skip it for existing users.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN NOT NULL DEFAULT FALSE;

-- Mark all existing users as already onboarded
-- (they set up their profiles through the old profile page)
UPDATE profiles SET onboarding_complete = TRUE
  WHERE field_of_study IS NOT NULL
    AND degree_level IS NOT NULL
    AND country_of_origin IS NOT NULL;

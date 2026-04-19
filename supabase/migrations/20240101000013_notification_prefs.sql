-- ============================================================
-- 013_notification_prefs.sql
-- Adds notification_preferences JSONB to profiles so users can
-- control which emails they receive from the platform.
-- Checked by /api/email/digest and /api/email/reminders before
-- sending each message.
-- ============================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB
    NOT NULL DEFAULT '{"digest_email": true, "deadline_reminders": true}'::jsonb;

-- Index for fast filtering when the email cron only wants opted-in users
CREATE INDEX IF NOT EXISTS idx_profiles_digest_pref
  ON profiles ((notification_preferences->>'digest_email'))
  WHERE (notification_preferences->>'digest_email') = 'true';

COMMENT ON COLUMN profiles.notification_preferences IS
  'User email notification preferences. Shape: {digest_email: bool, deadline_reminders: bool}';

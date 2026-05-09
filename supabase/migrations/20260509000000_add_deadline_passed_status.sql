-- ============================================================
-- Add 'Deadline Passed' status to application_tracker
-- Enable pg_cron for auto-transitioning expired applications
-- ============================================================

-- Add 'Deadline Passed' to the status CHECK constraint
ALTER TABLE application_tracker
  DROP CONSTRAINT IF EXISTS application_tracker_status_check;

ALTER TABLE application_tracker
  ADD CONSTRAINT application_tracker_status_check
  CHECK (
    status IN (
      'Interested',
      'In Progress',
      'Submitted',
      'Awaiting Decision',
      'Accepted',
      'Rejected',
      'Withdrawn',
      'Deadline Passed'
    )
  );

-- ============================================================
-- Enable pg_cron extension for scheduled jobs
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ============================================================
-- Function to auto-transition applications with passed deadlines
-- ============================================================
CREATE OR REPLACE FUNCTION auto_transition_deadline_passed()
RETURNS VOID AS $$
BEGIN
  -- Update applications where:
  -- - Deadline has passed (before today)
  -- - Status is not already a terminal state (Accepted, Rejected, Withdrawn, Deadline Passed)
  -- - Status is one of the active states (Interested, In Progress, Submitted, Awaiting Decision)
  UPDATE application_tracker
  SET status = 'Deadline Passed',
      updated_at = NOW()
  WHERE scholarship_id IN (
    SELECT id FROM scholarships
    WHERE application_deadline < CURRENT_DATE
  )
  AND status IN ('Interested', 'In Progress', 'Submitted', 'Awaiting Decision');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Schedule the cron job to run daily at midnight UTC
-- ============================================================
-- Remove existing job if it exists
SELECT cron.schedule(
  'auto-transition-deadline-passed',
  '0 0 * * *', -- Daily at midnight UTC
  'SELECT auto_transition_deadline_passed();'
) WHERE NOT EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'auto-transition-deadline-passed'
);

-- ============================================================
-- Grant necessary permissions for pg_cron
-- ============================================================
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL ON cron.job TO postgres;

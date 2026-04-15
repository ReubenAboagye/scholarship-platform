-- ============================================================
-- 009_match_history.sql
-- Persists AI matching sessions so users can revisit results
-- ============================================================

CREATE TABLE IF NOT EXISTS match_history (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  -- Snapshot of profile used at time of match (so history stays accurate
  -- even if the user later updates their profile)
  profile_snapshot  JSONB NOT NULL DEFAULT '{}',
  -- Full results array: [{scholarship:{...}, match_score, match_reasons}]
  results     JSONB       NOT NULL DEFAULT '[]',
  explanation TEXT,
  run_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookups per user ordered by recency
CREATE INDEX IF NOT EXISTS idx_match_history_user_run
  ON match_history(user_id, run_at DESC);

-- RLS
ALTER TABLE match_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "match_history_select_own"
  ON match_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "match_history_insert_own"
  ON match_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "match_history_delete_own"
  ON match_history FOR DELETE USING (auth.uid() = user_id);

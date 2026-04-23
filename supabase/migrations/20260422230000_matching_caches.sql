-- ============================================================
-- 018_matching_caches.sql
-- Caches to cut OpenRouter traffic on the matching hot path:
--   1. embedding_cache         — profile text  → 768-d vector
--   2. match_explanation_cache — (profile, top-N scholarships)
--                                → LLM explanation, 24h TTL
-- Plus a cleanup_match_history() helper so old rows can be
-- pruned on a schedule once pg_cron is enabled.
--
-- All three objects are service-role-only. None of them expose
-- user data through the Data API; only the server (admin
-- client) reads/writes them. RLS is enabled anyway as a
-- defence-in-depth measure in case policy assumptions change.
-- ============================================================


-- ── 1. Embedding cache ───────────────────────────────────────
-- Keyed on SHA-256 of the exact profile text we embed. Because
-- buildProfileText() is deterministic, repeat calls with the
-- same profile hit the cache and skip OpenRouter entirely.

CREATE TABLE IF NOT EXISTS public.embedding_cache (
  content_hash  TEXT        PRIMARY KEY,
  model         TEXT        NOT NULL,
  dimensions    INT         NOT NULL,
  embedding     vector(768) NOT NULL,
  hit_count     INT         NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_embedding_cache_last_used
  ON public.embedding_cache(last_used_at);

ALTER TABLE public.embedding_cache ENABLE ROW LEVEL SECURITY;

-- No policies: only service_role (which bypasses RLS) should ever
-- touch this table. authenticated/anon get zero access.


-- ── 2. Explanation cache ─────────────────────────────────────
-- Keyed on (profile hash, scholarship-ids hash). The profile
-- hash is the same SHA we use for embeddings; the IDs hash is
-- SHA-256 over the sorted top scholarship UUIDs. 24h TTL.
--
-- We store user_id too so we can invalidate a user's entries
-- cheaply if they update their profile (handled at app layer
-- via profile_hash change — user_id is mostly for debugging).

CREATE TABLE IF NOT EXISTS public.match_explanation_cache (
  profile_hash      TEXT        NOT NULL,
  scholarships_hash TEXT        NOT NULL,
  user_id           UUID        REFERENCES public.profiles(id) ON DELETE CASCADE,
  explanation       TEXT        NOT NULL,
  model             TEXT        NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at        TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (profile_hash, scholarships_hash)
);

CREATE INDEX IF NOT EXISTS idx_match_explanation_cache_expires
  ON public.match_explanation_cache(expires_at);

CREATE INDEX IF NOT EXISTS idx_match_explanation_cache_user
  ON public.match_explanation_cache(user_id);

ALTER TABLE public.match_explanation_cache ENABLE ROW LEVEL SECURITY;

-- Service-role-only, same rationale as above.


-- ── 3. Cleanup helpers ───────────────────────────────────────
-- Called manually (or by a future Edge Function / pg_cron job).
-- Each returns the number of rows removed.

CREATE OR REPLACE FUNCTION public.cleanup_match_history(
  retention_days INT DEFAULT 90
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM public.match_history
  WHERE run_at < NOW() - make_interval(days => GREATEST(retention_days, 1));
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_explanation_cache()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INT;
BEGIN
  DELETE FROM public.match_explanation_cache
  WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Service-role only. Revoke from the world, grant to service_role.
REVOKE EXECUTE ON FUNCTION public.cleanup_match_history(INT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_match_history(INT)
  TO service_role;

REVOKE EXECUTE ON FUNCTION public.cleanup_explanation_cache()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_explanation_cache()
  TO service_role;


-- ── 4. Extra index on match_history for range deletes ────────
-- idx_match_history_user_run already covers user+recency queries;
-- this partial index speeds up the retention sweep specifically.

CREATE INDEX IF NOT EXISTS idx_match_history_run_at
  ON public.match_history(run_at);

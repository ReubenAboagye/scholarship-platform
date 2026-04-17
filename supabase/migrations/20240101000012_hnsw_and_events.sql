-- ============================================================
-- 012_hnsw_and_events.sql
-- 1. Replaces IVFFlat with HNSW for better incremental inserts
--    and switches to 768-dim Matryoshka embeddings.
-- 2. Creates match_events table for feedback loop logging.
-- 3. Creates dismissed_scholarships table.
-- ============================================================

-- ── 1. Upgrade vector index: IVFFlat → HNSW ──────────────────
-- Drop old IVFFlat index first
DROP INDEX IF EXISTS idx_scholarships_embedding;

-- Resize embedding column to 768 dims
-- (existing 1536-dim embeddings will be cleared — re-run generate-embeddings.ts after push)
ALTER TABLE scholarships ALTER COLUMN embedding TYPE vector(768);

-- HNSW index: no training step, handles live inserts, 95%+ recall at defaults
-- m=16 (connections per layer), ef_construction=64 (build quality)
-- Use inner product ops since text-embedding-3-small outputs normalised vectors
CREATE INDEX IF NOT EXISTS idx_scholarships_embedding_hnsw
  ON scholarships USING hnsw (embedding vector_ip_ops)
  WITH (m = 16, ef_construction = 64);

-- ── 2. Update match_scholarships RPC to 768 dims ─────────────
CREATE OR REPLACE FUNCTION match_scholarships(
  query_embedding  vector(768),
  match_threshold  FLOAT DEFAULT 0.3,
  match_count      INT   DEFAULT 10
)
RETURNS TABLE (
  id                   UUID,
  name                 TEXT,
  slug                 TEXT,
  provider             TEXT,
  country              TEXT,
  degree_levels        TEXT[],
  fields_of_study      TEXT[],
  funding_type         TEXT,
  funding_amount       TEXT,
  description          TEXT,
  eligibility_criteria TEXT[],
  application_deadline DATE,
  application_url      TEXT,
  is_active            BOOLEAN,
  open_to_international BOOLEAN,
  renewable            BOOLEAN,
  min_gpa              NUMERIC,
  effort_minutes       INT,
  created_at           TIMESTAMPTZ,
  updated_at           TIMESTAMPTZ,
  similarity           FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id, s.name, s.slug, s.provider, s.country,
    s.degree_levels, s.fields_of_study,
    s.funding_type, s.funding_amount, s.description,
    s.eligibility_criteria, s.application_deadline,
    s.application_url, s.is_active,
    s.open_to_international, s.renewable, s.min_gpa, s.effort_minutes,
    s.created_at, s.updated_at,
    (s.embedding <#> query_embedding) * -1 AS similarity
  FROM scholarships s
  WHERE
    s.is_active = TRUE
    AND s.embedding IS NOT NULL
    AND (s.application_deadline IS NULL OR s.application_deadline > CURRENT_DATE)
    AND (s.embedding <#> query_embedding) * -1 > match_threshold
  ORDER BY s.embedding <#> query_embedding
  LIMIT match_count;
END;
$$;

-- ── 3. Match events table ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS match_events (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id        UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  scholarship_id UUID REFERENCES scholarships(id) ON DELETE CASCADE NOT NULL,
  event_type     TEXT NOT NULL CHECK (event_type IN (
    'impression', 'click', 'save', 'unsave',
    'apply_start', 'apply_submit',
    'dismiss', 'not_relevant', 'view_detail'
  )),
  rank_position  INT,
  match_score    NUMERIC,
  reason_code    TEXT CHECK (reason_code IN (
    'wrong_country', 'wrong_degree', 'not_interested', NULL
  )),
  session_id     UUID,
  occurred_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_events_user
  ON match_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_events_scholarship
  ON match_events(scholarship_id, event_type);

ALTER TABLE match_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "match_events_insert_own"
  ON match_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "match_events_select_own"
  ON match_events FOR SELECT USING (auth.uid() = user_id);

-- ── 4. Dismissed scholarships table ──────────────────────────
CREATE TABLE IF NOT EXISTS dismissed_scholarships (
  user_id        UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  scholarship_id UUID REFERENCES scholarships(id) ON DELETE CASCADE NOT NULL,
  reason_code    TEXT,
  dismissed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, scholarship_id)
);

ALTER TABLE dismissed_scholarships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dismissed_insert_own"
  ON dismissed_scholarships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dismissed_select_own"
  ON dismissed_scholarships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "dismissed_delete_own"
  ON dismissed_scholarships FOR DELETE USING (auth.uid() = user_id);

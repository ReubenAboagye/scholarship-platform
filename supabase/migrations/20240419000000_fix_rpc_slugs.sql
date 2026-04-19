-- ============================================================
-- 014_fix_rpc_slugs.sql
-- Ensures AI matching functions return the 'slug' column
-- so frontend URLs can use readable identifiers instead of UUIDs.
-- ============================================================

-- 1. Update standard match_scholarships (Vector Only)
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

-- 2. Define/Update hybrid_match_scholarships (Keyword + Vector)
-- This matches the parameters expected by src/lib/ai/matching.ts:
-- query_text, query_embedding, user_degree, user_citizenship, match_count
CREATE OR REPLACE FUNCTION hybrid_match_scholarships(
  query_text       TEXT,
  query_embedding  vector(768),
  user_degree      TEXT DEFAULT NULL,
  user_citizenship TEXT DEFAULT NULL,
  match_count      INT  DEFAULT 10
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
  citizenship_required TEXT[],
  created_at           TIMESTAMPTZ,
  updated_at           TIMESTAMPTZ,
  rrf_score            FLOAT
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH vector_matches AS (
    SELECT 
      s.id,
      (s.embedding <#> query_embedding) * -1 AS similarity,
      ROW_NUMBER() OVER (ORDER BY s.embedding <#> query_embedding) AS rank
    FROM scholarships s
    WHERE s.is_active = TRUE
      AND s.embedding IS NOT NULL
      AND (s.application_deadline IS NULL OR s.application_deadline > CURRENT_DATE)
      AND (user_degree IS NULL OR s.degree_levels @> ARRAY[user_degree])
  ),
  keyword_matches AS (
    SELECT 
      s.id,
      ts_rank_cd(to_tsvector('english', s.name || ' ' || s.description), plainto_tsquery('english', query_text)) AS rank_score,
      ROW_NUMBER() OVER (ORDER BY ts_rank_cd(to_tsvector('english', s.name || ' ' || s.description), plainto_tsquery('english', query_text)) DESC) AS rank
    FROM scholarships s
    WHERE s.is_active = TRUE
      AND (s.application_deadline IS NULL OR s.application_deadline > CURRENT_DATE)
      AND (user_degree IS NULL OR s.degree_levels @> ARRAY[user_degree])
  )
  SELECT
    s.id, s.name, s.slug, s.provider, s.country,
    s.degree_levels, s.fields_of_study,
    s.funding_type, s.funding_amount, s.description,
    s.eligibility_criteria, s.application_deadline,
    s.application_url, s.is_active,
    s.open_to_international, s.renewable, s.min_gpa, s.effort_minutes,
    s.citizenship_required,
    s.created_at, s.updated_at,
    COALESCE(1.0 / (60 + vm.rank), 0.0) + COALESCE(1.0 / (60 + km.rank), 0.0) AS rrf_score
  FROM scholarships s
  JOIN vector_matches vm ON s.id = vm.id
  LEFT JOIN keyword_matches km ON s.id = km.id
  ORDER BY rrf_score DESC
  LIMIT match_count;
END;
$$;

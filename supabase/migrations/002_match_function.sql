-- ============================================================
-- 002_match_function.sql
-- AI similarity search RPC function
-- ============================================================

CREATE OR REPLACE FUNCTION match_scholarships(
  query_embedding  vector(1536),
  match_threshold  FLOAT   DEFAULT 0.5,
  match_count      INT     DEFAULT 10
)
RETURNS TABLE (
  id                   UUID,
  name                 TEXT,
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
  created_at           TIMESTAMPTZ,
  updated_at           TIMESTAMPTZ,
  similarity           FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id, s.name, s.provider, s.country,
    s.degree_levels, s.fields_of_study,
    s.funding_type, s.funding_amount, s.description,
    s.eligibility_criteria, s.application_deadline,
    s.application_url, s.is_active, s.created_at, s.updated_at,
    1 - (s.embedding <=> query_embedding) AS similarity
  FROM scholarships s
  WHERE
    s.is_active = TRUE
    AND s.embedding IS NOT NULL
    AND 1 - (s.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

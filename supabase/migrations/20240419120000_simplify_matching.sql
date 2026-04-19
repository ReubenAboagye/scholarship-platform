-- ============================================================
-- 015_simplify_matching.sql
-- Right-sizes the matching pipeline for current scale (~20
-- scholarships across UK / USA / Germany / Canada).
--
-- What this does:
--   1. Drops hybrid_match_scholarships (broken + unhelpful at
--      this scale — BM25 on 20 tiny docs is pure noise, and
--      the RPC referenced a non-existent `fts` column).
--   2. Replaces match_scholarships with a gated variant that
--      applies hard eligibility filters in SQL (country,
--      degree, citizenship, GPA, deadline) before vector rank.
--   3. Keeps the HNSW index, match_events, dismissed_
--      scholarships — those are good and still used.
--
-- When to revisit:
--   Once the catalogue crosses ~200 scholarships, add a proper
--   `fts` generated column, recreate hybrid_match_scholarships
--   with a FULL OUTER JOIN (not INNER) on vector + keyword
--   CTEs, and bring back RRF fusion.
-- ============================================================

-- ── 1. Retire the hybrid RPC ─────────────────────────────────
-- It references a non-existent `fts` column and at 20-row
-- scale BM25 adds noise rather than signal. Drop cleanly.

DROP FUNCTION IF EXISTS hybrid_match_scholarships(text, vector, text, text, int);


-- ── 2. Replace match_scholarships with a gated variant ───────
-- Hard gates: is_active, deadline in future, embedding present,
--             degree level, country of study, citizenship,
--             minimum GPA.
-- Everything else (field match, funding quality, recency, etc.)
-- is handled in the application layer where it's easier to
-- reason about and tune.

DROP FUNCTION IF EXISTS match_scholarships(vector, float, int);
DROP FUNCTION IF EXISTS match_scholarships_gated(
  vector, text, text, text, numeric, int
);

CREATE FUNCTION match_scholarships_gated(
  query_embedding   vector(768),
  user_degree       TEXT    DEFAULT NULL,
  user_country      TEXT    DEFAULT NULL,   -- country of STUDY (destination)
  user_citizenship  TEXT    DEFAULT NULL,   -- nationality / passport
  user_gpa          NUMERIC DEFAULT NULL,
  match_count       INT     DEFAULT 10
)
RETURNS TABLE (
  id                    UUID,
  name                  TEXT,
  slug                  TEXT,
  provider              TEXT,
  country               TEXT,
  degree_levels         TEXT[],
  fields_of_study       TEXT[],
  funding_type          TEXT,
  funding_amount        TEXT,
  description           TEXT,
  eligibility_criteria  TEXT[],
  application_deadline  DATE,
  application_url       TEXT,
  is_active             BOOLEAN,
  open_to_international BOOLEAN,
  renewable             BOOLEAN,
  min_gpa               NUMERIC,
  effort_minutes        INT,
  citizenship_required  TEXT[],
  verified_at           TIMESTAMPTZ,
  created_at            TIMESTAMPTZ,
  updated_at            TIMESTAMPTZ,
  similarity            FLOAT
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
    s.citizenship_required, s.verified_at,
    s.created_at, s.updated_at,
    -- Inner product against unit-normalised embeddings; negate so
    -- higher = more similar. Range is roughly [-1, 1] but practical
    -- hits land in ~[0.2, 0.8].
    (s.embedding <#> query_embedding) * -1 AS similarity
  FROM scholarships s
  WHERE s.is_active = TRUE
    AND s.embedding IS NOT NULL
    AND (
      s.application_deadline IS NULL
      OR s.application_deadline > CURRENT_DATE
    )
    -- Degree: Any is a wildcard on the scholarship side.
    AND (
      user_degree IS NULL
      OR s.degree_levels = '{}'
      OR s.degree_levels @> ARRAY[user_degree]
      OR s.degree_levels @> ARRAY['Any']
    )
    -- Country of study: only filter if the user expressed a preference.
    AND (
      user_country IS NULL
      OR s.country = user_country
    )
    -- Citizenship: pass when scholarship has no restriction, OR when
    -- the restriction list contains 'any', OR when the user's nation-
    -- ality appears in the required list (case-insensitive).
    AND (
      user_citizenship IS NULL
      OR s.citizenship_required IS NULL
      OR s.citizenship_required = '{}'
      OR EXISTS (
        SELECT 1 FROM unnest(s.citizenship_required) AS c
        WHERE lower(c) = 'any'
           OR lower(user_citizenship) LIKE '%' || lower(c) || '%'
      )
    )
    -- GPA threshold: scholarships with no min_gpa always pass.
    AND (
      s.min_gpa IS NULL
      OR user_gpa IS NULL
      OR user_gpa >= s.min_gpa
    )
  ORDER BY s.embedding <#> query_embedding
  LIMIT match_count;
END;
$$;

GRANT EXECUTE ON FUNCTION match_scholarships_gated(
  vector, TEXT, TEXT, TEXT, NUMERIC, INT
) TO authenticated, service_role;

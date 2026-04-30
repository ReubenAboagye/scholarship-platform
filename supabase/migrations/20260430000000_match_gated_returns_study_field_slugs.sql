-- ============================================================
-- match_gated_returns_study_field_slugs.sql
-- Re-creates match_scholarships_gated so the RPC payload exposes
-- the normalized study_field_slugs array. Without this, callers
-- fall back to resolving slugs from fields_of_study labels in
-- TypeScript, which defeats the point of the taxonomy backfill.
-- Signature is unchanged so existing callers keep working.
-- ============================================================

DROP FUNCTION IF EXISTS public.match_scholarships_gated(
  vector, TEXT, TEXT, TEXT, NUMERIC, INT
);

CREATE FUNCTION public.match_scholarships_gated(
  query_embedding   vector(768),
  user_degree       TEXT    DEFAULT NULL,
  user_country      TEXT    DEFAULT NULL,
  user_citizenship  TEXT    DEFAULT NULL,
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
  study_field_slugs     TEXT[],
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
    s.degree_levels, s.fields_of_study, s.study_field_slugs,
    s.funding_type, s.funding_amount, s.description,
    s.eligibility_criteria, s.application_deadline,
    s.application_url, s.is_active,
    s.open_to_international, s.renewable, s.min_gpa, s.effort_minutes,
    s.citizenship_required, s.verified_at,
    s.created_at, s.updated_at,
    (s.embedding <#> query_embedding) * -1 AS similarity
  FROM public.scholarships s
  WHERE s.is_active = TRUE
    AND s.embedding IS NOT NULL
    AND (
      s.application_deadline IS NULL
      OR s.application_deadline > CURRENT_DATE
    )
    AND (
      user_degree IS NULL
      OR s.degree_levels = '{}'
      OR s.degree_levels @> ARRAY[user_degree]
      OR s.degree_levels @> ARRAY['Any']
    )
    AND (
      user_country IS NULL
      OR s.country = user_country
    )
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
    AND (
      s.min_gpa IS NULL
      OR user_gpa IS NULL
      OR user_gpa >= s.min_gpa
    )
  ORDER BY s.embedding <#> query_embedding
  LIMIT match_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.match_scholarships_gated(
  vector, TEXT, TEXT, TEXT, NUMERIC, INT
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.match_scholarships_gated(
  vector, TEXT, TEXT, TEXT, NUMERIC, INT
) TO service_role;

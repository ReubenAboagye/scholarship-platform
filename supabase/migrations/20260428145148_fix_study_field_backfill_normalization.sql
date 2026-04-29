-- ============================================================
-- fix_study_field_backfill_normalization.sql
-- The earlier SQL backfill lowercased too late, which caused
-- uppercase letters to be stripped by the regex. Recompute the
-- normalized slugs with the same normalization order used by the
-- TypeScript matcher helpers.
-- ============================================================

WITH normalized_profile_fields AS (
  SELECT
    p.id,
    sfa.field_slug,
    ROW_NUMBER() OVER (
      PARTITION BY p.id
      ORDER BY LENGTH(sfa.alias) DESC, sfa.alias ASC
    ) AS rn
  FROM public.profiles p
  JOIN public.study_field_aliases sfa
    ON REGEXP_REPLACE(
         REPLACE(LOWER(COALESCE(p.field_of_study, '')), '&', ' and '),
         '[^a-z0-9]+',
         ' ',
         'g'
       )
       =
       REGEXP_REPLACE(
         REPLACE(LOWER(sfa.alias), '&', ' and '),
         '[^a-z0-9]+',
         ' ',
         'g'
       )
  WHERE p.field_of_study IS NOT NULL
)
UPDATE public.profiles p
SET primary_field_slug = npf.field_slug
FROM normalized_profile_fields npf
WHERE p.id = npf.id
  AND npf.rn = 1;

WITH scholarship_slug_recompute AS (
  SELECT
    s.id,
    ARRAY(
      SELECT DISTINCT sfa.field_slug
      FROM UNNEST(COALESCE(s.fields_of_study, '{}')) AS field_label(label)
      JOIN public.study_field_aliases sfa
        ON REGEXP_REPLACE(
             REPLACE(LOWER(field_label.label), '&', ' and '),
             '[^a-z0-9]+',
             ' ',
             'g'
           )
           =
           REGEXP_REPLACE(
             REPLACE(LOWER(sfa.alias), '&', ' and '),
             '[^a-z0-9]+',
             ' ',
             'g'
           )
      ORDER BY sfa.field_slug
    ) AS matched_slugs
  FROM public.scholarships s
)
UPDATE public.scholarships s
SET study_field_slugs = COALESCE(ssr.matched_slugs, '{}')
FROM scholarship_slug_recompute ssr
WHERE s.id = ssr.id;

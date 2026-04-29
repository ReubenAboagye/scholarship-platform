-- ============================================================
-- expand_study_field_taxonomy_backfill.sql
-- Expands canonical field coverage for real catalog labels and
-- recomputes normalized field slugs using exact normalized alias
-- equality instead of broad substring matches.
-- ============================================================

INSERT INTO public.study_fields (slug, name, parent_slug, kind, sort_order)
VALUES
  ('journalism', 'Journalism', 'arts-law', 'field', 295),
  ('biology', 'Biology', 'natural-environment', 'field', 305),
  ('chemistry', 'Chemistry', 'natural-environment', 'field', 307),
  ('pharmacy', 'Pharmacy', 'health', 'field', 315),
  ('development-studies', 'Development Studies', 'policy-social', 'field', 335),
  ('peace-conflict-studies', 'Peace & Conflict Studies', 'policy-social', 'field', 337)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  parent_slug = EXCLUDED.parent_slug,
  kind = EXCLUDED.kind,
  sort_order = EXCLUDED.sort_order;

DELETE FROM public.study_field_aliases
WHERE alias = 'it';

INSERT INTO public.study_field_aliases (alias, field_slug)
VALUES
  ('journalism', 'journalism'),
  ('media studies', 'journalism'),
  ('communications', 'journalism'),
  ('biology', 'biology'),
  ('life sciences', 'biology'),
  ('chemistry', 'chemistry'),
  ('chemical sciences', 'chemistry'),
  ('pharmacy', 'pharmacy'),
  ('pharmaceutical sciences', 'pharmacy'),
  ('development studies', 'development-studies'),
  ('international development', 'development-studies'),
  ('peace studies', 'peace-conflict-studies'),
  ('conflict resolution', 'peace-conflict-studies'),
  ('peace and conflict studies', 'peace-conflict-studies'),
  ('conflict studies', 'peace-conflict-studies'),
  ('technology', 'computer-science'),
  ('science', 'natural-sciences'),
  ('data science', 'computer-science'),
  ('health sciences', 'medicine')
ON CONFLICT (alias) DO UPDATE
SET field_slug = EXCLUDED.field_slug;

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
    ON LOWER(REGEXP_REPLACE(REPLACE(COALESCE(p.field_of_study, ''), '&', ' and '), '[^a-z0-9]+', ' ', 'g'))
       = LOWER(REGEXP_REPLACE(REPLACE(sfa.alias, '&', ' and '), '[^a-z0-9]+', ' ', 'g'))
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
        ON LOWER(REGEXP_REPLACE(REPLACE(field_label.label, '&', ' and '), '[^a-z0-9]+', ' ', 'g'))
           = LOWER(REGEXP_REPLACE(REPLACE(sfa.alias, '&', ' and '), '[^a-z0-9]+', ' ', 'g'))
      ORDER BY sfa.field_slug
    ) AS matched_slugs
  FROM public.scholarships s
)
UPDATE public.scholarships s
SET study_field_slugs = COALESCE(ssr.matched_slugs, '{}')
FROM scholarship_slug_recompute ssr
WHERE s.id = ssr.id;

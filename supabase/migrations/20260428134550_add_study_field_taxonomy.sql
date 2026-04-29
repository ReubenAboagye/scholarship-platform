-- ============================================================
-- add_study_field_taxonomy.sql
-- Adds a canonical study-field taxonomy, alias table, and
-- normalized field slugs on profiles and scholarships so
-- matching no longer depends on substring heuristics alone.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.study_fields (
  slug        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  parent_slug TEXT REFERENCES public.study_fields(slug) ON DELETE SET NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('group', 'field')),
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.study_field_aliases (
  alias      TEXT PRIMARY KEY,
  field_slug TEXT NOT NULL REFERENCES public.study_fields(slug) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.study_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_field_aliases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "study_fields_public_read" ON public.study_fields;
CREATE POLICY "study_fields_public_read"
  ON public.study_fields
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "study_field_aliases_public_read" ON public.study_field_aliases;
CREATE POLICY "study_field_aliases_public_read"
  ON public.study_field_aliases
  FOR SELECT
  TO anon, authenticated
  USING (true);

INSERT INTO public.study_fields (slug, name, parent_slug, kind, sort_order)
VALUES
  ('academic', 'Academic', NULL, 'group', 0),
  ('sciences', 'Sciences', 'academic', 'group', 10),
  ('society', 'Society', 'academic', 'group', 20),
  ('humanities', 'Humanities', 'academic', 'group', 30),
  ('computing-engineering', 'Computing & Engineering', 'sciences', 'group', 40),
  ('natural-environment', 'Natural & Environmental Sciences', 'sciences', 'group', 50),
  ('health', 'Health', 'sciences', 'group', 60),
  ('policy-social', 'Policy & Social Sciences', 'society', 'group', 70),
  ('business-economics', 'Business & Economics', 'society', 'group', 80),
  ('arts-law', 'Arts, Design & Law', 'humanities', 'group', 90),
  ('agriculture-group', 'Agriculture', 'sciences', 'group', 100),
  ('other-discipline', 'Other', 'academic', 'group', 110),

  ('architecture', 'Architecture', 'arts-law', 'field', 200),
  ('agriculture', 'Agriculture', 'agriculture-group', 'field', 210),
  ('arts-humanities', 'Arts & Humanities', 'arts-law', 'field', 220),
  ('business-management', 'Business & Management', 'business-economics', 'field', 230),
  ('computer-science', 'Computer Science', 'computing-engineering', 'field', 240),
  ('economics', 'Economics', 'business-economics', 'field', 250),
  ('education', 'Education', 'policy-social', 'field', 260),
  ('engineering', 'Engineering', 'computing-engineering', 'field', 270),
  ('environmental-studies', 'Environmental Studies', 'natural-environment', 'field', 280),
  ('law', 'Law', 'arts-law', 'field', 290),
  ('mathematics', 'Mathematics', 'natural-environment', 'field', 300),
  ('medicine', 'Medicine', 'health', 'field', 310),
  ('natural-sciences', 'Natural Sciences', 'natural-environment', 'field', 320),
  ('political-science', 'Political Science', 'policy-social', 'field', 330),
  ('psychology', 'Psychology', 'policy-social', 'field', 340),
  ('public-health', 'Public Health', 'health', 'field', 350),
  ('public-policy', 'Public Policy', 'policy-social', 'field', 360),
  ('social-sciences', 'Social Sciences', 'policy-social', 'field', 370),
  ('other', 'Other', 'other-discipline', 'field', 380)
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  parent_slug = EXCLUDED.parent_slug,
  kind = EXCLUDED.kind,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.study_field_aliases (alias, field_slug)
VALUES
  ('architecture', 'architecture'),
  ('built environment', 'architecture'),
  ('urban design', 'architecture'),
  ('agriculture', 'agriculture'),
  ('agricultural science', 'agriculture'),
  ('agricultural sciences', 'agriculture'),
  ('agronomy', 'agriculture'),
  ('arts & humanities', 'arts-humanities'),
  ('arts and humanities', 'arts-humanities'),
  ('humanities', 'arts-humanities'),
  ('liberal arts', 'arts-humanities'),
  ('business', 'business-management'),
  ('business & management', 'business-management'),
  ('business and management', 'business-management'),
  ('management', 'business-management'),
  ('mba', 'business-management'),
  ('computer science', 'computer-science'),
  ('computing', 'computer-science'),
  ('software engineering', 'computer-science'),
  ('information technology', 'computer-science'),
  ('it', 'computer-science'),
  ('data science', 'computer-science'),
  ('economics', 'economics'),
  ('economic policy', 'economics'),
  ('economy', 'economics'),
  ('education', 'education'),
  ('teaching', 'education'),
  ('curriculum studies', 'education'),
  ('engineering', 'engineering'),
  ('mechanical engineering', 'engineering'),
  ('civil engineering', 'engineering'),
  ('electrical engineering', 'engineering'),
  ('chemical engineering', 'engineering'),
  ('environmental studies', 'environmental-studies'),
  ('environmental science', 'environmental-studies'),
  ('sustainability studies', 'environmental-studies'),
  ('sustainability', 'environmental-studies'),
  ('law', 'law'),
  ('legal studies', 'law'),
  ('jurisprudence', 'law'),
  ('mathematics', 'mathematics'),
  ('math', 'mathematics'),
  ('statistics', 'mathematics'),
  ('applied mathematics', 'mathematics'),
  ('medicine', 'medicine'),
  ('medical science', 'medicine'),
  ('clinical medicine', 'medicine'),
  ('biomedical science', 'medicine'),
  ('natural sciences', 'natural-sciences'),
  ('biology', 'natural-sciences'),
  ('chemistry', 'natural-sciences'),
  ('physics', 'natural-sciences'),
  ('political science', 'political-science'),
  ('international relations', 'political-science'),
  ('governance', 'political-science'),
  ('psychology', 'psychology'),
  ('behavioral science', 'psychology'),
  ('behavioural science', 'psychology'),
  ('public health', 'public-health'),
  ('global health', 'public-health'),
  ('epidemiology', 'public-health'),
  ('healthcare', 'public-health'),
  ('public policy', 'public-policy'),
  ('policy studies', 'public-policy'),
  ('development policy', 'public-policy'),
  ('social policy', 'public-policy'),
  ('social sciences', 'social-sciences'),
  ('sociology', 'social-sciences'),
  ('anthropology', 'social-sciences'),
  ('development studies', 'social-sciences'),
  ('other', 'other'),
  ('general studies', 'other'),
  ('interdisciplinary studies', 'other')
ON CONFLICT (alias) DO UPDATE
SET field_slug = EXCLUDED.field_slug;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS primary_field_slug TEXT REFERENCES public.study_fields(slug);

ALTER TABLE public.scholarships
  ADD COLUMN IF NOT EXISTS study_field_slugs TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_profiles_primary_field_slug
  ON public.profiles(primary_field_slug)
  WHERE primary_field_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_scholarships_study_field_slugs
  ON public.scholarships USING gin(study_field_slugs);

WITH profile_alias_match AS (
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
       LIKE '%' || LOWER(REGEXP_REPLACE(REPLACE(sfa.alias, '&', ' and '), '[^a-z0-9]+', ' ', 'g')) || '%'
  WHERE p.field_of_study IS NOT NULL
    AND COALESCE(p.primary_field_slug, '') = ''
)
UPDATE public.profiles p
SET primary_field_slug = pam.field_slug
FROM profile_alias_match pam
WHERE p.id = pam.id
  AND pam.rn = 1;

WITH scholarship_alias_match AS (
  SELECT
    s.id,
    ARRAY(
      SELECT DISTINCT sfa.field_slug
      FROM UNNEST(COALESCE(s.fields_of_study, '{}')) AS field_label(label)
      JOIN public.study_field_aliases sfa
        ON LOWER(REGEXP_REPLACE(REPLACE(field_label.label, '&', ' and '), '[^a-z0-9]+', ' ', 'g'))
           LIKE '%' || LOWER(REGEXP_REPLACE(REPLACE(sfa.alias, '&', ' and '), '[^a-z0-9]+', ' ', 'g')) || '%'
      ORDER BY sfa.field_slug
    ) AS matched_slugs
  FROM public.scholarships s
)
UPDATE public.scholarships s
SET study_field_slugs = COALESCE(sam.matched_slugs, '{}')
FROM scholarship_alias_match sam
WHERE s.id = sam.id;

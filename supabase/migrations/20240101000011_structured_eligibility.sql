-- ============================================================
-- 011_structured_eligibility.sql
-- Adds typed eligibility columns to scholarships for hard-gate
-- SQL filtering, and high-signal fields to profiles for matching.
-- ============================================================

-- ── Scholarships: structured eligibility ─────────────────────

ALTER TABLE scholarships
  ADD COLUMN IF NOT EXISTS citizenship_required   TEXT[]      DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS open_to_international  BOOLEAN     NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS min_gpa                NUMERIC(3,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS renewable              BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS effort_minutes         INT         DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS verified_at            TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS content_hash           TEXT        DEFAULT NULL;

-- GIN indexes for fast array containment queries
CREATE INDEX IF NOT EXISTS idx_scholarships_citizenship
  ON scholarships USING gin(citizenship_required);

CREATE INDEX IF NOT EXISTS idx_scholarships_degree_gin
  ON scholarships USING gin(degree_levels);

-- Partial index: only future active scholarships (used in every match query)
CREATE INDEX IF NOT EXISTS idx_scholarships_active_future
  ON scholarships(application_deadline)
  WHERE is_active = TRUE;

-- ── Backfill structured fields for the 20 seeded scholarships ─

-- UK
UPDATE scholarships SET
  open_to_international = TRUE,
  renewable = FALSE,
  effort_minutes = 180,
  verified_at = NOW()
WHERE slug = 'chevening-scholarship';

UPDATE scholarships SET
  open_to_international = TRUE,
  renewable = FALSE,
  effort_minutes = 180,
  verified_at = NOW()
WHERE slug = 'commonwealth-scholarship';

UPDATE scholarships SET
  open_to_international = TRUE,
  renewable = TRUE,
  effort_minutes = 240,
  verified_at = NOW()
WHERE slug = 'gates-cambridge-scholarship';

UPDATE scholarships SET
  open_to_international = TRUE,
  renewable = TRUE,
  effort_minutes = 240,
  verified_at = NOW()
WHERE slug = 'rhodes-scholarship';

UPDATE scholarships SET
  open_to_international = TRUE,
  renewable = FALSE,
  effort_minutes = 120,
  verified_at = NOW()
WHERE slug = 'great-scholarship';

-- USA
UPDATE scholarships SET
  open_to_international = TRUE,
  renewable = TRUE,
  effort_minutes = 300,
  verified_at = NOW()
WHERE slug = 'fulbright-foreign-student-program';

UPDATE scholarships SET
  open_to_international = TRUE,
  renewable = FALSE,
  effort_minutes = 240,
  verified_at = NOW()
WHERE slug = 'hubert-h-humphrey-fellowship';

UPDATE scholarships SET
  open_to_international = FALSE,
  citizenship_required = ARRAY['African'],
  renewable = TRUE,
  effort_minutes = 180,
  verified_at = NOW()
WHERE slug = 'mastercard-foundation-scholars';

UPDATE scholarships SET
  open_to_international = TRUE,
  renewable = FALSE,
  effort_minutes = 180,
  verified_at = NOW()
WHERE slug = 'joint-japan-world-bank-scholarship';

UPDATE scholarships SET
  open_to_international = TRUE,
  renewable = FALSE,
  effort_minutes = 120,
  verified_at = NOW()
WHERE slug = 'aga-khan-foundation-scholarship';

-- Germany
UPDATE scholarships SET
  open_to_international = TRUE,
  renewable = TRUE,
  effort_minutes = 120,
  verified_at = NOW()
WHERE slug = 'daad-scholarship';

UPDATE scholarships SET
  open_to_international = TRUE,
  renewable = TRUE,
  effort_minutes = 90,
  verified_at = NOW()
WHERE slug = 'heinrich-boll-foundation-scholarship';

UPDATE scholarships SET
  open_to_international = TRUE,
  renewable = TRUE,
  effort_minutes = 90,
  verified_at = NOW()
WHERE slug = 'konrad-adenauer-scholarship';

UPDATE scholarships SET
  open_to_international = TRUE,
  renewable = TRUE,
  effort_minutes = 90,
  verified_at = NOW()
WHERE slug = 'friedrich-ebert-foundation-scholarship';

UPDATE scholarships SET
  open_to_international = TRUE,
  renewable = TRUE,
  effort_minutes = 60,
  verified_at = NOW()
WHERE slug = 'deutschlandstipendium';

-- Canada
UPDATE scholarships SET
  open_to_international = TRUE,
  renewable = TRUE,
  min_gpa = 3.5,
  effort_minutes = 240,
  verified_at = NOW()
WHERE slug = 'vanier-canada-graduate-scholarship';

UPDATE scholarships SET
  open_to_international = TRUE,
  renewable = TRUE,
  effort_minutes = 300,
  verified_at = NOW()
WHERE slug = 'trudeau-foundation-scholarship';

UPDATE scholarships SET
  open_to_international = FALSE,
  citizenship_required = ARRAY['non-Canadian'],
  renewable = TRUE,
  effort_minutes = 120,
  verified_at = NOW()
WHERE slug = 'ontario-trillium-scholarship';

UPDATE scholarships SET
  open_to_international = TRUE,
  min_gpa = 3.5,
  renewable = TRUE,
  effort_minutes = 90,
  verified_at = NOW()
WHERE slug = 'ubc-graduate-award';

UPDATE scholarships SET
  open_to_international = TRUE,
  renewable = FALSE,
  effort_minutes = 180,
  verified_at = NOW()
WHERE slug = 'lester-b-pearson-scholarship';

-- ── Profiles: high-signal matching fields ─────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS citizenship      TEXT     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS financial_need   BOOLEAN  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS career_goals     TEXT     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS interests        TEXT[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS extracurriculars TEXT[]   DEFAULT '{}';

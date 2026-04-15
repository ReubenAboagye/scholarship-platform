-- ============================================================
-- 005_add_slugs.sql
-- Add slug column for readable URLs
-- ============================================================

ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Populate slugs for all 20 seeded scholarships
UPDATE scholarships SET slug = 'chevening-scholarship'               WHERE name = 'Chevening Scholarship';
UPDATE scholarships SET slug = 'commonwealth-scholarship'            WHERE name = 'Commonwealth Scholarship';
UPDATE scholarships SET slug = 'gates-cambridge-scholarship'         WHERE name = 'Gates Cambridge Scholarship';
UPDATE scholarships SET slug = 'rhodes-scholarship'                  WHERE name = 'Rhodes Scholarship';
UPDATE scholarships SET slug = 'great-scholarship'                   WHERE name = 'GREAT Scholarship';
UPDATE scholarships SET slug = 'fulbright-foreign-student-program'   WHERE name = 'Fulbright Foreign Student Program';
UPDATE scholarships SET slug = 'hubert-h-humphrey-fellowship'        WHERE name = 'Hubert H. Humphrey Fellowship';
UPDATE scholarships SET slug = 'mastercard-foundation-scholars'      WHERE name = 'Mastercard Foundation Scholars Program';
UPDATE scholarships SET slug = 'joint-japan-world-bank-scholarship'  WHERE name = 'Joint Japan/World Bank Graduate Scholarship';
UPDATE scholarships SET slug = 'aga-khan-foundation-scholarship'     WHERE name = 'Aga Khan Foundation International Scholarship';
UPDATE scholarships SET slug = 'daad-scholarship'                    WHERE name = 'DAAD Scholarship';
UPDATE scholarships SET slug = 'heinrich-boll-foundation-scholarship' WHERE name = 'Heinrich Böll Foundation Scholarship';
UPDATE scholarships SET slug = 'konrad-adenauer-scholarship'         WHERE name = 'Konrad-Adenauer-Stiftung Scholarship';
UPDATE scholarships SET slug = 'friedrich-ebert-foundation-scholarship' WHERE name = 'Friedrich Ebert Foundation Scholarship';
UPDATE scholarships SET slug = 'deutschlandstipendium'               WHERE name = 'Deutschlandstipendium';
UPDATE scholarships SET slug = 'vanier-canada-graduate-scholarship'  WHERE name = 'Vanier Canada Graduate Scholarship';
UPDATE scholarships SET slug = 'trudeau-foundation-scholarship'      WHERE name = 'Trudeau Foundation Scholarship';
UPDATE scholarships SET slug = 'ontario-trillium-scholarship'        WHERE name = 'Ontario Trillium Scholarship';
UPDATE scholarships SET slug = 'ubc-graduate-award'                  WHERE name = 'University of British Columbia Graduate Award';
UPDATE scholarships SET slug = 'lester-b-pearson-scholarship'        WHERE name = 'Lester B. Pearson International Scholarship';

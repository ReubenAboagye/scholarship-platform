-- ============================================================
-- 006_auto_slug_trigger.sql
-- Auto-generate URL-friendly slugs on every scholarship INSERT
-- Run AFTER 005_add_slugs.sql
-- ============================================================

-- Function: converts scholarship name → kebab-case slug
-- e.g. "Gates Cambridge Scholarship" → "gates-cambridge-scholarship"
-- Handles special chars, accents, extra spaces, duplicates
CREATE OR REPLACE FUNCTION generate_scholarship_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter    INT := 0;
BEGIN
  -- Only set slug if not already provided
  IF NEW.slug IS NOT NULL AND NEW.slug != '' THEN
    RETURN NEW;
  END IF;

  -- Convert name to lowercase kebab-case slug
  base_slug := lower(NEW.name);

  -- Replace accented characters
  base_slug := translate(base_slug,
    'àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ',
    'aaaaaàaceeeeiiiidnoooooouuuuytby'
  );

  -- Replace anything that isn't a letter or digit with a hyphen
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');

  -- Trim leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);

  -- Handle duplicates by appending -2, -3, etc.
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM scholarships WHERE slug = final_slug AND id != NEW.id) LOOP
    counter    := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger: fires before every INSERT on scholarships
DROP TRIGGER IF EXISTS trg_scholarship_slug ON scholarships;
CREATE TRIGGER trg_scholarship_slug
  BEFORE INSERT ON scholarships
  FOR EACH ROW EXECUTE FUNCTION generate_scholarship_slug();

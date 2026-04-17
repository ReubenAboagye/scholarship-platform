-- ============================================================
-- 010_add_countries_table.sql
-- ScholarBridge AI Platform — Supabase PostgreSQL
-- ============================================================

CREATE TABLE IF NOT EXISTS countries (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name                 TEXT NOT NULL,
  code                 TEXT NOT NULL UNIQUE,
  flag_code            TEXT NOT NULL,
  description          TEXT NOT NULL,
  notable_scholarships TEXT NOT NULL,
  image_url            TEXT NOT NULL,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  display_order        INTEGER DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "countries_public_read" ON countries;
CREATE POLICY "countries_public_read" ON countries FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "countries_admin_all" ON countries;
CREATE POLICY "countries_admin_all"   ON countries FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
DROP TRIGGER IF EXISTS trg_countries_updated_at ON countries;
CREATE TRIGGER trg_countries_updated_at
  BEFORE UPDATE ON countries FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO countries (name, code, flag_code, description, notable_scholarships, image_url, display_order)
VALUES 
('United Kingdom', 'UK', 'gb', 'Study in the home of prestigious universities like Oxford and Cambridge. The UK offers a world-renowned higher education system and a deep academic heritage.', 'Chevening, Gates Cambridge, Rhodes', 'https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?w=800&q=80', 10),
('United States', 'USA', 'us', 'Access world-leading research facilities and diverse campus cultures across all 50 states. The USA remains the top destination for international graduate study.', 'Fulbright, Mastercard Foundation', 'https://images.unsplash.com/photo-1508612761958-e931d843bdd5?w=800&q=80', 20),
('Germany', 'Germany', 'de', 'Benefit from tuition-free education at world-class public institutions. Germany is a global leader in innovation, engineering, and the technical sciences.', 'DAAD, Heinrich Boll, Konrad-Adenauer', 'https://images.unsplash.com/photo-1543837173-6c26bc89937a?w=800&q=80', 30),
('Canada', 'Canada', 'ca', 'Known for its welcoming atmosphere and strong post-graduation work opportunities. Canada offers high-quality research and a safe, inclusive environment.', 'Vanier, Lester B. Pearson, Trudeau', 'https://images.unsplash.com/photo-1550439062-609e1531270e?w=800&q=80', 40)
ON CONFLICT (code) DO NOTHING;

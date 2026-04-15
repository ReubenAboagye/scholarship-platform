-- ============================================================
-- 001_initial_schema.sql
-- ScholarMatch Platform — Supabase PostgreSQL
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable pgvector for AI similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id                UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email             TEXT NOT NULL,
  full_name         TEXT,
  country_of_origin TEXT,
  field_of_study    TEXT,
  degree_level      TEXT CHECK (degree_level IN ('Undergraduate','Masters','PhD','Any')),
  gpa               DECIMAL(3,2),
  bio               TEXT,
  avatar_url        TEXT,
  role              TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user','admin')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SCHOLARSHIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS scholarships (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name                 TEXT NOT NULL,
  provider             TEXT NOT NULL,
  country              TEXT NOT NULL CHECK (country IN ('UK','USA','Germany','Canada')),
  degree_levels        TEXT[] NOT NULL DEFAULT '{}',
  fields_of_study      TEXT[] NOT NULL DEFAULT '{}',
  funding_type         TEXT NOT NULL CHECK (funding_type IN ('Full','Partial','Tuition Only','Living Allowance')),
  funding_amount       TEXT NOT NULL,
  description          TEXT NOT NULL,
  eligibility_criteria TEXT[] NOT NULL DEFAULT '{}',
  application_deadline DATE,
  application_url      TEXT NOT NULL,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  embedding            vector(1536),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SAVED SCHOLARSHIPS
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_scholarships (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  scholarship_id UUID REFERENCES scholarships(id) ON DELETE CASCADE NOT NULL,
  saved_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, scholarship_id)
);

-- ============================================================
-- APPLICATION TRACKER
-- ============================================================
CREATE TABLE IF NOT EXISTS application_tracker (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  scholarship_id    UUID REFERENCES scholarships(id) ON DELETE CASCADE NOT NULL,
  status            TEXT NOT NULL DEFAULT 'Interested' CHECK (
    status IN ('Interested','In Progress','Submitted','Awaiting Decision','Accepted','Rejected','Withdrawn')
  ),
  notes             TEXT,
  deadline_reminder DATE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, scholarship_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_scholarships_country   ON scholarships(country);
CREATE INDEX IF NOT EXISTS idx_scholarships_active    ON scholarships(is_active);
CREATE INDEX IF NOT EXISTS idx_scholarships_deadline  ON scholarships(application_deadline);
CREATE INDEX IF NOT EXISTS idx_saved_user             ON saved_scholarships(user_id);
CREATE INDEX IF NOT EXISTS idx_tracker_user           ON application_tracker(user_id);
CREATE INDEX IF NOT EXISTS idx_tracker_status         ON application_tracker(status);

-- Vector index (cosine similarity)
CREATE INDEX IF NOT EXISTS idx_scholarships_embedding
  ON scholarships USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_scholarships_updated_at
  BEFORE UPDATE ON scholarships FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_tracker_updated_at
  BEFORE UPDATE ON application_tracker FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE scholarships       ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_tracker ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "profiles_select_own"  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_insert_own"  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_admin_all"   ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Scholarships: public read for active, admin write
CREATE POLICY "scholarships_public_read" ON scholarships FOR SELECT USING (is_active = TRUE);
CREATE POLICY "scholarships_admin_all"   ON scholarships FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Saved
CREATE POLICY "saved_select_own" ON saved_scholarships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "saved_insert_own" ON saved_scholarships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "saved_delete_own" ON saved_scholarships FOR DELETE USING (auth.uid() = user_id);

-- Tracker
CREATE POLICY "tracker_select_own" ON application_tracker FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tracker_insert_own" ON application_tracker FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tracker_update_own" ON application_tracker FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tracker_delete_own" ON application_tracker FOR DELETE USING (auth.uid() = user_id);

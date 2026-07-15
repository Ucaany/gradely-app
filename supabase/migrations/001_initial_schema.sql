-- ============================================================
-- Gradely MVP — Database Migration
-- Semua tabel, indexes, RLS policies
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUM types
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('student', 'lecturer', 'admin', 'company');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE grade_value AS ENUM ('A', 'A-', 'BA', 'B+', 'B', 'B-', 'C', 'D', 'E');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE portfolio_status AS ENUM ('completed', 'ongoing');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE whatsapp_status AS ENUM ('pending', 'sent', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE degree_level AS ENUM ('S1', 'S2', 'S3', 'D3', 'D4');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- TABLE: universities
-- ============================================================
CREATE TABLE IF NOT EXISTS universities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  short_name  TEXT,
  city        TEXT,
  province    TEXT,
  website     TEXT,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: study_programs
-- ============================================================
CREATE TABLE IF NOT EXISTS study_programs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id   UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  short_name      TEXT,
  degree_level    degree_level DEFAULT 'S1',
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_study_programs_university ON study_programs(university_id);

-- ============================================================
-- TABLE: academic_rules
-- ============================================================
CREATE TABLE IF NOT EXISTS academic_rules (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id          UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  study_program_id       UUID REFERENCES study_programs(id) ON DELETE SET NULL,

  total_sks_graduation   INTEGER NOT NULL DEFAULT 144,
  normal_semester        INTEGER NOT NULL DEFAULT 8,
  max_semester           INTEGER NOT NULL DEFAULT 14,
  min_gpa                DECIMAL(3,2) NOT NULL DEFAULT 2.00,
  max_sks_per_semester   INTEGER NOT NULL DEFAULT 24,
  min_sks_per_semester   INTEGER NOT NULL DEFAULT 12,
  passing_grade          grade_value NOT NULL DEFAULT 'D',
  grade_scale            JSONB NOT NULL DEFAULT '{"A":4.0,"A-":3.75,"BA":3.5,"B+":3.25,"B":3.0,"B-":2.75,"C":2.0,"D":1.0,"E":0.0}',

  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_academic_rules_university ON academic_rules(university_id);
CREATE INDEX IF NOT EXISTS idx_academic_rules_program ON academic_rules(study_program_id);

-- ============================================================
-- TABLE: users
-- (extends Supabase auth.users via id FK)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id     UUID REFERENCES universities(id) ON DELETE SET NULL,
  study_program_id  UUID REFERENCES study_programs(id) ON DELETE SET NULL,
  role              user_role NOT NULL DEFAULT 'student',
  full_name         TEXT NOT NULL,
  email             TEXT NOT NULL UNIQUE,
  nim               TEXT UNIQUE,
  phone             TEXT,
  avatar_url        TEXT,
  current_semester  INTEGER CHECK (current_semester >= 1 AND current_semester <= 14),
  profile_visible   BOOLEAN DEFAULT FALSE,
  is_active         BOOLEAN DEFAULT TRUE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_university ON users(university_id);
CREATE INDEX IF NOT EXISTS idx_users_study_program ON users(study_program_id);
CREATE INDEX IF NOT EXISTS idx_users_nim ON users(nim);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================
-- TABLE: student_semesters
-- ============================================================
CREATE TABLE IF NOT EXISTS student_semesters (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  semester_number  INTEGER NOT NULL CHECK (semester_number >= 1 AND semester_number <= 14),
  academic_year    TEXT NOT NULL,
  is_active        BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(student_id, semester_number)
);

CREATE INDEX IF NOT EXISTS idx_student_semesters_student ON student_semesters(student_id);

-- ============================================================
-- TABLE: student_grades
-- ============================================================
CREATE TABLE IF NOT EXISTS student_grades (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  semester_number  INTEGER NOT NULL CHECK (semester_number >= 1 AND semester_number <= 14),
  course_name      TEXT NOT NULL,
  credits          INTEGER NOT NULL CHECK (credits >= 1 AND credits <= 6),
  grade            grade_value NOT NULL,
  grade_points     DECIMAL(3,2) NOT NULL DEFAULT 0,
  is_retake        BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_grades_student ON student_grades(student_id);
CREATE INDEX IF NOT EXISTS idx_student_grades_semester ON student_grades(student_id, semester_number);

-- ============================================================
-- TABLE: student_targets
-- ============================================================
CREATE TABLE IF NOT EXISTS student_targets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  target_semester  INTEGER NOT NULL DEFAULT 8 CHECK (target_semester >= 7 AND target_semester <= 14),
  career_goal      TEXT,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: portfolio_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS portfolio_categories (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code  TEXT NOT NULL UNIQUE,
  name  TEXT NOT NULL
);

-- ============================================================
-- TABLE: student_portfolios
-- ============================================================
CREATE TABLE IF NOT EXISTS student_portfolios (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id  UUID REFERENCES portfolio_categories(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  skills       TEXT[] DEFAULT '{}',
  start_date   DATE,
  end_date     DATE,
  status       portfolio_status DEFAULT 'completed',
  url_gdrive   TEXT,
  url_github   TEXT,
  url_behance  TEXT,
  url_linkedin TEXT,
  url_youtube  TEXT,
  url_website  TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_portfolios_student ON student_portfolios(student_id);
CREATE INDEX IF NOT EXISTS idx_student_portfolios_category ON student_portfolios(category_id);

-- ============================================================
-- TABLE: career_interests
-- ============================================================
CREATE TABLE IF NOT EXISTS career_interests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest    TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(student_id, interest)
);

CREATE INDEX IF NOT EXISTS idx_career_interests_student ON career_interests(student_id);

-- ============================================================
-- TABLE: companies
-- ============================================================
CREATE TABLE IF NOT EXISTS companies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
  company_name  TEXT NOT NULL,
  industry      TEXT,
  description   TEXT,
  website       TEXT,
  logo_url      TEXT,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_user ON companies(user_id);

-- ============================================================
-- TABLE: company_categories
-- ============================================================
CREATE TABLE IF NOT EXISTS company_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  category    TEXT NOT NULL,

  UNIQUE(company_id, category)
);

CREATE INDEX IF NOT EXISTS idx_company_categories_company ON company_categories(company_id);

-- ============================================================
-- TABLE: advisor_students
-- ============================================================
CREATE TABLE IF NOT EXISTS advisor_students (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecturer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  join_code   TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(lecturer_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_advisor_students_lecturer ON advisor_students(lecturer_id);
CREATE INDEX IF NOT EXISTS idx_advisor_students_student ON advisor_students(student_id);

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);

-- ============================================================
-- TABLE: whatsapp_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  phone_number  TEXT NOT NULL,
  message       TEXT NOT NULL,
  status        whatsapp_status DEFAULT 'pending',
  error_message TEXT,
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_recipient ON whatsapp_logs(recipient_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_logs_status ON whatsapp_logs(status);

-- ============================================================
-- TABLE: settings
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
  key           TEXT NOT NULL,
  value         TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(university_id, key)
);

CREATE INDEX IF NOT EXISTS idx_settings_university ON settings(university_id);

-- ============================================================
-- TRIGGERS: updated_at auto-update
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_academic_rules
    BEFORE UPDATE ON academic_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_student_grades
    BEFORE UPDATE ON student_grades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_student_targets
    BEFORE UPDATE ON student_targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_student_portfolios
    BEFORE UPDATE ON student_portfolios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_companies
    BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at_settings
    BEFORE UPDATE ON settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS TEXT AS $$
  SELECT role::TEXT FROM users WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ---- universities ----
CREATE POLICY "universities_read_all" ON universities
  FOR SELECT USING (TRUE);

CREATE POLICY "universities_admin_write" ON universities
  FOR ALL USING (auth_user_role() = 'admin');

-- ---- study_programs ----
CREATE POLICY "study_programs_read_all" ON study_programs
  FOR SELECT USING (TRUE);

CREATE POLICY "study_programs_admin_write" ON study_programs
  FOR ALL USING (auth_user_role() = 'admin');

-- ---- academic_rules ----
CREATE POLICY "academic_rules_read_all" ON academic_rules
  FOR SELECT USING (TRUE);

CREATE POLICY "academic_rules_admin_write" ON academic_rules
  FOR ALL USING (auth_user_role() = 'admin');

-- ---- users ----
-- Mahasiswa bisa baca/update data sendiri
CREATE POLICY "users_own_read" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "users_own_update" ON users
  FOR UPDATE USING (id = auth.uid());

-- Admin bisa baca dan kelola semua user
CREATE POLICY "users_admin_all" ON users
  FOR ALL USING (auth_user_role() = 'admin');

-- Dosen bisa baca mahasiswa bimbingannya
CREATE POLICY "users_lecturer_read_advisees" ON users
  FOR SELECT USING (
    auth_user_role() = 'lecturer'
    AND (
      id = auth.uid()
      OR id IN (
        SELECT student_id FROM advisor_students
        WHERE lecturer_id = auth.uid()
      )
    )
  );

-- Company bisa baca profil mahasiswa yang consent aktif
CREATE POLICY "users_company_read_visible" ON users
  FOR SELECT USING (
    auth_user_role() = 'company'
    AND role = 'student'
    AND profile_visible = TRUE
  );

-- ---- student_grades ----
CREATE POLICY "grades_student_own" ON student_grades
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "grades_lecturer_read" ON student_grades
  FOR SELECT USING (
    auth_user_role() = 'lecturer'
    AND student_id IN (
      SELECT student_id FROM advisor_students WHERE lecturer_id = auth.uid()
    )
  );

CREATE POLICY "grades_admin_all" ON student_grades
  FOR ALL USING (auth_user_role() = 'admin');

-- ---- student_semesters ----
CREATE POLICY "semesters_student_own" ON student_semesters
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "semesters_lecturer_read" ON student_semesters
  FOR SELECT USING (
    auth_user_role() = 'lecturer'
    AND student_id IN (
      SELECT student_id FROM advisor_students WHERE lecturer_id = auth.uid()
    )
  );

CREATE POLICY "semesters_admin_all" ON student_semesters
  FOR ALL USING (auth_user_role() = 'admin');

-- ---- student_targets ----
CREATE POLICY "targets_student_own" ON student_targets
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "targets_lecturer_read" ON student_targets
  FOR SELECT USING (
    auth_user_role() = 'lecturer'
    AND student_id IN (
      SELECT student_id FROM advisor_students WHERE lecturer_id = auth.uid()
    )
  );

CREATE POLICY "targets_admin_all" ON student_targets
  FOR ALL USING (auth_user_role() = 'admin');

-- ---- portfolio_categories ----
CREATE POLICY "portfolio_categories_read_all" ON portfolio_categories
  FOR SELECT USING (TRUE);

CREATE POLICY "portfolio_categories_admin_write" ON portfolio_categories
  FOR ALL USING (auth_user_role() = 'admin');

-- ---- student_portfolios ----
CREATE POLICY "portfolios_student_own" ON student_portfolios
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "portfolios_lecturer_read" ON student_portfolios
  FOR SELECT USING (
    auth_user_role() = 'lecturer'
    AND student_id IN (
      SELECT student_id FROM advisor_students WHERE lecturer_id = auth.uid()
    )
  );

CREATE POLICY "portfolios_admin_all" ON student_portfolios
  FOR ALL USING (auth_user_role() = 'admin');

CREATE POLICY "portfolios_company_read_visible" ON student_portfolios
  FOR SELECT USING (
    auth_user_role() = 'company'
    AND student_id IN (
      SELECT id FROM users WHERE role = 'student' AND profile_visible = TRUE
    )
  );

-- ---- career_interests ----
CREATE POLICY "career_student_own" ON career_interests
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "career_lecturer_read" ON career_interests
  FOR SELECT USING (
    auth_user_role() = 'lecturer'
    AND student_id IN (
      SELECT student_id FROM advisor_students WHERE lecturer_id = auth.uid()
    )
  );

CREATE POLICY "career_admin_all" ON career_interests
  FOR ALL USING (auth_user_role() = 'admin');

CREATE POLICY "career_company_read_visible" ON career_interests
  FOR SELECT USING (
    auth_user_role() = 'company'
    AND student_id IN (
      SELECT id FROM users WHERE role = 'student' AND profile_visible = TRUE
    )
  );

-- ---- companies ----
CREATE POLICY "companies_own_read" ON companies
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "companies_own_write" ON companies
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "companies_admin_all" ON companies
  FOR ALL USING (auth_user_role() = 'admin');

-- ---- company_categories ----
CREATE POLICY "company_cat_company_own" ON company_categories
  FOR ALL USING (
    company_id IN (SELECT id FROM companies WHERE user_id = auth.uid())
  );

CREATE POLICY "company_cat_admin_all" ON company_categories
  FOR ALL USING (auth_user_role() = 'admin');

-- ---- advisor_students ----
CREATE POLICY "advisor_lecturer_own" ON advisor_students
  FOR ALL USING (lecturer_id = auth.uid());

CREATE POLICY "advisor_student_read" ON advisor_students
  FOR SELECT USING (student_id = auth.uid());

CREATE POLICY "advisor_admin_all" ON advisor_students
  FOR ALL USING (auth_user_role() = 'admin');

-- ---- notifications ----
CREATE POLICY "notif_own" ON notifications
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "notif_admin_all" ON notifications
  FOR ALL USING (auth_user_role() = 'admin');

-- ---- whatsapp_logs ----
CREATE POLICY "wlog_admin_all" ON whatsapp_logs
  FOR ALL USING (auth_user_role() = 'admin');

CREATE POLICY "wlog_lecturer_read" ON whatsapp_logs
  FOR SELECT USING (auth_user_role() = 'lecturer');

-- ---- settings ----
CREATE POLICY "settings_read_all" ON settings
  FOR SELECT USING (TRUE);

CREATE POLICY "settings_admin_write" ON settings
  FOR ALL USING (auth_user_role() = 'admin');

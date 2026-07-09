-- Migration 008: Add skill_options and industry_options tables

CREATE TABLE IF NOT EXISTS skill_options (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS industry_options (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Skill to industry mapping table
CREATE TABLE IF NOT EXISTS skill_industry_map (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id     UUID NOT NULL REFERENCES skill_options(id) ON DELETE CASCADE,
  industry_id  UUID NOT NULL REFERENCES industry_options(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(skill_id, industry_id)
);

-- Seed default skills
INSERT INTO skill_options (name) VALUES
  ('Desain Grafis'), ('UI/UX Design'), ('Ilustrasi'), ('Fotografi'),
  ('Videografi'), ('Animasi'), ('Musik'), ('Seni Pertunjukan'),
  ('Kriya & Kerajinan'), ('Arsitektur'), ('Fashion Design'), ('Branding'),
  ('Social Media'), ('Copywriting'), ('Web Development'), ('Mobile Development')
ON CONFLICT (name) DO NOTHING;

-- Seed default industries
INSERT INTO industry_options (name) VALUES
  ('Kreatif & Desain'), ('Periklanan'), ('Media'), ('Teknologi'),
  ('Startup'), ('Penerbitan'), ('Entertainment'), ('Konstruksi'),
  ('Properti'), ('Fashion'), ('Ritel')
ON CONFLICT (name) DO NOTHING;

-- Seed skill-industry mappings
WITH s AS (SELECT id, name FROM skill_options),
     i AS (SELECT id, name FROM industry_options)
INSERT INTO skill_industry_map (skill_id, industry_id)
SELECT s.id, i.id FROM s, i WHERE
  (s.name = 'Desain Grafis'      AND i.name IN ('Kreatif & Desain','Periklanan','Media')) OR
  (s.name = 'UI/UX Design'       AND i.name IN ('Teknologi','Kreatif & Desain','Startup')) OR
  (s.name = 'Ilustrasi'          AND i.name IN ('Kreatif & Desain','Penerbitan','Media')) OR
  (s.name = 'Fotografi'          AND i.name IN ('Media','Periklanan','Kreatif & Desain')) OR
  (s.name = 'Videografi'         AND i.name IN ('Media','Periklanan','Entertainment')) OR
  (s.name = 'Animasi'            AND i.name IN ('Media','Entertainment','Teknologi')) OR
  (s.name = 'Musik'              AND i.name IN ('Entertainment','Media','Kreatif & Desain')) OR
  (s.name = 'Seni Pertunjukan'   AND i.name IN ('Entertainment','Kreatif & Desain')) OR
  (s.name = 'Kriya & Kerajinan'  AND i.name IN ('Kreatif & Desain','Ritel')) OR
  (s.name = 'Arsitektur'         AND i.name IN ('Konstruksi','Properti','Kreatif & Desain')) OR
  (s.name = 'Fashion Design'     AND i.name IN ('Fashion','Ritel','Kreatif & Desain')) OR
  (s.name = 'Branding'           AND i.name IN ('Periklanan','Kreatif & Desain','Startup')) OR
  (s.name = 'Social Media'       AND i.name IN ('Periklanan','Media','Startup')) OR
  (s.name = 'Copywriting'        AND i.name IN ('Periklanan','Media','Startup')) OR
  (s.name = 'Web Development'    AND i.name IN ('Teknologi','Startup')) OR
  (s.name = 'Mobile Development' AND i.name IN ('Teknologi','Startup'))
ON CONFLICT (skill_id, industry_id) DO NOTHING;

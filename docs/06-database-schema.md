# 06 — Database Schema

| Informasi | Detail |
|-----------|--------|
| Versi | 1.0 (MVP) |
| Tanggal Dokumen | 09 Juli 2026 |
| Database | PostgreSQL via Supabase |

---

## 6.1 Diagram Relasi (ERD Overview)

```
universities
    └── study_programs
            └── academic_rules
            └── users (students, lecturers, admins)
                    └── student_semesters
                    └── student_grades
                    └── student_targets
                    └── student_portfolios
                    └── career_interests
                    └── advisor_students (lecturer ↔ student)
companies
    └── company_categories
    └── company_student_views (consent-based)
notifications
whatsapp_logs
settings
```

---

## 6.2 Tabel: `universities`

```sql
CREATE TABLE universities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  short_name  TEXT,
  city        TEXT,
  province    TEXT,
  website     TEXT,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6.3 Tabel: `study_programs`

```sql
CREATE TABLE study_programs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id   UUID REFERENCES universities(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  short_name      TEXT,
  degree_level    TEXT DEFAULT 'S1',   -- S1, S2, S3, D3, D4
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6.4 Tabel: `academic_rules`

```sql
CREATE TABLE academic_rules (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id          UUID REFERENCES universities(id) ON DELETE CASCADE,
  study_program_id       UUID REFERENCES study_programs(id) ON DELETE SET NULL,
  -- null = default rule for all programs

  total_sks_graduation   INTEGER NOT NULL DEFAULT 144,
  normal_semester        INTEGER NOT NULL DEFAULT 8,
  max_semester           INTEGER NOT NULL DEFAULT 14,
  min_gpa                DECIMAL(3,2) NOT NULL DEFAULT 2.00,
  max_sks_per_semester   INTEGER NOT NULL DEFAULT 24,
  min_sks_per_semester   INTEGER NOT NULL DEFAULT 12,
  passing_grade          TEXT NOT NULL DEFAULT 'D',
  grade_scale            JSONB NOT NULL DEFAULT '{
    "A": 4.0, "AB": 3.5, "B": 3.0,
    "BC": 2.5, "C": 2.0, "D": 1.0, "E": 0.0
  }',

  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6.5 Tabel: `users`

```sql
CREATE TABLE users (
  id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id     UUID REFERENCES universities(id),
  study_program_id  UUID REFERENCES study_programs(id),

  role              TEXT NOT NULL CHECK (role IN ('student', 'lecturer', 'admin', 'company')),
  full_name         TEXT NOT NULL,
  email             TEXT NOT NULL UNIQUE,
  phone             TEXT,
  avatar_url        TEXT,
  nim               TEXT UNIQUE,              -- hanya untuk student
  employee_id       TEXT UNIQUE,              -- hanya untuk lecturer/admin

  is_active         BOOLEAN DEFAULT TRUE,
  profile_visible   BOOLEAN DEFAULT FALSE,    -- consent ke perusahaan

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6.6 Tabel: `student_semesters`

Menyimpan ringkasan per semester (IPS, total SKS yang diambil).

```sql
CREATE TABLE student_semesters (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  semester_number INTEGER NOT NULL,           -- 1, 2, 3, ...
  academic_year   TEXT NOT NULL,              -- "2023/2024"
  total_sks       INTEGER DEFAULT 0,
  ips             DECIMAL(3,2) DEFAULT 0.00,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(student_id, semester_number, academic_year)
);
```

---

## 6.7 Tabel: `student_grades`

Menyimpan nilai per mata kuliah.

```sql
CREATE TABLE student_grades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  semester_id     UUID REFERENCES student_semesters(id) ON DELETE CASCADE,

  course_name     TEXT NOT NULL,
  course_code     TEXT,
  sks             INTEGER NOT NULL CHECK (sks BETWEEN 1 AND 6),
  grade           TEXT NOT NULL,              -- A, AB, B, BC, C, D, E
  grade_point     DECIMAL(3,1),               -- dihitung otomatis dari grade_scale
  is_repeat       BOOLEAN DEFAULT FALSE,      -- apakah mata kuliah diulang

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6.8 Tabel: `student_targets`

```sql
CREATE TABLE student_targets (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id            UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,

  target_semester       INTEGER NOT NULL DEFAULT 8,  -- 7, 8, atau 9
  career_goal           TEXT,
  notes                 TEXT,

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6.9 Tabel: `portfolio_categories`

```sql
CREATE TABLE portfolio_categories (
  id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code  TEXT NOT NULL UNIQUE,    -- 'certificate', 'internship', dst
  name  TEXT NOT NULL            -- 'Sertifikat', 'Magang', dst
);
```

---

## 6.10 Tabel: `student_portfolios`

```sql
CREATE TABLE student_portfolios (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES portfolio_categories(id),

  title           TEXT NOT NULL,
  description     TEXT,
  skills          TEXT[],             -- array of skill tags
  start_date      DATE,
  end_date        DATE,               -- null = ongoing
  status          TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'ongoing')),

  url_gdrive      TEXT,
  url_github      TEXT,
  url_behance     TEXT,
  url_linkedin    TEXT,
  url_youtube     TEXT,
  url_website     TEXT,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6.11 Tabel: `career_interests`

```sql
CREATE TABLE career_interests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  interest    TEXT NOT NULL,   -- 'UI/UX Designer', 'Animator', dst
  created_at  TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(student_id, interest)
);
```

---

## 6.12 Tabel: `companies`

```sql
CREATE TABLE companies (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id),

  company_name  TEXT NOT NULL,
  industry      TEXT,
  description   TEXT,
  website       TEXT,
  logo_url      TEXT,
  is_active     BOOLEAN DEFAULT TRUE,

  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6.13 Tabel: `company_categories`

Kategori perusahaan untuk dicocokkan dengan minat karier mahasiswa.

```sql
CREATE TABLE company_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,
  category    TEXT NOT NULL   -- 'UI/UX Designer', 'Animator', dst

  UNIQUE(company_id, category)
);
```

---

## 6.14 Tabel: `advisor_students`

Relasi dosen wali dan mahasiswa bimbingan.

```sql
CREATE TABLE advisor_students (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecturer_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  student_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  join_code       TEXT,           -- kode yang digunakan mahasiswa untuk bergabung
  joined_at       TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(lecturer_id, student_id)
);
```

---

## 6.15 Tabel: `notifications`

```sql
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,       -- 'semester_summary', 'risk_alert', dst
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6.16 Tabel: `whatsapp_logs`

```sql
CREATE TABLE whatsapp_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient     TEXT NOT NULL,     -- nomor WA
  message       TEXT NOT NULL,
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6.17 Tabel: `settings`

```sql
CREATE TABLE settings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES universities(id),
  key           TEXT NOT NULL,
  value         TEXT NOT NULL,
  description   TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(university_id, key)
);
```

Contoh data settings:

| key | value | description |
|-----|-------|-------------|
| `waha_api_url` | `https://waha.example.com` | URL WAHA instance |
| `waha_api_key` | `xxxxx` | API Key WAHA |
| `waha_session` | `default` | Nama session WAHA |
| `app_name` | `Gradely ISI` | Nama aplikasi di kampus |

---

## 6.18 Row Level Security (RLS)

Setiap tabel memiliki RLS policy. Contoh policy utama:

```sql
-- student hanya bisa baca/tulis data sendiri
CREATE POLICY "student_own_data" ON student_grades
  FOR ALL USING (student_id = auth.uid());

-- lecturer hanya bisa baca data mahasiswa bimbingan
CREATE POLICY "lecturer_advisee_read" ON student_grades
  FOR SELECT USING (
    student_id IN (
      SELECT student_id FROM advisor_students
      WHERE lecturer_id = auth.uid()
    )
  );

-- company hanya bisa baca profil yang consent aktif
CREATE POLICY "company_consent_read" ON users
  FOR SELECT USING (
    role = 'student'
    AND profile_visible = TRUE
    AND EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role = 'company'
    )
  );
```

---

## Dokumen Terkait

- [04 — Academic Rules](./04-academic-rules.md)
- [07 — Tech Stack](./07-tech-stack.md)

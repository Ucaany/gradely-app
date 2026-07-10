# Gradely

Platform Monitoring Akademik, Perencanaan Kelulusan, Portofolio, dan Career Development Mahasiswa — Institut Seni Indonesia (ISI) Yogyakarta.

**Repository:** https://github.com/Ucaany/gradely-app  
**Last Updated:** 10 Juli 2026  
**Phase Saat Ini:** Phase 4 ✅ Selesai → Phase 5 🔄 Berikutnya

---

## Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3.4 + shadcn/ui |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth + SSR |
| Forms | react-hook-form + zod |
| Charts | Recharts |
| Notifikasi | WAHA (WhatsApp HTTP API) |
| Toast | Sonner |
| Icons | Lucide React |
| CSV | Papaparse |
| AI | OpenAI GPT-4o (KHS import) |

---

## Role Pengguna

| Role | Kode | Akses |
|------|------|-------|
| Mahasiswa | `student` | Dashboard akademik, nilai, portofolio, karier, onboarding |
| Dosen Wali | `lecturer` | Monitoring mahasiswa bimbingan, monitoring risiko |
| Admin Kampus | `admin` | Kelola pengguna, aturan akademik, sistem, kirim WA ke dosen |
| Perusahaan | `company` | Talent scouting (dengan consent mahasiswa) |

---

## Setup Development

### 1. Clone & Install

```bash
git clone https://github.com/Ucaany/gradely-app.git
cd gradely-app
npm install
```

### 2. Environment Variables

```bash
cp .env.local.example .env.local
```

Isi `.env.local` dengan credentials Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
OPENAI_API_KEY=your-openai-api-key
```

### 3. Database Migration

```bash
npx supabase db push --db-url "postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
```

Migration files:
- `001_initial_schema.sql` — 16 tabel, RLS, indexes, triggers
- `002_seed_isi_yogyakarta.sql` — Data ISI Yogyakarta
- `003_add_semester_type.sql` — Kolom semester_type di student_grades
- `004_add_semester_type_users.sql` — Kolom current_semester_type di users
- `005_add_join_code.sql` — Kolom join_code di users (dosen wali invite)
- `006_add_onboarding.sql` — Kolom onboarding_completed di users
- `007_add_student_company_interests.sql` — Tabel minat perusahaan mahasiswa
- `008_add_skill_industry_options.sql` — Opsi skill & industri
- `009_add_target_ipk_years.sql` — Target IPK & tahun kelulusan
- `010_add_graduation_achievements.sql` — Riwayat pencapaian kelulusan
- `011_portfolio_enhancements.sql` — Enhancement tabel portofolio
- `012_portfolio_metadata.sql` — Metadata portofolio (skill tags, URL fields)
- `013_add_company_address.sql` — Kolom alamat perusahaan

### 4. Jalankan Dev Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) — akan redirect ke `/login`.

---

## Struktur Direktori

```
gradely/
├── src/
│   ├── app/
│   │   ├── (auth)/              # Login, Reset Password, Update Password
│   │   ├── (onboarding)/        # Onboarding mahasiswa (full screen, 3 step)
│   │   ├── (admin)/admin/       # Panel Admin
│   │   │   ├── dashboard/       # Dashboard + advisor stats + riwayat WA
│   │   │   ├── account/         # Ubah password admin
│   │   │   ├── users/
│   │   │   │   ├── students/    # CRUD Mahasiswa + bulk import
│   │   │   │   ├── lecturers/   # CRUD Dosen Wali + join code + student count
│   │   │   │   ├── companies/   # CRUD Perusahaan
│   │   │   │   └── import/      # Import CSV
│   │   │   ├── study-programs/  # Kelola Program Studi
│   │   │   ├── academic-rules/  # Kelola Aturan Akademik
│   │   │   └── settings/        # WAHA, General, AI API key
│   │   ├── (student)/student/   # Dashboard Mahasiswa
│   │   │   ├── dashboard/       # Dashboard + charts + onboarding banner
│   │   │   ├── grades/          # Nilai akademik (grid/list) + import KHS
│   │   │   ├── target/          # Target kelulusan + AI analysis
│   │   │   ├── portfolio/       # CRUD portofolio (11 kategori)
│   │   │   ├── career/          # Minat karier + toggle consent
│   │   │   ├── profile/         # Profil mahasiswa
│   │   │   └── settings/        # Pengaturan + invite token
│   │   ├── (lecturer)/          # Dashboard Dosen Wali
│   │   │   ├── dashboard/       # Statistik + risiko + aksi cepat
│   │   │   ├── students/        # Daftar + detail mahasiswa bimbingan
│   │   │   ├── risk/            # Monitoring risiko akademik
│   │   │   ├── join-code/       # Generate/copy kode bergabung
│   │   │   └── profile/         # Profil dosen
│   │   ├── (company)/           # Company Dashboard
│   │   │   ├── dashboard/       # Browse mahasiswa + filter
│   │   │   └── profile/         # Profil perusahaan
│   │   └── api/
│   │       ├── admin/           # API routes admin
│   │       ├── auth/            # signout, change-password
│   │       ├── lecturer/        # join-code generator
│   │       ├── student/         # grades, profile, target, portfolio, career
│   │       ├── company/         # students browse, study-programs
│   │       └── waha/            # send message, notifications
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── admin/               # Komponen khusus admin
│   │   ├── student/             # Komponen mahasiswa (charts, grade form)
│   │   └── shared/              # Komponen bersama (notification inbox)
│   ├── lib/
│   │   ├── supabase/            # Client, server, middleware helpers
│   │   ├── validations/         # Zod schemas semua entity
│   │   ├── utils/               # Helpers + kalkulasi akademik
│   │   └── waha.ts              # WAHA client helper
│   ├── types/                   # TypeScript types
│   └── middleware.ts            # Route protection + RBAC + onboarding gate
├── supabase/
│   ├── migrations/              # SQL migration files (013 total)
│   └── seed.sql                 # Seed data ISI Yogyakarta
└── docs/                        # Dokumentasi perencanaan
```

---

## Database Tables

```
universities          study_programs        academic_rules
users                 student_semesters     student_grades
student_targets       student_portfolios    portfolio_categories
career_interests      companies             company_categories
advisor_students      notifications         whatsapp_logs
settings
```

**Total: 16 tabel** dengan RLS policies per role.

**Kolom tambahan di `users`:**
- `join_code TEXT UNIQUE` — kode invite dosen wali
- `onboarding_completed BOOLEAN` — status onboarding mahasiswa
- `current_semester_type TEXT` — jenis semester aktif

---

## Fitur Per Phase

### Phase 1 — Authentication & Admin (✅ Selesai)
- Login email + password, reset password, update password
- Role-based redirect otomatis
- Middleware RBAC + onboarding gate
- Server-side session via `@supabase/ssr`
- Dashboard admin: statistik, advisor connection stats, riwayat WA
- CRUD Mahasiswa, Dosen Wali, Perusahaan
- Bulk import CSV drag & drop
- Kelola Program Studi + Aturan Akademik
- Konfigurasi WAHA + AI API key

### Phase 2 — Dashboard Mahasiswa (✅ Selesai)
- Status akademik dengan icon (Unggul / Sesuai Target / Perlu Perhatian / Butuh Pemulihan / Darurat Akademik)
- Stat cards: IPK, SKS Lulus, MK Lulus, Prediksi Lulus
- Grafik IPS per semester (Recharts AreaChart)
- Progress SKS dengan donut chart
- Nilai akademik: mode list + grid, import KHS via AI (GPT-4o)
- Target kelulusan + AI analysis riwayat pencapaian
- Onboarding 3 step: skill, minat, konfirmasi profil
- Join dosen wali via kode invite 8 karakter

### Phase 3 — Dashboard Dosen Wali (✅ Selesai)
- Dashboard: statistik, distribusi status akademik, daftar mahasiswa berisiko
- Daftar + detail mahasiswa bimbingan (profil, stat cards, grafik IPK/IPS, histori nilai)
- Monitoring risiko akademik grouped by status (Darurat / Perhatian / Aman)
- Generate/copy kode bergabung
- Admin dapat kirim laporan WA ke dosen wali

### Phase 4 — Portofolio & Career (✅ Selesai)
- CRUD portofolio mahasiswa: 11 kategori, skill tags, 6 URL fields (GitHub, Behance, LinkedIn, dll)
- Career profile: 12 minat karier, toggle consent `profile_visible`
- Company dashboard: browse mahasiswa dengan filter (prodi, IPK, skill, minat karier, nama)
- RLS consent enforcement — hanya mahasiswa `profile_visible = true` yang muncul

### Phase 5 — WAHA & Launch (🟡 Partial)
- Panel konfigurasi WAHA + test koneksi ✅
- Riwayat log WhatsApp di dashboard admin ✅
- API route kirim pesan + notification inbox 🔄

---

## API Routes

| Method | Route | Deskripsi |
|--------|-------|-----------|
| POST | `/api/auth/signout` | Sign out |
| POST | `/api/auth/change-password` | Ubah password |
| GET/PATCH | `/api/student/profile` | Profil mahasiswa |
| GET/POST | `/api/student/grades` | Nilai akademik |
| PATCH/DELETE | `/api/student/grades/[id]` | Edit/hapus nilai |
| GET/POST | `/api/student/target` | Target kelulusan |
| POST | `/api/student/target/analyze` | AI analysis target |
| GET/POST | `/api/student/portfolio` | CRUD portofolio |
| PATCH/DELETE | `/api/student/portfolio/[id]` | Edit/hapus portofolio |
| GET | `/api/student/portfolio/categories` | Daftar kategori |
| GET/POST | `/api/student/career` | Minat karier |
| GET/POST | `/api/student/join-advisor` | Cek / join dosen wali |
| POST | `/api/student/khs-import/parse` | Parse KHS via AI |
| POST | `/api/student/khs-import` | Import nilai dari KHS |
| GET/POST | `/api/lecturer/join-code` | Ambil / regenerate kode join |
| GET | `/api/company/students` | Browse mahasiswa (talent scouting) |
| GET | `/api/company/study-programs` | Daftar prodi untuk filter |
| GET | `/api/admin/chart-data` | Data chart IPK/IPS |
| POST | `/api/admin/import` | Bulk import CSV |
| GET/POST | `/api/admin/settings` | Simpan konfigurasi |
| POST | `/api/admin/waha/test` | Test koneksi WAHA |
| POST | `/api/waha/send` | Kirim pesan WhatsApp |

---

## Roadmap

| Phase | Status | Deskripsi |
|-------|--------|-----------|
| Phase 1 | ✅ Selesai | Auth, Database, Admin Panel, User Management |
| Phase 2 | ✅ Selesai | Dashboard Mahasiswa, Nilai, Profil, Onboarding, Invite |
| Phase 3 | ✅ Selesai | Dashboard Dosen, Monitoring Mahasiswa, Risiko Akademik |
| Phase 4 | ✅ Selesai | Portofolio, Career Profile, Company Dashboard |
| Phase 5 | 🔄 Berikutnya | WAHA Notifikasi, Testing, Launch |

---

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # ESLint check
npm run start    # Production server
```

---

## Deployment

| Service | Platform |
|---------|----------|
| Frontend | Vercel |
| Database | Supabase Cloud |
| WAHA | Self-hosted VPS / Docker |

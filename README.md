# Gradely

Platform Monitoring Akademik, Perencanaan Kelulusan, Portofolio, dan Career Development Mahasiswa — Institut Seni Indonesia (ISI) Yogyakarta.

**Repository:** https://github.com/Ucaany/gradely-app  
**Last Updated:** 09 Juli 2026  
**Phase Saat Ini:** Phase 2 ✅ Selesai → Phase 3 🔄 Berikutnya

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
| Dosen Wali | `lecturer` | Monitoring mahasiswa bimbingan |
| Admin Kampus | `admin` | Kelola pengguna, aturan akademik, sistem |
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
│   │   │   ├── dashboard/       # Dashboard + advisor stats
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
│   │   │   ├── target/          # Target kelulusan
│   │   │   ├── profile/         # Profil mahasiswa
│   │   │   └── settings/        # Pengaturan + invite token
│   │   ├── (lecturer)/          # Dashboard Dosen (Phase 3)
│   │   ├── (company)/           # Company Dashboard (Phase 4)
│   │   └── api/
│   │       ├── admin/           # API routes admin
│   │       ├── auth/            # signout, change-password
│   │       ├── lecturer/        # join-code generator
│   │       └── student/         # grades, profile, target, join-advisor, khs-import, onboarding
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components
│   │   ├── admin/               # Komponen khusus admin
│   │   └── student/             # Komponen mahasiswa (charts, grade form)
│   ├── lib/
│   │   ├── supabase/            # Client, server, middleware helpers
│   │   ├── validations/         # Zod schemas semua entity
│   │   └── utils/               # Helpers + kalkulasi akademik
│   ├── types/                   # TypeScript types
│   └── middleware.ts            # Route protection + RBAC + onboarding gate
├── supabase/
│   ├── migrations/              # SQL migration files (006 total)
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

## Fitur Phase 1 + Phase 2

### Authentication
- Login email + password, reset password, update password
- Role-based redirect otomatis
- Middleware RBAC + onboarding gate
- Server-side session via `@supabase/ssr`

### Admin Panel
- Dashboard statistik + advisor connection stats (total koneksi, dosen aktif, top dosen)
- CRUD Mahasiswa, Dosen Wali, Perusahaan
- Daftar dosen wali: kolom jumlah mahasiswa + kode join
- Bulk import CSV drag & drop
- Kelola Program Studi + Aturan Akademik
- Konfigurasi WAHA + AI API key (OpenAI untuk KHS import)
- Akun admin: ubah password

### Dashboard Mahasiswa
- Banner onboarding belum selesai (dengan tombol Lanjutkan)
- Status akademik dengan icon (Unggul / Sesuai Target / Perlu Perhatian / Butuh Pemulihan / Darurat Akademik)
- Stat cards: IPK, SKS Lulus, MK Lulus, Prediksi Lulus
- Grafik IPS per semester (Recharts AreaChart)
- Progress SKS dengan donut chart (Recharts PieChart) + stats sejajar
- Aksi Cepat grid 2x3 dengan icon berwarna
- Mata kuliah mengulang

### Nilai Akademik
- Mode list (tabel per semester) + mode grid (kartu per MK)
- Toggle grid/list di header
- Import KHS via AI (GPT-4o baca PDF/gambar, ekstrak MK, SKS, nilai)
- Badge clean tanpa border untuk nilai dan status

### Profil Mahasiswa
- Edit nama, foto (URL), nomor HP, semester aktif
- Toggle tampil ke perusahaan (bukan publik — hanya company)
- Tersinkron ke database realtime

### Pengaturan Mahasiswa
- Subheading: Profil Saya + Invite Token
- Ubah password dengan show/hide
- Join dosen wali via kode (1x permanent, tidak bisa ganti)
- Daftar dosen wali terhubung

### Onboarding (3 Step, Full Screen)
- Step 1: Pilih skill & minat (16 opsi)
- Step 2: Perusahaan mitra relevan berdasarkan skill
- Step 3: Konfirmasi profil dari admin
- Tombol "Isi Nanti" → dashboard dengan banner reminder
- Hanya tampil sekali, tidak bisa diulang setelah selesai

### Invite System Dosen Wali
- Dosen wali generate kode unik 8 karakter via `/api/lecturer/join-code`
- Mahasiswa input kode → bergabung 1x permanent
- Admin bisa lihat kode join + jumlah mahasiswa per dosen

---

## API Routes

| Method | Route | Deskripsi |
|--------|-------|-----------|
| POST | `/api/auth/signout` | Sign out |
| POST | `/api/auth/change-password` | Ubah password |
| GET/PATCH | `/api/student/profile` | Profil mahasiswa |
| GET/POST | `/api/student/grades` | Nilai akademik |
| PATCH/DELETE | `/api/student/grades/[id]` | Edit/hapus nilai |
| GET/POST | `/api/student/join-advisor` | Cek / join dosen wali |
| POST | `/api/student/khs-import/parse` | Parse KHS via AI |
| POST | `/api/student/khs-import` | Import nilai dari KHS |
| GET/POST | `/api/student/onboarding/companies` | Companies + complete onboarding |
| GET/POST | `/api/lecturer/join-code` | Ambil / regenerate kode join |
| GET | `/api/admin/chart-data` | Data chart IPK/IPS |
| POST | `/api/admin/import` | Bulk import CSV |
| GET/POST | `/api/admin/settings` | Simpan konfigurasi |
| POST | `/api/admin/waha/test` | Test koneksi WAHA |

---

## Roadmap

| Phase | Status | Deskripsi |
|-------|--------|-----------|
| Phase 1 | ✅ Selesai | Auth, Database, Admin Panel, User Management |
| Phase 2 | ✅ Selesai | Dashboard Mahasiswa, Nilai, Profil, Onboarding, Invite |
| Phase 3 | 🔄 Berikutnya | Dashboard Dosen, Monitoring Mahasiswa, Risiko Akademik |
| Phase 4 | ⏳ Pending | Portofolio, Career Profile, Company Dashboard |
| Phase 5 | ⏳ Pending | WAHA Notifikasi, Testing, Launch |

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

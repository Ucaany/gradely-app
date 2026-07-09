# Gradely

Platform Monitoring Akademik, Perencanaan Kelulusan, Portofolio, dan Career Development Mahasiswa — Institut Seni Indonesia (ISI) Yogyakarta.

**Repository:** https://github.com/Ucaany/gradely-app  
**Last Updated:** 09 Juli 2026  
**Phase Saat Ini:** Phase 1 ✅ Selesai → Phase 2 🔄 Berikutnya

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

---

## Role Pengguna

| Role | Kode | Akses |
|------|------|-------|
| Mahasiswa | `student` | Dashboard akademik, nilai, portofolio, karier |
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

# Set ke production URL saat deploy
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Database Migration

```bash
npx supabase db push --db-url "postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
```

Migration `supabase/migrations/001_initial_schema.sql` membuat:
- 16 tabel dengan relasi lengkap
- Row Level Security (RLS) per role
- Indexes untuk performa query
- Triggers `updated_at` otomatis

### 4. Seed Data

Seed data ISI Yogyakarta (kampus, 9 prodi, aturan akademik, kategori portofolio) dijalankan via `supabase/seed.sql`.

### 5. Buat Akun Admin Pertama

Buat akun di Supabase Dashboard → Authentication → Users, lalu insert profil:

```sql
INSERT INTO users (id, university_id, role, full_name, email, is_active)
VALUES (
  '<auth-user-id>',
  '00000000-0000-0000-0000-000000000001',
  'admin',
  'Nama Admin',
  'admin@isi.ac.id',
  true
);
```

### 6. Jalankan Dev Server

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
│   │   ├── (admin)/admin/       # Panel Admin
│   │   │   ├── dashboard/       # Dashboard statistik + WA history
│   │   │   ├── users/
│   │   │   │   ├── students/    # CRUD Mahasiswa + bulk import
│   │   │   │   ├── lecturers/   # CRUD Dosen Wali
│   │   │   │   ├── companies/   # CRUD Perusahaan
│   │   │   │   └── import/      # Import CSV
│   │   │   ├── study-programs/  # Kelola Program Studi
│   │   │   ├── academic-rules/  # Kelola Aturan Akademik
│   │   │   └── settings/        # Konfigurasi WAHA + General
│   │   ├── (student)/           # Dashboard Mahasiswa (Phase 2)
│   │   ├── (lecturer)/          # Dashboard Dosen (Phase 3)
│   │   ├── (company)/           # Company Dashboard (Phase 4)
│   │   └── api/
│   │       ├── admin/           # API routes admin
│   │       └── auth/            # Auth API (signout)
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components (Radix UI)
│   │   ├── shared/              # Komponen reusable (CreateUserForm, StudentsSearchForm)
│   │   └── admin/               # Komponen khusus admin
│   ├── lib/
│   │   ├── supabase/            # Client, server, middleware helpers
│   │   ├── validations/         # Zod schemas semua entity
│   │   └── utils/               # Helpers + kalkulasi akademik
│   ├── types/                   # TypeScript types (16 entities)
│   ├── hooks/                   # Custom hooks
│   └── middleware.ts            # Route protection + RBAC
├── supabase/
│   ├── migrations/              # SQL migration files
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

---

## Fitur yang Sudah Selesai (Phase 1)

### Authentication
- Login email + password
- Reset password via email
- Update password
- Role-based redirect otomatis
- Middleware route protection (RBAC)
- Server-side session management via `@supabase/ssr`

### Admin Panel
- Dashboard statistik (mahasiswa, dosen, prodi, perusahaan)
- Aksi Cepat dengan card grid 2x2 di dashboard
- Riwayat pesan WhatsApp dengan filter 24h / 1 minggu / semua
- CRUD Mahasiswa (list, detail, tambah, edit, hapus)
- CRUD Dosen Wali (list, detail + daftar bimbingan, tambah, edit, hapus)
- CRUD Perusahaan (list, tambah — auto insert ke tabel `companies`)
- Bulk import CSV dengan preview data, drag & drop
- Kelola Program Studi (CRUD via dialog + toggle aktif/nonaktif inline)
- Kelola Aturan Akademik (CRUD via dialog, grade scale customizable, view grid/list)
- Search mahasiswa dengan shadcn Select (program studi filter)
- Konfigurasi WAHA (URL, session, API key, test koneksi)
- Pengaturan umum institusi

### UI/UX
- Responsive layout (320px — 1920px)
- Full width pada semua halaman
- Dark mode support
- shadcn/ui components (Badge, Toaster, Switch, Select, Form)
- Sonner toast notifications
- Sticky footer pada form panjang
- Toggle grid/list view pada halaman aturan akademik

### Bug Fixes
- Validasi UUID Zod v4 kompatibel dengan semua format UUID
- Fix `study_program_id` & `current_semester_type` di `defaultValues` form
- Fix Select controlled component (pakai `value` bukan `defaultValue`)
- Fix API PATCH sanitize empty string ke `null` sebelum update DB
- Fix regex validasi nomor HP Indonesia (`{7,14}` digit)
- Fix router.refresh() sebelum push agar server component revalidate cache

---

## Roadmap

| Phase | Minggu | Status | Deskripsi |
|-------|--------|--------|-----------|
| Phase 1 | 1–4 | ✅ Selesai | Auth, Database, Admin Panel, User Management |
| Phase 2 | 5–9 | 🔄 Berikutnya | Dashboard Mahasiswa, Nilai, IPK, SKS, Target |
| Phase 3 | 10–13 | ⏳ Pending | Dashboard Dosen, Monitoring, Risiko |
| Phase 4 | 14–17 | ⏳ Pending | Portofolio, Career Profile, Company Dashboard |
| Phase 5 | 18–20 | 🟡 Partial | WAHA Notifikasi, Testing, Launch |

---

## API Routes

| Method | Route | Deskripsi |
|--------|-------|-----------|
| POST | `/api/auth/signout` | Server-side sign out |
| GET | `/api/admin/users` | List semua users |
| POST | `/api/admin/users` | Buat user baru (+ auto insert companies jika role=company) |
| PATCH | `/api/admin/users/[id]` | Update user |
| DELETE | `/api/admin/users/[id]` | Hapus user |
| POST | `/api/admin/import` | Bulk import CSV |
| GET | `/api/admin/study-programs` | List program studi |
| POST | `/api/admin/study-programs` | Tambah program studi |
| PATCH | `/api/admin/study-programs/[id]` | Update program studi (termasuk toggle is_active) |
| DELETE | `/api/admin/study-programs/[id]` | Hapus program studi |
| GET | `/api/admin/academic-rules` | List aturan akademik |
| POST | `/api/admin/academic-rules` | Tambah aturan akademik |
| PATCH | `/api/admin/academic-rules/[id]` | Update aturan akademik |
| DELETE | `/api/admin/academic-rules/[id]` | Hapus aturan akademik |
| POST | `/api/admin/settings` | Simpan konfigurasi WAHA |
| POST | `/api/admin/waha/test` | Test koneksi WAHA |

---

## Scripts

```bash
npm run dev      # Development server (port 3000)
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

### Environment Production

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://gradely.isi.ac.id
```

---

## Utility Functions (Kalkulasi Akademik)

Tersedia di `src/lib/utils/academic.ts`, siap digunakan di Phase 2:

| Fungsi | Deskripsi |
|--------|-----------|
| `calculateIPS()` | Hitung Indeks Prestasi Semester |
| `calculateIPK()` | Hitung Indeks Prestasi Kumulatif |
| `calculateSKSLulus()` | Hitung total SKS yang lulus |
| `calculateAcademicStatus()` | Tentukan status akademik |
| `predictGraduationSemester()` | Prediksi semester kelulusan |
| `ACADEMIC_STATUS_CONFIG` | Konfigurasi label & warna status |

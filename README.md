# Gradely

Platform Monitoring Akademik, Perencanaan Kelulusan, Portofolio, dan Career Development Mahasiswa — Institut Seni Indonesia (ISI) Yogyakarta.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: PostgreSQL via Supabase
- **Auth**: Supabase Auth
- **Notifikasi**: WAHA (WhatsApp HTTP API)

## Role Pengguna

| Role | Kode | Akses |
|------|------|-------|
| Mahasiswa | `student` | Dashboard akademik, nilai, portofolio, karier |
| Dosen Wali | `lecturer` | Monitoring mahasiswa bimbingan |
| Admin Kampus | `admin` | Kelola pengguna, aturan akademik, sistem |
| Perusahaan | `company` | Talent scouting (dengan consent mahasiswa) |

## Setup Development

### 1. Clone & Install

```bash
git clone <repo-url>
cd gradely
npm install
```

### 2. Environment Variables

Salin file contoh dan isi dengan credentials Supabase:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Database Migration

Pastikan Supabase CLI sudah terinstall:

```bash
npm install -g supabase
```

Jalankan migration ke Supabase cloud:

```bash
npx supabase db push --db-url "postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
```

Migration akan menjalankan `supabase/migrations/001_initial_schema.sql` yang berisi:
- 16 tabel lengkap dengan relasi
- Row Level Security (RLS) policies per role
- Indexes untuk performa query
- Triggers `updated_at` otomatis

### 4. Seed Data

Seed data ISI Yogyakarta (kampus, 9 prodi, aturan akademik, kategori portofolio) dijalankan otomatis bersama migration via `supabase/seed.sql`.

### 5. Buat Akun Admin Pertama

Buat akun admin melalui Supabase Dashboard → Authentication → Users:

| Field | Nilai |
|-------|-------|
| Email | `admin@isi.ac.id` |
| Password | Sesuai pilihan |

Kemudian insert profil ke tabel `users` di SQL Editor:

```sql
INSERT INTO users (id, university_id, role, full_name, email, is_active)
VALUES (
  '<auth-user-id>',
  '00000000-0000-0000-0000-000000000001',
  'admin',
  'Budi Santoso',
  'admin@isi.ac.id',
  true
);
```

> `auth-user-id` didapat dari kolom `id` di tabel `auth.users` setelah membuat akun.

### 6. Jalankan Dev Server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) — akan redirect ke `/login`.

## Struktur Direktori

```
src/
├── app/
│   ├── (auth)/          # Login, Reset Password
│   ├── (admin)/         # Panel Admin (sidebar-08)
│   ├── (student)/       # Dashboard Mahasiswa
│   ├── (lecturer)/      # Dashboard Dosen Wali
│   └── (company)/       # Company Dashboard
├── components/
│   ├── ui/              # shadcn/ui components (Radix UI)
│   ├── shared/          # Komponen reusable
│   └── admin/           # Komponen khusus admin
├── lib/
│   ├── supabase/        # Client, server, middleware
│   ├── validations/     # Zod schemas
│   └── utils/           # Helpers + kalkulasi akademik
├── types/               # TypeScript types
└── hooks/               # Custom hooks
supabase/
├── migrations/          # SQL migration files
└── seed.sql             # Seed data ISI Yogyakarta
```

## Database Tables

```
universities          study_programs        academic_rules
users                 student_semesters     student_grades
student_targets       student_portfolios    portfolio_categories
career_interests      companies             company_categories
advisor_students      notifications         whatsapp_logs
settings
```

## Roadmap

| Phase | Status | Deskripsi |
|-------|--------|-----------|
| Phase 1 | ✅ Selesai | Auth, Database, Admin User Management |
| Phase 2 | 🔄 Berikutnya | Dashboard Mahasiswa, Nilai, IPK, SKS |
| Phase 3 | ⏳ Pending | Dashboard Dosen, Monitoring, Risiko |
| Phase 4 | ⏳ Pending | Portofolio, Career, Company Dashboard |
| Phase 5 | ⏳ Pending | WAHA Notifikasi, Testing, Launch |

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run lint     # ESLint check
npx supabase db push --db-url "<url>"   # Push migration
```

## Deployment

- **Frontend**: Vercel
- **Database**: Supabase Cloud
- **WAHA**: Self-hosted VPS / Docker

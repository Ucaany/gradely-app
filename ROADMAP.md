# Gradely — Development Roadmap

| Informasi | Detail |
|-----------|--------|
| Project | Gradely MVP |
| Client | Institut Seni Indonesia (ISI) Yogyakarta |
| Total Durasi | 20 Minggu (~5 Bulan) |
| Target Launch | November 2026 |
| Last Updated | 10 Juli 2026 |
| Progress | ~88% (Phase 1–4 selesai, Phase 5 partial) |

---

## Status Overview

| Phase | Minggu | Fokus | Status | Progress |
|-------|--------|-------|--------|----------|
| Phase 1 | 1–4 | Fondasi: Auth, Database, Admin, User Management | ✅ SELESAI | 100% |
| Phase 2 | 5–9 | Akademik: Nilai, IPK, SKS, Target Kelulusan | ✅ SELESAI | 100% |
| Phase 3 | 10–13 | Dosen: Dashboard, Monitoring, Risiko | ✅ SELESAI | 100% |
| Phase 4 | 14–17 | Portofolio, Career Profile, Company Dashboard | ✅ SELESAI | 100% |
| Phase 5 | 18–20 | WAHA, Notifikasi, Testing, Optimasi | 🟡 PARTIAL | ~70% |

---

## Phase 1 — Fondasi (Minggu 1–4) ✅ SELESAI

### Minggu 1: Setup & Database
- [x] Init project Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- [x] Setup Supabase project (PostgreSQL + Auth + Storage)
- [x] Buat 16 tabel database dengan relasi lengkap
- [x] Implementasi RLS policies per role
- [x] Seed data ISI Yogyakarta (kampus, 10 prodi, academic rules)
- [x] Setup GitHub repository

### Minggu 2: Authentication
- [x] Halaman Login (email + password, role tabs UI)
- [x] Halaman Reset Password
- [x] Halaman Update Password
- [x] Middleware Next.js — proteksi route berbasis RBAC
- [x] Redirect post-login ke dashboard sesuai role
- [x] Server-side session management via `@supabase/ssr`
- [x] Sign out API route

### Minggu 3: Admin — User Management
- [x] Dashboard Admin (layout + navigasi + statistik)
- [x] CRUD Mahasiswa (list, detail, tambah, edit, nonaktifkan)
- [x] CRUD Dosen Wali (list, detail + bimbingan, tambah, edit)
- [x] CRUD Perusahaan (list, tambah, detail)
- [x] Bulk import akun via CSV (preview sebelum import)
- [x] Kelola Program Studi (CRUD via dialog)
- [x] Kelola Aturan Akademik (CRUD per prodi)
- [x] Panel konfigurasi WAHA (URL, session, API key, test koneksi)
- [x] Riwayat log WhatsApp di dashboard

### Minggu 4: Audit & Polish Phase 1
- [x] 36 bug/issue diperbaiki (4 critical, 5 high, 5 medium)
- [x] Semua form refactor ke shadcn Form standard
- [x] Layout full width + responsive (320px–1920px)
- [x] Radix UI components (select, radio-group)
- [x] Code review & dokumentasi

---

## Phase 2 — Modul Akademik (Minggu 5–9) ✅ SELESAI

### Minggu 5: Dashboard Mahasiswa
- [x] Layout sidebar mahasiswa
- [x] Widget: Progress SKS (donut chart)
- [x] Widget: IPK kumulatif & IPS semester terakhir
- [x] Status akademik visual (Ahead / On Track / Need Attention / Recovery / Critical)
- [x] Halaman profil mahasiswa

### Minggu 6: Input & Manajemen Nilai
- [x] Halaman daftar nilai per semester (list/grid view)
- [x] Form CRUD nilai per mata kuliah (nama MK, SKS, grade)
- [x] Kalkulasi otomatis IPS per semester
- [x] API routes `/api/student/grades/*`

### Minggu 7: Import KHS via AI
- [x] Upload & parse file KHS menggunakan GPT-4o
- [x] Preview hasil parsing sebelum konfirmasi import
- [x] Bulk insert nilai dari hasil AI parsing
- [x] Validasi data sebelum import

### Minggu 8: Kalkulasi & Grafik Lanjutan
- [x] Kalkulasi IPK kumulatif lintas semester
- [x] Kalkulasi SKS lulus & SKS tersisa
- [x] Grafik IPK (line chart per semester — Recharts)
- [x] Grafik IPS (bar chart per semester — Recharts)
- [x] Deteksi mata kuliah mengulang

### Minggu 9: Target Kelulusan + Polish
- [x] Form target kelulusan (semester 7/8/9/custom)
- [x] Kalkulasi & prediksi semester kelulusan
- [x] AI analysis target kelulusan (GPT-4o)
- [x] Progress bar SKS visual
- [x] 9 achievement milestones (IPK 3.0, 3.5, SKS 100, dst.)
- [x] Functional testing Phase 2

---

## Phase 3 — Dashboard Dosen (Minggu 10–13) ✅ SELESAI

### Minggu 10: Dashboard Dosen
- [x] Layout sidebar dosen + header + breadcrumb
- [x] Auth guard role `lecturer`
- [x] Dashboard: statistik, distribusi status akademik (chart)
- [x] Daftar mahasiswa berisiko (aksi cepat)

### Minggu 11: Kode Bergabung & Detail Mahasiswa
- [x] Generate kode bergabung unik 8-karakter per dosen
- [x] Mahasiswa input kode untuk terhubung ke dosen wali (`/student/settings`)
- [x] Halaman detail mahasiswa: profil, 4 stat cards, indikator risiko
- [x] Grafik IPK/IPS dari perspektif dosen
- [x] Histori nilai per semester per mahasiswa

### Minggu 12: Monitoring Risiko
- [x] Logika deteksi risiko: IPK turun, MK mengulang, SKS rendah, risiko terlambat lulus
- [x] Halaman monitoring risiko grouped by status (Darurat / Perhatian / Aman)
- [x] Daftar mahasiswa bimbingan dengan search (`/lecturer/students`)
- [x] Filter dan sorting mahasiswa
- [x] Halaman profil dosen

### Minggu 13: Polish Phase 3
- [x] Functional testing Phase 3
- [x] Bug fixing & code review

---

## Phase 4 — Portofolio & Career (Minggu 14–17) ✅ SELESAI

### Minggu 14: Portofolio
- [x] API CRUD portofolio (`/api/student/portfolio/*`)
- [x] 11 kategori portofolio (certificate, internship, volunteer, dst.)
- [x] Halaman daftar portofolio per kategori + filter
- [x] Form tambah/edit portofolio (skill tags, JSONB links, metadata)
- [x] Card tampilan portofolio + link preview

### Minggu 15: Career Profile
- [x] API CRUD minat karier (`/api/student/career`)
- [x] Halaman pemilihan minat karier (12 opsi)
- [x] Toggle consent `profile_visible` ke perusahaan
- [x] Onboarding flow 3-step (skills, career, profile confirm)

### Minggu 16: Company Dashboard
- [x] Layout + sidebar + header perusahaan
- [x] Auth guard role `company`
- [x] Onboarding perusahaan (profile setup)
- [x] Dashboard: browse mahasiswa dengan filter (prodi, IPK, skill, minat karier, nama)
- [x] Expand detail mahasiswa + portfolio links
- [x] RLS consent enforcement — hanya mahasiswa `profile_visible = true`
- [x] API `GET /api/company/students` dengan filter lengkap
- [x] Browse companies di student side

### Minggu 17: Polish Phase 4
- [x] Admin: kelola perusahaan (list, tambah, detail, CRUD)
- [x] `skill_options`, `industry_options`, `skill_industry_map` tables + seed
- [x] Migration: portfolio JSONB links, metadata, company address
- [x] Functional testing Phase 4

---

## Phase 5 — WAHA, Testing & Launch (Minggu 18–20) 🟡 IN PROGRESS

### Minggu 18: Integrasi WAHA
- [x] Panel konfigurasi WAHA di Admin (`/admin/settings`)
- [x] Form settings (URL, session, API key) + test koneksi
- [x] Tabel log pengiriman WhatsApp (`whatsapp_logs`)
- [x] WAHA client library (`lib/waha.ts`) + normalizer nomor Indonesia
- [x] API Route `/api/waha/send` — kirim pesan via WAHA
- [x] Template pesan mahasiswa — peringatan akademik & pengingat semester
- [x] API Route `/api/admin/notifications` — blast academic_warning & semester_reminder
- [x] Notifikasi masuk ke inbox mahasiswa (`notifications` table) saat blast dikirim

### Minggu 19: Notifikasi & E2E Testing
- [x] Trigger notifikasi akhir semester (manual via `/admin/notifications`)
- [x] Notification inbox UI — `NotificationInbox` sheet di student header
- [ ] E2E testing semua role (Mahasiswa, Dosen, Admin, Company)
- [ ] Performance testing
- [ ] Security audit (RLS, consent, RBAC)

### Minggu 20: Optimasi & Launch
- [ ] Bug fixing dari hasil testing
- [ ] Optimasi performa (query optimization, bundle size)
- [ ] Dokumentasi final (API docs, user guide)
- [ ] Deployment ke Vercel (frontend) + Supabase Cloud (DB) + VPS/Docker (WAHA)
- [ ] Seed data produksi ISI Yogyakarta
- [ ] Demo & serah terima ke klien

---

## Sisa Pekerjaan (Phase 5)

| Item | Prioritas | Estimasi |
|------|-----------|----------|
| API route `/api/waha/send` + send logic | High | 1 hari |
| Message templates (mahasiswa, dosen, admin) | High | 1 hari |
| Notification inbox UI | High | 2 hari |
| Trigger notifikasi akhir semester | Medium | 2 hari |
| E2E testing semua role | High | 3 hari |
| Security audit (RLS, RBAC, consent) | High | 1 hari |
| Performance optimization | Medium | 1 hari |
| Deployment & serah terima | High | 2 hari |

---

## Tech Debt & Known Issues

| Kategori | Item | Prioritas |
|----------|------|-----------|
| Feature | WAHA send logic belum ada | High |
| Feature | Notification inbox UI belum ada | High |
| Feature | E2E testing belum ada | High |
| Testing | Unit test untuk `academic.ts` calculations | Medium |
| Performance | Query optimization untuk company student browse | Medium |
| UX | Loading skeleton untuk semua halaman | Low |
| DX | Storybook untuk komponen UI | Low |

---

## Future Roadmap (Post-MVP)

Berdasarkan `docs/09-future-roadmap.md`:

| Fitur | Deskripsi |
|-------|-----------|
| Mobile App | React Native / Flutter untuk mahasiswa |
| Transkip Otomatis | Generate PDF transkip resmi |
| Jadwal Konsultasi | Booking sesi bimbingan dosen-mahasiswa |
| Multi-Kampus | Support lebih dari satu institusi |
| Integrasi SIAKAD | Sinkronisasi otomatis dengan sistem akademik kampus |
| Analytics Lanjutan | Prediksi kelulusan berbasis ML |
| Job Board | Lowongan magang/kerja dari perusahaan mitra |
| Beasiswa | Informasi dan tracking beasiswa |

# 08 — Development Roadmap

| Informasi | Detail |
|-----------|--------|
| Versi | 1.0 (MVP) |
| Tanggal Dokumen | 09 Juli 2026 |

---

## Overview Timeline

| Phase | Durasi | Fokus |
|-------|--------|-------|
| Phase 1 | 4 Minggu | Fondasi: Auth, Database, Admin, User Management |
| Phase 2 | 5 Minggu | Akademik: Nilai, IPK, SKS, Target Kelulusan |
| Phase 3 | 4 Minggu | Dosen: Dashboard, Monitoring, Risiko |
| Phase 4 | 4 Minggu | Portofolio, Career, Company Dashboard |
| Phase 5 | 3 Minggu | WAHA, Notifikasi, Testing, Optimasi |
| **Total** | **20 Minggu** | **~5 Bulan** |

---

## Phase 1 — Fondasi (Minggu 1–4)

### Tujuan
Membangun fondasi sistem yang stabil: autentikasi, database, dan manajemen pengguna.

### Deliverables

#### Minggu 1: Setup & Database
- [ ] Init project Next.js + TypeScript + Tailwind + shadcn/ui
- [ ] Setup Supabase project
- [ ] Buat semua tabel database (lihat [06 — Database Schema](./06-database-schema.md))
- [ ] Implementasi RLS untuk semua tabel
- [ ] Seed dummy data (kampus, prodi, academic rules)
- [ ] Setup GitHub repository

#### Minggu 2: Authentication
- [ ] Halaman Login
- [ ] Halaman Reset Password
- [ ] Middleware Next.js — proteksi route berdasarkan role
- [ ] Redirect post-login ke dashboard sesuai role
- [ ] Session management

#### Minggu 3: Admin — User Management
- [ ] Dashboard Admin (layout + navigasi)
- [ ] CRUD Mahasiswa
- [ ] CRUD Dosen
- [ ] Bulk import akun via CSV
- [ ] Kelola Program Studi
- [ ] Kelola Aturan Akademik (CRUD academic_rules)

#### Minggu 4: Polish Phase 1
- [ ] Functional Testing Phase 1
- [ ] Bug Fixing
- [ ] Code Review
- [ ] Dokumentasi API internal
- [ ] Persiapan demo Phase 1

---

## Phase 2 — Modul Akademik (Minggu 5–9)

### Tujuan
Implementasi core fitur akademik mahasiswa: input nilai, kalkulasi otomatis, dan target kelulusan.

### Deliverables

#### Minggu 5: Dashboard Mahasiswa
- [ ] Layout dashboard mahasiswa
- [ ] Widget: Progress SKS, IPK, IPS
- [ ] Status visual (Ahead / On Track / Need Attention / Recovery / Critical)
- [ ] Halaman profil mahasiswa

#### Minggu 6: Input & Manajemen Nilai
- [ ] Form input nilai per mata kuliah
- [ ] CRUD nilai
- [ ] Riwayat nilai per semester
- [ ] Kalkulasi otomatis IPS per semester

#### Minggu 7: Import KHS & KRS
- [ ] Upload & parse file KHS
- [ ] Upload & parse file KRS
- [ ] Validasi data sebelum import
- [ ] Preview sebelum konfirmasi import

#### Minggu 8: Kalkulasi Lanjutan
- [ ] Kalkulasi IPK kumulatif
- [ ] Kalkulasi SKS lulus & SKS tersisa
- [ ] Grafik IPK (line chart per semester)
- [ ] Grafik IPS (bar chart per semester)

#### Minggu 9: Target Kelulusan + Polish
- [ ] Form target kelulusan (semester 7/8/9)
- [ ] Kalkulasi prediksi kelulusan
- [ ] Progress bar SKS visual
- [ ] Functional Testing Phase 2
- [ ] Bug Fixing & Code Review

---

## Phase 3 — Dashboard Dosen (Minggu 10–13)

### Tujuan
Dosen wali dapat memantau seluruh mahasiswa bimbingan dan mendeteksi risiko akademik.

### Deliverables

#### Minggu 10: Dashboard Dosen
- [ ] Layout dashboard dosen
- [ ] Statistik: jumlah mahasiswa, distribusi status
- [ ] Daftar mahasiswa bimbingan dengan status warna

#### Minggu 11: Kode Bergabung & Detail Mahasiswa
- [ ] Generate kode bergabung unik per dosen
- [ ] Mahasiswa input kode untuk terhubung ke dosen wali
- [ ] Halaman detail mahasiswa (histori nilai, grafik, status risiko)

#### Minggu 12: Monitoring Risiko
- [ ] Logika deteksi risiko akademik
  - IPK turun
  - MK mengulang
  - SKS per semester rendah
  - Risiko terlambat lulus
- [ ] Daftar mahasiswa berisiko dengan indikator
- [ ] Filter dan sorting mahasiswa

#### Minggu 13: Polish Phase 3
- [ ] Functional Testing Phase 3
- [ ] Bug Fixing
- [ ] Code Review
- [ ] Dokumentasi

---

## Phase 4 — Portofolio & Career (Minggu 14–17)

### Tujuan
Mahasiswa dapat mendokumentasikan portofolio dan menghubungkan diri dengan perusahaan mitra.

### Deliverables

#### Minggu 14: Portofolio
- [ ] Halaman daftar portofolio
- [ ] Form tambah/edit portofolio (semua field & URL)
- [ ] Filter portofolio per kategori
- [ ] Tampilan card portofolio

#### Minggu 15: Career Profile
- [ ] Halaman pemilihan minat karier (first-login flow)
- [ ] CRUD minat karier
- [ ] Daftar perusahaan relevan berdasarkan minat

#### Minggu 16: Company Dashboard
- [ ] Login & dashboard perusahaan
- [ ] Filter mahasiswa (prodi, IPK, skill, target karier)
- [ ] Tampilan kartu profil mahasiswa
- [ ] Toggle consent "Tampilkan Profil ke Perusahaan"

#### Minggu 17: Polish Phase 4
- [ ] Functional Testing Phase 4
- [ ] Bug Fixing
- [ ] Code Review
- [ ] Admin: Kelola perusahaan

---

## Phase 5 — WAHA, Testing & Launch (Minggu 18–20)

### Tujuan
Integrasi WhatsApp, pengujian menyeluruh, dan persiapan deployment.

### Deliverables

#### Minggu 18: Integrasi WAHA
- [ ] Panel konfigurasi WAHA di Admin
- [ ] API Route / Edge Function untuk kirim WA
- [ ] Template pesan mahasiswa (ringkasan semester)
- [ ] Template pesan dosen (mahasiswa berisiko)
- [ ] Template pesan admin (rekap keseluruhan)
- [ ] Tabel log pengiriman WhatsApp

#### Minggu 19: Notifikasi & End-to-End Testing
- [ ] Trigger notifikasi akhir semester
- [ ] E2E testing semua role (Mahasiswa, Dosen, Admin, Company)
- [ ] Performance testing
- [ ] Security audit (RLS, consent, RBAC)

#### Minggu 20: Optimasi & Launch
- [ ] Bug fixing dari testing
- [ ] Optimasi performa (query, bundle size)
- [ ] Dokumentasi final
- [ ] Deployment ke Vercel + Supabase production
- [ ] Seed data ISI Yogyakarta
- [ ] Demo & serah terima

---

## Definition of Done per Phase

Setiap phase dianggap selesai apabila:

1. Semua fitur dalam deliverables berfungsi sesuai spesifikasi
2. Functional testing telah dilakukan dan bug kritis telah diperbaiki
3. Code review telah dilakukan
4. Dokumentasi diperbarui

---

## Dokumen Terkait

- [03 — Scope MVP](./03-scope-mvp.md)
- [10 — Definition of Done](./10-definition-of-done.md)

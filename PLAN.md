# PLAN — Gradely MVP

> Master index untuk semua dokumen perencanaan Gradely v1.0

| Informasi | Detail |
|-----------|--------|
| Platform | Monitoring Akademik, Perencanaan Kelulusan, Portofolio, Career Development |
| Target Kampus | Institut Seni Indonesia (ISI) Yogyakarta |
| Stack | Next.js · TypeScript · Tailwind · shadcn/ui · Supabase · PostgreSQL · WAHA |
| Timeline | ~20 Minggu (5 Phase) |

---

## Dokumen

| # | Dokumen | Isi |
|---|---------|-----|
| 01 | [Project Overview](./docs/01-project-overview.md) | Executive summary, visi, goals, KPI, ringkasan modul |
| 02 | [User Roles](./docs/02-user-roles.md) | 4 role, hak akses, pain points, permission matrix, consent |
| 03 | [Scope MVP](./docs/03-scope-mvp.md) | Spesifikasi detail 10 modul MVP |
| 04 | [Academic Rules](./docs/04-academic-rules.md) | Aturan akademik dinamis, formula kalkulasi, konfigurasi ISI |
| 05 | [Dummy Data](./docs/05-dummy-data.md) | Seed data: kampus, prodi, mahasiswa, dosen, perusahaan |
| 06 | [Database Schema](./docs/06-database-schema.md) | DDL semua tabel, ERD, RLS policy |
| 07 | [Tech Stack & Security](./docs/07-tech-stack.md) | Frontend, backend, WAHA, security layers, deployment |
| 08 | [Development Roadmap](./docs/08-development-roadmap.md) | Phase 1–5 dengan deliverables per minggu |
| 09 | [Future Roadmap V2](./docs/09-future-roadmap.md) | OCR, AI, Mobile App, Multi Kampus, SaaS |
| 10 | [Definition of Done](./docs/10-definition-of-done.md) | Checklist MVP, DoD per fitur, implementation notes |

---

## Struktur Modul MVP

```
Modul 1  — Authentication
Modul 2  — Dashboard Mahasiswa
Modul 3  — Nilai Akademik
Modul 4  — Target Kelulusan
Modul 5  — Portofolio
Modul 6  — Career Profile
Modul 7  — Dashboard Dosen Wali
Modul 8  — Dashboard Admin
Modul 9  — Company Dashboard
Modul 10 — WhatsApp Notification (WAHA)
```

---

## Urutan Pengembangan

```
Phase 1 (Minggu 1–4)   → Fondasi: Auth + DB + Admin + User Management
Phase 2 (Minggu 5–9)   → Akademik: Nilai + IPK + SKS + Target Kelulusan
Phase 3 (Minggu 10–13) → Dosen: Dashboard + Monitoring + Risiko
Phase 4 (Minggu 14–17) → Portofolio + Career + Company Dashboard
Phase 5 (Minggu 18–20) → WAHA + Notifikasi + Testing + Launch
```

---

## Role Pengguna

| Role | Kode | Deskripsi |
|------|------|-----------|
| Mahasiswa | `student` | Akademik, portofolio, karier |
| Dosen Wali | `lecturer` | Monitoring bimbingan |
| Admin Kampus | `admin` | Kelola sistem & pengguna |
| Perusahaan | `company` | Talent scouting |

---

## Tabel Database

```
universities          study_programs        academic_rules
users                 student_semesters     student_grades
student_targets       student_portfolios    portfolio_categories
career_interests      companies             company_categories
advisor_students      notifications         whatsapp_logs
settings
```

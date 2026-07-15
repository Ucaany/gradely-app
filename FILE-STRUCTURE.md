# Gradely — Project File Structure

```
Saas -Gredly/
├── PLAN.md                          # Master planning index
├── ROADMAP.md                       # Development roadmap 20 minggu
├── STATUS-REPORT.md                 # Phase progress tracker
├── ARCHITECTURE.md                  # Diagram Mermaid arsitektur sistem
│
├── docs/                            # Dokumen perencanaan (PRD)
│   ├── 01-project-overview.md
│   ├── 02-user-roles.md
│   ├── 03-scope-mvp.md
│   ├── 04-academic-rules.md
│   ├── 05-dummy-data.md
│   ├── 06-database-schema.md
│   ├── 07-tech-stack.md
│   ├── 08-development-roadmap.md
│   ├── 09-future-roadmap.md
│   └── 10-definition-of-done.md
│
└── gradely/                         # Next.js 14 Application
    ├── next.config.mjs
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── components.json              # shadcn/ui config
    ├── package.json
    ├── .env.local.example
    │
    ├── supabase/
    │   ├── config.toml
    │   ├── seed.sql                 # ISI Yogyakarta base data
    │   └── migrations/
    │       ├── 001_initial_schema.sql        # 16 tabel + RLS + indexes
    │       ├── 002_seed_isi_yogyakarta.sql   # Kampus + 10 prodi + rules
    │       ├── 003_add_semester_type.sql
    │       ├── 004_add_semester_type_users.sql
    │       ├── 005_add_join_code.sql
    │       ├── 006_add_onboarding.sql
    │       ├── 007_add_student_company_interests.sql
    │       ├── 008_add_skill_industry_options.sql
    │       ├── 009_add_target_ipk_years.sql
    │       ├── 010_add_graduation_achievements.sql
    │       ├── 011_portfolio_enhancements.sql
    │       ├── 012_portfolio_metadata.sql
    │       ├── 013_add_company_address.sql
    │       └── 014_add_companies_user_unique.sql
    │
    └── src/
        ├── middleware.ts            # RBAC + onboarding gate
        │
        ├── types/
        │   └── index.ts            # Semua TypeScript interfaces (497 baris)
        │
        ├── hooks/
        │   └── use-mobile.ts
        │
        ├── lib/
        │   ├── utils.ts            # cn() helper
        │   ├── waha.ts             # WAHA client + templates + logger
        │   ├── supabase/
        │   │   ├── client.ts       # Browser client
        │   │   ├── server.ts       # Server client (RSC + API routes)
        │   │   └── middleware.ts   # Middleware client
        │   ├── utils/
        │   │   ├── academic.ts     # IPK/IPS/SKS/status calculation engine
        │   │   └── index.ts
        │   ├── validations/
        │   │   └── index.ts        # Semua Zod schemas
        │   └── constants/
        │       └── career.ts       # 12 career options
        │
        ├── components/
        │   ├── ui/                 # 31 shadcn/ui primitives
        │   │   ├── alert-dialog.tsx
        │   │   ├── alert.tsx
        │   │   ├── avatar.tsx
        │   │   ├── badge.tsx
        │   │   ├── breadcrumb.tsx
        │   │   ├── button.tsx
        │   │   ├── card.tsx
        │   │   ├── chart.tsx
        │   │   ├── checkbox.tsx
        │   │   ├── collapsible.tsx
        │   │   ├── dialog.tsx
        │   │   ├── dropdown-menu.tsx
        │   │   ├── field.tsx
        │   │   ├── form.tsx
        │   │   ├── input-group.tsx
        │   │   ├── input.tsx
        │   │   ├── label.tsx
        │   │   ├── popover.tsx
        │   │   ├── progress.tsx
        │   │   ├── radio-group.tsx
        │   │   ├── select.tsx
        │   │   ├── separator.tsx
        │   │   ├── sheet.tsx
        │   │   ├── sidebar.tsx
        │   │   ├── skeleton.tsx
        │   │   ├── sonner.tsx
        │   │   ├── switch.tsx
        │   │   ├── table.tsx
        │   │   ├── tabs.tsx
        │   │   ├── textarea.tsx
        │   │   └── tooltip.tsx
        │   │
        │   ├── admin/              # 15 komponen admin
        │   │   ├── academic-rule-actions.tsx
        │   │   ├── academic-rules-view.tsx
        │   │   ├── ai-settings-form.tsx
        │   │   ├── company-detail-actions.tsx
        │   │   ├── dashboard-chart.tsx
        │   │   ├── gemini-settings-form.tsx
        │   │   ├── import-csv-form.tsx
        │   │   ├── lecturers-view.tsx
        │   │   ├── send-lecturer-dialog.tsx
        │   │   ├── student-status-chart.tsx
        │   │   ├── students-search-form.tsx
        │   │   ├── study-program-actions.tsx
        │   │   ├── study-program-toggle.tsx
        │   │   ├── user-detail-actions.tsx
        │   │   └── waha-settings-form.tsx
        │   │
        │   ├── student/            # 9 komponen mahasiswa
        │   │   ├── category-metadata-fields.tsx
        │   │   ├── grade-form-dialog.tsx
        │   │   ├── graduation-achievement.tsx
        │   │   ├── notification-bell.tsx
        │   │   ├── portfolio-form.tsx
        │   │   ├── student-ipk-chart.tsx
        │   │   ├── student-ips-chart.tsx
        │   │   ├── student-sks-chart.tsx
        │   │   └── student-target-chart.tsx
        │   │
        │   ├── lecturer/           # 4 komponen dosen
        │   │   ├── join-code-client.tsx
        │   │   ├── lecturer-status-chart.tsx
        │   │   ├── risk-page-client.tsx
        │   │   └── send-message-dialog.tsx
        │   │
        │   ├── shared/             # 3 komponen shared
        │   │   ├── create-user-form.tsx
        │   │   ├── link-preview.tsx
        │   │   └── notification-inbox.tsx
        │   │
        │   ├── admin-header.tsx
        │   ├── app-sidebar.tsx
        │   ├── auth-divider.tsx
        │   ├── company-header.tsx
        │   ├── company-sidebar.tsx
        │   ├── dark-mode-toggle.tsx
        │   ├── floating-paths.tsx
        │   ├── lecturer-header.tsx
        │   ├── lecturer-sidebar.tsx
        │   ├── login-form.tsx
        │   ├── logo.tsx
        │   ├── nav-main.tsx
        │   ├── nav-projects.tsx
        │   ├── nav-secondary.tsx
        │   ├── nav-user.tsx
        │   ├── student-header.tsx
        │   └── student-sidebar.tsx
        │
        └── app/
            ├── layout.tsx           # Root layout + providers
            ├── page.tsx             # Root redirect → role dashboard
            ├── globals.css
            ├── favicon.ico
            ├── fonts/
            │   ├── GeistVF.woff
            │   └── GeistMonoVF.woff
            │
            ├── (auth)/              # Grup route autentikasi
            │   ├── layout.tsx
            │   ├── login/
            │   │   └── page.tsx
            │   ├── reset-password/
            │   │   └── page.tsx
            │   └── update-password/
            │       └── page.tsx
            │
            ├── (onboarding)/        # Grup route onboarding
            │   ├── layout.tsx
            │   ├── student/
            │   │   └── onboarding/
            │   │       └── page.tsx  # 3-step: skills · career · profile
            │   └── company/
            │       └── onboarding/
            │           └── page.tsx
            │
            ├── (admin)/             # Grup route admin
            │   ├── layout.tsx       # Auth guard role=admin
            │   └── admin/
            │       ├── dashboard/
            │       │   └── page.tsx
            │       ├── account/
            │       │   └── page.tsx
            │       ├── study-programs/
            │       │   └── page.tsx
            │       ├── academic-rules/
            │       │   └── page.tsx
            │       ├── skills-career/
            │       │   └── page.tsx
            │       ├── settings/
            │       │   ├── page.tsx          # WAHA config
            │       │   └── general/
            │       │       └── page.tsx      # Institution settings
            │       └── users/
            │           ├── import/
            │           │   └── page.tsx      # Bulk CSV import
            │           ├── students/
            │           │   ├── page.tsx
            │           │   ├── new/
            │           │   │   └── page.tsx
            │           │   └── [id]/
            │           │       └── page.tsx
            │           ├── lecturers/
            │           │   ├── page.tsx
            │           │   ├── new/
            │           │   │   └── page.tsx
            │           │   └── [id]/
            │           │       └── page.tsx
            │           └── companies/
            │               ├── page.tsx
            │               ├── new/
            │               │   └── page.tsx
            │               └── [id]/
            │                   └── page.tsx
            │
            ├── (student)/           # Grup route mahasiswa
            │   ├── layout.tsx       # Auth guard role=student
            │   └── student/
            │       ├── dashboard/
            │       │   └── page.tsx
            │       ├── grades/
            │       │   ├── page.tsx
            │       │   └── import/
            │       │       └── page.tsx      # KHS import via GPT-4o
            │       ├── target/
            │       │   ├── page.tsx
            │       │   └── history/
            │       │       ├── page.tsx
            │       │       └── [id]/
            │       │           └── page.tsx
            │       ├── portfolio/
            │       │   ├── page.tsx
            │       │   ├── new/
            │       │   │   └── page.tsx
            │       │   └── [id]/
            │       │       └── edit/
            │       │           └── page.tsx
            │       ├── career/
            │       │   └── page.tsx
            │       ├── companies/
            │       │   └── page.tsx
            │       ├── profile/
            │       │   └── page.tsx
            │       └── settings/
            │           ├── page.tsx
            │           └── invite/
            │               └── page.tsx      # Join advisor via kode
            │
            ├── (lecturer)/          # Grup route dosen
            │   ├── layout.tsx       # Auth guard role=lecturer
            │   └── lecturer/
            │       ├── dashboard/
            │       │   └── page.tsx
            │       ├── students/
            │       │   ├── page.tsx
            │       │   └── [id]/
            │       │       └── page.tsx      # Detail mahasiswa bimbingan
            │       ├── risk/
            │       │   └── page.tsx          # Monitoring risiko akademik
            │       ├── join-code/
            │       │   └── page.tsx
            │       └── profile/
            │           └── page.tsx
            │
            ├── (company)/           # Grup route perusahaan
            │   ├── layout.tsx       # Auth guard role=company
            │   └── company/
            │       ├── dashboard/
            │       │   └── page.tsx          # Talent scouting
            │       ├── students/
            │       │   └── page.tsx
            │       └── profile/
            │           └── page.tsx
            │
            └── api/                 # API Route Handlers
                ├── auth/
                │   ├── signout/
                │   │   └── route.ts
                │   └── change-password/
                │       └── route.ts
                │
                ├── student/
                │   ├── profile/route.ts
                │   ├── summary/route.ts
                │   ├── onboarding/companies/route.ts
                │   ├── join-advisor/route.ts
                │   ├── notifications/route.ts
                │   ├── companies/route.ts
                │   ├── grades/
                │   │   ├── route.ts
                │   │   └── [id]/route.ts
                │   ├── target/
                │   │   ├── route.ts
                │   │   ├── analyze/route.ts   # GPT-4o AI analysis
                │   │   └── history/
                │   │       ├── route.ts
                │   │       └── [id]/route.ts
                │   ├── achievement/
                │   │   └── route.ts
                │   ├── khs-import/
                │   │   ├── route.ts           # Bulk insert
                │   │   └── parse/route.ts     # GPT-4o parse KHS
                │   ├── portfolio/
                │   │   ├── route.ts
                │   │   ├── categories/route.ts
                │   │   └── [id]/route.ts
                │   └── career/
                │       └── route.ts
                │
                ├── lecturer/
                │   ├── join-code/route.ts
                │   └── send-message/route.ts
                │
                ├── admin/
                │   ├── users/
                │   │   ├── route.ts
                │   │   └── [id]/route.ts
                │   ├── study-programs/
                │   │   ├── route.ts
                │   │   └── [id]/route.ts
                │   ├── academic-rules/
                │   │   ├── route.ts
                │   │   └── [id]/route.ts
                │   ├── companies/
                │   │   ├── route.ts
                │   │   └── [id]/route.ts
                │   ├── skills/
                │   │   ├── route.ts
                │   │   └── [id]/route.ts
                │   ├── industries/
                │   │   ├── route.ts
                │   │   └── [id]/route.ts
                │   ├── import/route.ts
                │   ├── chart-data/route.ts
                │   ├── student-status/route.ts
                │   ├── settings/route.ts
                │   ├── notifications/route.ts
                │   ├── send-message-lecturer/route.ts
                │   ├── ai/test/route.ts
                │   └── waha/test/route.ts
                │
                ├── company/
                │   ├── students/route.ts
                │   ├── study-programs/route.ts
                │   ├── profile/route.ts
                │   ├── onboarding/route.ts
                │   └── sync-students/route.ts
                │
                └── waha/
                    └── send/route.ts
```

---

## Ringkasan Statistik

| Kategori | Jumlah |
|----------|--------|
| Halaman (pages) | 38 halaman |
| API Routes | 52 endpoint |
| Komponen | 69 komponen |
| shadcn/ui primitives | 31 |
| Tabel database | 19 |
| Migrasi database | 14 |
| Dokumen PRD | 10 |

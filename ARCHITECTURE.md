# Gradely — Architecture & Diagrams

| Informasi | Detail |
|-----------|--------|
| Project | Gradely MVP |
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| Last Updated | 10 Juli 2026 |

---

## 1. System Architecture Overview

```mermaid
graph TB
    subgraph Client["Client (Browser)"]
        UI[Next.js App Router<br/>React Server Components]
    end

    subgraph Server["Server (Vercel)"]
        MW[Middleware<br/>RBAC + Onboarding Gate]
        API[API Routes<br/>Route Handlers]
        LIB[Lib Layer<br/>academic.ts · waha.ts · validations]
    end

    subgraph External["External Services"]
        SB[(Supabase<br/>PostgreSQL + Auth + Storage)]
        OAI[OpenAI GPT-4o<br/>KHS Parse + AI Analysis]
        WAHA[WAHA Server<br/>WhatsApp HTTP API<br/>VPS/Docker]
    end

    UI -->|Request| MW
    MW -->|Authorized| API
    API -->|Supabase Client| SB
    API -->|OpenAI SDK| OAI
    API -->|HTTP POST| WAHA
    LIB -->|Pure Functions| API
    SB -->|Realtime / RLS| UI
```

---

## 2. User Roles & Route Map

```mermaid
graph LR
    Login["/login"] --> |role=student| SD["/student/dashboard"]
    Login --> |role=lecturer| LD["/lecturer/dashboard"]
    Login --> |role=admin| AD["/admin/dashboard"]
    Login --> |role=company| CD["/company/dashboard"]

    subgraph Onboarding
        SO["/student/onboarding<br/>3-step: skills · career · profile"]
        CO["/company/onboarding<br/>company profile setup"]
    end

    SD -->|onboarding_completed=false| SO
    CD -->|onboarding_completed=false| CO

    subgraph Student["Student Routes"]
        SD
        SG["/student/grades"]
        SGI["/student/grades/import"]
        ST["/student/target"]
        SP["/student/portfolio"]
        SC["/student/career"]
        SCo["/student/companies"]
        SPr["/student/profile"]
        SS["/student/settings"]
    end

    subgraph Lecturer["Lecturer Routes"]
        LD
        LS["/lecturer/students"]
        LSD["/lecturer/students/[id]"]
        LR["/lecturer/risk"]
        LJ["/lecturer/join-code"]
        LP["/lecturer/profile"]
    end

    subgraph Admin["Admin Routes"]
        AD
        AUS["/admin/users/students"]
        AUL["/admin/users/lecturers"]
        AUC["/admin/users/companies"]
        ASP["/admin/study-programs"]
        AAR["/admin/academic-rules"]
        ASC["/admin/skills-career"]
        AST["/admin/settings"]
    end

    subgraph Company["Company Routes"]
        CD
        CDS["/company/dashboard (students)"]
        CP["/company/profile"]
    end
```

---

## 3. Database Schema (ERD)

```mermaid
erDiagram
    universities {
        uuid id PK
        text name
        text short_name
        text city
        text province
        text website
        text logo_url
    }

    study_programs {
        uuid id PK
        uuid university_id FK
        text name
        text short_name
        text degree_level
        boolean is_active
    }

    academic_rules {
        uuid id PK
        uuid university_id FK
        uuid study_program_id FK
        int total_sks_graduation
        int normal_semester
        int max_semester
        numeric min_gpa
        int max_sks_per_semester
        int min_sks_per_semester
        text passing_grade
        jsonb grade_scale
    }

    users {
        uuid id PK
        uuid university_id FK
        uuid study_program_id FK
        text role
        text full_name
        text email
        text nim
        text phone
        text avatar_url
        int current_semester
        text current_semester_type
        boolean profile_visible
        boolean is_active
        text join_code
        boolean onboarding_completed
    }

    student_grades {
        uuid id PK
        uuid student_id FK
        int semester_number
        text semester_type
        text academic_year
        text course_name
        int credits
        text grade
        numeric grade_points
        boolean is_retake
    }

    student_targets {
        uuid id PK
        uuid student_id FK
        int target_semester
        numeric target_ipk
        int target_years
        text career_goal
        text notes
        boolean achievement_ipk_3
        boolean achievement_ipk_35
        boolean achievement_sks_100
        boolean achievement_no_retake
        boolean achievement_graduated
    }

    student_portfolios {
        uuid id PK
        uuid student_id FK
        uuid category_id FK
        text title
        text description
        text[] skills
        date start_date
        date end_date
        text status
        boolean is_public
        jsonb links
        jsonb metadata
    }

    portfolio_categories {
        uuid id PK
        text code
        text name
    }

    career_interests {
        uuid id PK
        uuid student_id FK
        text interest
    }

    companies {
        uuid id PK
        uuid user_id FK
        uuid university_id FK
        text company_name
        text industry
        text description
        text website
        text logo_url
        text address
        text postal_code
        boolean is_active
        boolean is_verified
    }

    advisor_students {
        uuid id PK
        uuid lecturer_id FK
        uuid student_id FK
        text join_code
    }

    notifications {
        uuid id PK
        uuid user_id FK
        text title
        text message
        boolean is_read
    }

    whatsapp_logs {
        uuid id PK
        uuid recipient_id FK
        text phone_number
        text message
        text status
        text error_message
        timestamptz sent_at
    }

    settings {
        uuid id PK
        uuid university_id FK
        text key
        text value
    }

    skill_options {
        uuid id PK
        text name
    }

    industry_options {
        uuid id PK
        text name
    }

    universities ||--o{ study_programs : has
    universities ||--o{ academic_rules : has
    universities ||--o{ users : has
    universities ||--o{ companies : has
    universities ||--o{ settings : has
    study_programs ||--o{ users : enrolled
    study_programs ||--o{ academic_rules : governs
    users ||--o{ student_grades : owns
    users ||--o{ student_targets : owns
    users ||--o{ student_portfolios : owns
    users ||--o{ career_interests : has
    users ||--o{ notifications : receives
    users ||--o{ whatsapp_logs : receives
    users ||--|| companies : manages
    users ||--o{ advisor_students : advises
    portfolio_categories ||--o{ student_portfolios : categorizes
```

---

## 4. Authentication & Middleware Flow

```mermaid
flowchart TD
    REQ[Incoming Request] --> MW[middleware.ts]

    MW --> CHECK_PUBLIC{Public Route?<br/>/login · /reset-password<br/>/update-password}
    CHECK_PUBLIC -->|Yes| PASS[Pass Through]
    CHECK_PUBLIC -->|No| GET_SESSION[Get Supabase Session]

    GET_SESSION --> HAS_SESSION{Has Session?}
    HAS_SESSION -->|No| REDIRECT_LOGIN[Redirect → /login]
    HAS_SESSION -->|Yes| GET_PROFILE[Fetch user profile<br/>role + is_active + onboarding_completed]

    GET_PROFILE --> IS_ACTIVE{is_active?}
    IS_ACTIVE -->|No| SIGNOUT[Sign Out → /login]
    IS_ACTIVE -->|Yes| CHECK_ROLE{Role matches<br/>requested path?}

    CHECK_ROLE -->|No| REDIRECT_HOME[Redirect → role home]
    CHECK_ROLE -->|Yes| CHECK_ONBOARDING{onboarding_completed?<br/>student or company only}

    CHECK_ONBOARDING -->|No| REDIRECT_ONBOARD[Redirect → /onboarding]
    CHECK_ONBOARDING -->|Yes| ALLOW[Allow Request]
```

---

## 5. Academic Calculation Engine

```mermaid
flowchart LR
    GRADES[student_grades\narray] --> IPS[calculateIPS\nSemester GPA]
    GRADES --> IPK[calculateIPK\nCumulative GPA]
    GRADES --> SKS[calculateSKSLulus\nPassed Credits]
    GRADES --> RETAKE[Count Retakes\nis_retake=true]

    IPS --> STATUS
    IPK --> STATUS
    SKS --> STATUS
    RETAKE --> STATUS

    RULES[academic_rules\nDB record] --> STATUS[calculateAcademicStatus]
    RULES --> PREDICT[predictGraduationSemester]
    SKS --> PREDICT

    STATUS --> RESULT1["ahead | on_track\nneed_attention\nrecovery_mode | critical"]
    PREDICT --> RESULT2["Predicted graduation\nsemester number"]

    RESULT1 --> SUMMARY[calculateAcademicSummary\nfull AcademicSummary object]
    RESULT2 --> SUMMARY
    IPK --> SUMMARY
    SKS --> SUMMARY
```

---

## 6. API Routes Map

```mermaid
graph TD
    subgraph AUTH["Auth API"]
        A1[POST /api/auth/signout]
        A2[POST /api/auth/change-password]
    end

    subgraph STUDENT_API["Student API"]
        S1[GET·PATCH /api/student/profile]
        S2[GET·POST /api/student/grades]
        S3[PATCH·DELETE /api/student/grades/id]
        S4[GET·POST /api/student/target]
        S5[POST /api/student/target/analyze]
        S6[GET·POST /api/student/portfolio]
        S7[PATCH·DELETE /api/student/portfolio/id]
        S8[GET /api/student/portfolio/categories]
        S9[GET·POST /api/student/career]
        S10[GET·POST /api/student/join-advisor]
        S11[GET /api/student/summary]
        S12[GET·POST /api/student/notifications]
        S13[POST /api/student/onboarding]
        S14[POST /api/student/khs-import/parse]
        S15[POST /api/student/khs-import]
        S16[GET /api/student/companies]
        S17[GET·POST /api/student/achievement]
    end

    subgraph LECTURER_API["Lecturer API"]
        L1[GET·POST /api/lecturer/join-code]
        L2[POST /api/lecturer/send-message]
    end

    subgraph ADMIN_API["Admin API"]
        AD1[GET·POST·DELETE /api/admin/users]
        AD2[GET·POST·DELETE /api/admin/study-programs]
        AD3[GET·POST·DELETE /api/admin/academic-rules]
        AD4[GET·POST·DELETE /api/admin/companies]
        AD5[POST /api/admin/import]
        AD6[GET /api/admin/chart-data]
        AD7[GET·POST /api/admin/settings]
        AD8[POST /api/admin/waha/test]
        AD9[GET·POST /api/admin/notifications]
        AD10[POST /api/admin/send-message-lecturer]
        AD11[GET /api/admin/student-status]
        AD12[GET /api/admin/skills]
        AD13[GET /api/admin/industries]
    end

    subgraph COMPANY_API["Company API"]
        C1[GET /api/company/students]
        C2[GET /api/company/study-programs]
        C3[GET·POST /api/company/profile]
        C4[POST /api/company/onboarding]
    end

    subgraph WAHA_API["WAHA API"]
        W1[POST /api/waha/send]
    end
```

---

## 7. WAHA WhatsApp Integration Flow

```mermaid
sequenceDiagram
    actor Admin
    actor Lecturer
    participant API as Next.js API
    participant LIB as waha.ts
    participant DB as Supabase DB
    participant WAHA as WAHA Server

    Admin->>API: POST /api/admin/settings (save WAHA config)
    API->>DB: INSERT settings (waha_url, waha_session, waha_api_key)

    Admin->>API: POST /api/admin/waha/test
    API->>LIB: getWahaSettings(universityId)
    LIB->>DB: SELECT settings WHERE key IN (waha_*)
    DB-->>LIB: settings
    LIB->>WAHA: GET /api/checkNumberStatus
    WAHA-->>API: {status: connected}
    API-->>Admin: Test result

    Lecturer->>API: POST /api/lecturer/send-message
    API->>LIB: sendAndLog(universityId, payload)
    LIB->>LIB: normalizePhone(phone) → 62xxx@c.us
    LIB->>WAHA: POST /api/sendText {chatId, text}
    WAHA-->>LIB: {sent: true}
    LIB->>DB: INSERT whatsapp_logs (status=sent)
    API-->>Lecturer: Success
```

---

## 8. KHS AI Import Flow

```mermaid
sequenceDiagram
    actor Student
    participant Page as /student/grades/import
    participant API1 as /api/student/khs-import/parse
    participant OAI as OpenAI GPT-4o
    participant API2 as /api/student/khs-import
    participant DB as Supabase DB

    Student->>Page: Upload KHS file (PDF/text)
    Page->>API1: POST {fileContent}
    API1->>OAI: Parse KHS → extract courses, credits, grades
    OAI-->>API1: [{course_name, credits, grade, semester}]
    API1-->>Page: Parsed grades preview
    Page->>Student: Show preview table
    Student->>Page: Confirm import
    Page->>API2: POST {grades[]}
    API2->>DB: Validate + bulk INSERT student_grades
    DB-->>API2: Inserted rows
    API2-->>Page: Success
    Page->>Student: Redirect to /student/grades
```

---

## 9. Company Talent Scouting Flow

```mermaid
sequenceDiagram
    actor Company
    participant Page as /company/dashboard
    participant API as /api/company/students
    participant DB as Supabase (RLS)

    Company->>Page: Open dashboard
    Page->>API: GET /api/company/students
    API->>DB: SELECT users WHERE profile_visible=true<br/>+ JOIN career_interests<br/>+ JOIN student_portfolios<br/>+ filter by prodi/IPK/skill/career
    Note over DB: RLS enforces:<br/>only profile_visible=true students
    DB-->>API: Filtered student list
    API-->>Page: Students with portfolio links
    Page->>Company: Grid of student cards

    Company->>Page: Apply filter (prodi, IPK min, skill, career)
    Page->>API: GET /api/company/students?prodi=X&ipk=3.0&skill=Y
    API->>DB: Re-query with filters
    DB-->>API: Filtered results
    API-->>Page: Updated list
```

---

## 10. Component Dependency Tree

```mermaid
graph TD
    subgraph Pages["Pages (RSC)"]
        P1[student/dashboard/page.tsx]
        P2[lecturer/students/id/page.tsx]
        P3[admin/dashboard/page.tsx]
        P4[company/dashboard/page.tsx]
    end

    subgraph StudentComp["Student Components"]
        SC1[StudentIPKChart]
        SC2[StudentIPSChart]
        SC3[StudentSKSChart]
        SC4[StudentTargetChart]
        SC5[GradeFormDialog]
        SC6[PortfolioForm]
        SC7[NotificationBell]
        SC8[GraduationAchievement]
    end

    subgraph LecturerComp["Lecturer Components"]
        LC1[LecturerStatusChart]
        LC2[RiskPageClient]
        LC3[SendMessageDialog]
        LC4[JoinCodeClient]
    end

    subgraph AdminComp["Admin Components"]
        AC1[DashboardChart]
        AC2[StudentStatusChart]
        AC3[ImportCSVForm]
        AC4[WahaSettingsForm]
        AC5[StudyProgramActions]
        AC6[AcademicRuleActions]
    end

    subgraph SharedComp["Shared Components"]
        SH1[CreateUserForm]
        SH2[NotificationInbox]
        SH3[LinkPreview]
    end

    subgraph UI["shadcn/ui Primitives (31)"]
        UI1[Button · Input · Form]
        UI2[Dialog · Sheet · Tabs]
        UI3[Table · Card · Badge]
        UI4[Chart · Select · Checkbox]
        UI5[Sidebar · Toast · Avatar]
    end

    P1 --> SC1 & SC2 & SC3 & SC7
    P2 --> SC1 & SC2 & LC3
    P3 --> AC1 & AC2
    P4 --> SH3

    SC1 & SC2 & SC3 & SC4 --> UI4
    SC5 & SC6 --> UI1 & UI2
    LC1 --> UI4
    LC2 & LC3 --> UI1 & UI2 & UI3
    AC1 & AC2 --> UI4
    AC3 & AC4 --> UI1 & UI2
    SH1 --> UI1 & UI2
```

---

## 11. Deployment Architecture

```mermaid
graph TB
    subgraph Internet["Internet"]
        USER[Users<br/>Mahasiswa · Dosen · Admin · Company]
    end

    subgraph Vercel["Vercel (Frontend + API)"]
        NEXT[Next.js 14<br/>App Router + API Routes]
        EDGE[Edge Middleware<br/>RBAC + Session]
    end

    subgraph SupabaseCloud["Supabase Cloud"]
        PG[(PostgreSQL<br/>16 tables + RLS)]
        AUTH[Supabase Auth<br/>JWT + Sessions]
        STORAGE[Supabase Storage<br/>Avatars + Logos]
    end

    subgraph VPS["VPS / Docker"]
        WAHA_SVC[WAHA Service<br/>WhatsApp HTTP API]
        WA[WhatsApp<br/>Business Number]
    end

    subgraph External["External APIs"]
        OPENAI[OpenAI API<br/>GPT-4o]
    end

    USER -->|HTTPS| EDGE
    EDGE --> NEXT
    NEXT -->|Supabase Client| PG
    NEXT -->|Supabase Auth| AUTH
    NEXT -->|Supabase Storage| STORAGE
    NEXT -->|HTTP REST| WAHA_SVC
    NEXT -->|OpenAI SDK| OPENAI
    WAHA_SVC <-->|WhatsApp Protocol| WA
    WA -->|Messages| USER
```

---

## 12. Development Phase Timeline (Gantt)

```mermaid
gantt
    title Gradely MVP Development Timeline
    dateFormat  YYYY-MM-DD
    axisFormat  %d %b

    section Phase 1 — Fondasi
    Setup & Database          :done, p1a, 2026-06-01, 7d
    Authentication            :done, p1b, after p1a, 7d
    Admin User Management     :done, p1c, after p1b, 7d
    Audit & Polish            :done, p1d, after p1c, 7d

    section Phase 2 — Akademik
    Dashboard Mahasiswa       :done, p2a, after p1d, 7d
    Input & Manajemen Nilai   :done, p2b, after p2a, 7d
    Import KHS via AI         :done, p2c, after p2b, 7d
    Kalkulasi & Grafik        :done, p2d, after p2c, 7d
    Target Kelulusan          :done, p2e, after p2d, 7d

    section Phase 3 — Dosen
    Dashboard Dosen           :done, p3a, after p2e, 7d
    Join Code & Detail        :done, p3b, after p3a, 7d
    Monitoring Risiko         :done, p3c, after p3b, 7d
    Polish Phase 3            :done, p3d, after p3c, 7d

    section Phase 4 — Portfolio & Career
    Portofolio Mahasiswa      :done, p4a, after p3d, 7d
    Career Profile            :done, p4b, after p4a, 7d
    Company Dashboard         :done, p4c, after p4b, 7d
    Polish Phase 4            :done, p4d, after p4c, 7d

    section Phase 5 — WAHA & Launch
    Integrasi WAHA            :active, p5a, after p4d, 7d
    Notifikasi & E2E Testing  :p5b, after p5a, 7d
    Optimasi & Launch         :p5c, after p5b, 7d
```

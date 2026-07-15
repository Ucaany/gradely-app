# 07 — Technology Stack & Security

| Informasi | Detail |
|-----------|--------|
| Versi | 1.0 (MVP) |
| Tanggal Dokumen | 09 Juli 2026 |

---

## 7.1 Frontend

| Teknologi | Versi | Fungsi |
|-----------|-------|--------|
| Next.js | 14+ (App Router) | Framework React SSR/SSG |
| TypeScript | 5+ | Type safety |
| Tailwind CSS | 3+ | Utility-first styling |
| shadcn/ui | Latest | Komponen UI accessible |

### Struktur Direktori Frontend

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Login, Reset Password
│   ├── (student)/          # Dashboard, Nilai, Portofolio
│   ├── (lecturer)/         # Dashboard Dosen
│   ├── (admin)/            # Panel Admin
│   └── (company)/          # Company Dashboard
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── charts/             # Recharts / chart components
│   └── shared/             # Komponen reusable
├── lib/
│   ├── supabase/           # Supabase client & server
│   ├── utils/              # Helper functions
│   └── validations/        # Zod schemas
├── hooks/                  # Custom React hooks
└── types/                  # TypeScript types & interfaces
```

### Library Pendukung

| Library | Fungsi |
|---------|--------|
| Recharts | Grafik IPK, IPS, progress |
| React Hook Form | Form handling |
| Zod | Schema validation |
| date-fns | Manipulasi tanggal |
| lucide-react | Icon set (bawaan shadcn) |

---

## 7.2 Backend

| Teknologi | Fungsi |
|-----------|--------|
| Supabase | BaaS (Backend as a Service) |
| PostgreSQL | Primary database |
| Supabase Auth | Autentikasi & session management |
| Supabase Storage | Penyimpanan avatar (opsional MVP) |
| Edge Functions | Server-side logic jika diperlukan |

### Alasan Memilih Supabase
- RLS built-in — akses data diamankan di level database
- Auth sudah terintegrasi dengan tabel users
- Real-time subscription untuk notifikasi
- Gratis tier cukup untuk MVP

---

## 7.3 Integrasi: WAHA (WhatsApp HTTP API)

| Aspek | Detail |
|-------|--------|
| Library | WAHA (self-hosted WhatsApp API) |
| Trigger | Supabase Edge Function atau API Route Next.js |
| Konfigurasi | Disimpan di tabel `settings` (dinamis) |
| Format | REST API, pesan teks |

### Flow Pengiriman WhatsApp

```
Trigger (akhir semester / risk alert)
  → Next.js API Route / Edge Function
  → Ambil konfigurasi WAHA dari settings
  → POST ke WAHA endpoint
  → Simpan log ke tabel whatsapp_logs
```

---

## 7.4 Version Control

| Platform | GitHub |
|----------|--------|
| Strategi branch | main (prod) + feature branches |
| PR Review | Wajib sebelum merge ke main |

---

## 7.5 Security

### Lapisan Keamanan

| Lapisan | Implementasi |
|---------|--------------|
| Transport | HTTPS wajib |
| Autentikasi | Supabase Auth (JWT) |
| Otorisasi | Role-Based Access Control (RBAC) |
| Database | Row Level Security (RLS) |
| Consent | Toggle profil mahasiswa ke perusahaan |
| Audit | Tabel `whatsapp_logs` + Supabase logs |

### RBAC di Frontend

```typescript
// Middleware Next.js — proteksi route berdasarkan role
// src/middleware.ts

const ROLE_ROUTES = {
  student:  ['/student'],
  lecturer: ['/lecturer'],
  admin:    ['/admin'],
  company:  ['/company'],
}
```

### RLS — Prinsip

- **Student**: hanya bisa akses data milik sendiri
- **Lecturer**: hanya bisa baca data mahasiswa bimbingan
- **Admin**: akses penuh dalam scope universitas
- **Company**: hanya bisa baca profil student dengan `profile_visible = TRUE`

Lihat contoh policy lengkap di [06 — Database Schema](./06-database-schema.md#618-row-level-security-rls).

### Perlindungan Data Sensitif

- NIM tidak ditampilkan ke company
- Detail nilai tidak ditampilkan ke company
- Data profil ditampilkan ke company hanya jika consent aktif
- API key WAHA disimpan di `settings` table, tidak di environment variable yang exposed ke client

### Input Validation

- Semua input form divalidasi dengan **Zod** di sisi client dan server
- Import file (KHS/KRS) divalidasi format sebelum diproses

---

## 7.6 Deployment

| Platform | Pilihan |
|----------|---------|
| Frontend | Vercel (recommended) |
| Database | Supabase Cloud |
| WAHA | Self-hosted VPS atau Docker |

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server-side only
```

---

## Dokumen Terkait

- [06 — Database Schema](./06-database-schema.md)
- [08 — Development Roadmap](./08-development-roadmap.md)

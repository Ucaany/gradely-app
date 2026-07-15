# 03 — Scope MVP

| Informasi | Detail |
|-----------|--------|
| Versi | 1.0 (MVP) |
| Tanggal Dokumen | 09 Juli 2026 |

---

## Modul 1 — Authentication

### Fitur
- Login dengan email dan password
- Reset password via email
- Role-Based Access Control (RBAC)
- Session management via Supabase Auth

### Catatan
- Registrasi mandiri **tidak tersedia**
- Seluruh akun dibuat oleh Admin Kampus
- Supabase Auth digunakan sebagai identity provider
- RLS (Row Level Security) diterapkan di seluruh tabel

### Flow Login
```
User input email + password
  → Supabase Auth verifikasi
  → Load role dari tabel users
  → Redirect ke dashboard sesuai role
```

---

## Modul 2 — Dashboard Mahasiswa

### Informasi Profil
- Foto Profil
- Nama Lengkap
- NIM
- Program Studi
- Semester aktif
- Target Kelulusan
- Target Karier

### Widget
| Widget | Deskripsi |
|--------|-----------|
| Progress SKS | Persentase SKS lulus vs total kelulusan |
| Progress Semester | Semester aktif vs target semester |
| IPK | Indeks Prestasi Kumulatif terkini |
| IPS Terakhir | Indeks Prestasi Semester terakhir |
| Mata Kuliah Lulus | Jumlah dan daftar MK yang sudah lulus |
| Mata Kuliah Mengulang | Daftar MK yang perlu diulang |
| Prediksi Kelulusan | Estimasi semester kelulusan berdasarkan progres |

### Status Visual Akademik
| Status | Indikator | Kondisi |
|--------|-----------|---------|
| Ahead | 🟢 | Progres melebihi target |
| On Track | 🔵 | Progres sesuai target |
| Need Attention | 🟡 | Progres sedikit di bawah target |
| Recovery Mode | 🟠 | Progres jauh di bawah target |
| Critical | 🔴 | Risiko tidak lulus tepat waktu |

---

## Modul 3 — Nilai Akademik

### Input Manual Mahasiswa
| Field | Tipe | Keterangan |
|-------|------|------------|
| Semester | Integer | 1–14 |
| Nama Mata Kuliah | Text | |
| SKS | Integer | 1–6 |
| Nilai | Enum | A, AB, B, BC, C, D, E |

### Fitur Import
- **Import KHS** — upload file KHS dalam format yang didukung
- **Import KRS** — upload file KRS untuk rencana semester

### Riwayat & Grafik
- Riwayat nilai per semester
- Grafik tren IPK (line chart)
- Grafik IPS per semester (bar chart)

### Perhitungan Otomatis
| Kalkulasi | Formula |
|-----------|---------|
| IPS | Σ(bobot_nilai × SKS) / Σ SKS dalam satu semester |
| IPK | Σ(bobot_nilai × SKS) / Σ total SKS |
| SKS Lulus | Jumlah SKS dengan nilai ≥ D (atau sesuai aturan kampus) |
| SKS Tersisa | Total SKS kelulusan − SKS lulus |

### Konversi Nilai
| Nilai | Bobot |
|-------|-------|
| A | 4.0 |
| AB | 3.5 |
| B | 3.0 |
| BC | 2.5 |
| C | 2.0 |
| D | 1.0 |
| E | 0.0 |

---

## Modul 4 — Target Kelulusan

### Pilihan Target Semester
- Semester 7
- Semester 8
- Semester 9

### Kalkulasi Sistem
- Persentase progres SKS saat ini
- Prediksi semester kelulusan berdasarkan rata-rata SKS per semester
- SKS yang harus diambil per semester untuk mencapai target

### Contoh Tampilan
```
Target: Semester 8
Progres: 110 / 144 SKS

76%
████████████░░░░

SKS tersisa: 34
Rata-rata SKS/semester: 17
Prediksi: Semester 8 ✅
```

---

## Modul 5 — Portofolio

### Kategori Portfolio
| Kategori | Kode |
|----------|------|
| Sertifikat | `certificate` |
| Magang | `internship` |
| Volunteer | `volunteer` |
| Organisasi | `organization` |
| Prestasi | `achievement` |
| Kompetisi | `competition` |
| Workshop | `workshop` |
| Pelatihan | `training` |
| Proyek | `project` |
| Karya | `work` |
| Pengalaman | `experience` |

### Field per Item Portofolio
| Field | Wajib | Deskripsi |
|-------|-------|-----------|
| Judul | ✅ | Nama portofolio |
| Kategori | ✅ | Dari daftar di atas |
| Deskripsi | ✅ | Penjelasan singkat |
| Skill | ✅ | Tag skill yang relevan |
| Periode (mulai) | ✅ | Tanggal mulai |
| Periode (selesai) | ❌ | Kosong jika ongoing |
| Status | ✅ | Selesai / Ongoing |
| URL Google Drive | ❌ | Link dokumen/file |
| URL GitHub | ❌ | Link repositori |
| URL Behance | ❌ | Link karya desain |
| URL LinkedIn | ❌ | Link post/article |
| URL YouTube | ❌ | Link video |
| URL Website | ❌ | Link lainnya |

> MVP hanya menyimpan metadata dan URL. File tidak diupload langsung ke sistem.

---

## Modul 6 — Career Profile

### Alur Pertama Login
1. Mahasiswa diminta memilih minimal 1 minat karier
2. Sistem menyimpan pilihan ke tabel `career_interests`
3. Dashboard menampilkan perusahaan yang relevan

### Contoh Minat Karier
- UI/UX Designer
- Programmer / Software Engineer
- Animator 2D/3D
- Videographer / Video Editor
- Graphic Designer
- Photographer
- Music Producer / Sound Designer
- Motion Designer
- Game Designer
- Ilustrator
- Content Creator
- Art Director

### Koneksi ke Company
- Sistem mencocokkan `career_interests` mahasiswa dengan `company_categories`
- Mahasiswa melihat daftar perusahaan yang relevan
- Perusahaan melihat mahasiswa jika consent aktif

---

## Modul 7 — Dashboard Dosen Wali

### Informasi Utama
- Jumlah total mahasiswa bimbingan
- Distribusi status akademik (chart)
- Daftar mahasiswa berisiko

### Status Per Mahasiswa
| Status | Warna | Trigger |
|--------|-------|---------|
| Aman | Hijau 🟢 | Semua indikator normal |
| Perhatian | Kuning 🟡 | 1–2 indikator bermasalah |
| Kritis | Merah 🔴 | 3+ indikator bermasalah |

### Indikator Risiko
- IPK turun dari semester sebelumnya
- Mengulang 1+ mata kuliah
- SKS per semester di bawah rata-rata
- Risiko tidak lulus sesuai target

### Detail Mahasiswa
Klik mahasiswa → halaman detail berisi:
- Histori nilai per semester
- Grafik IPK/IPS
- Status risiko lengkap
- Catatan dosen

### Kode Bergabung
- Dosen dapat membuat kode unik
- Mahasiswa menggunakan kode untuk terhubung ke dosen wali

---

## Modul 8 — Dashboard Admin Kampus

### Menu Navigasi
| Menu | Deskripsi |
|------|-----------|
| Dashboard | Ringkasan statistik kampus |
| Mahasiswa | CRUD data mahasiswa |
| Dosen | CRUD data dosen wali |
| Program Studi | Kelola program studi |
| Aturan Akademik | Konfigurasi aturan kelulusan |
| Perusahaan | Kelola mitra perusahaan |
| WAHA | Konfigurasi integrasi WhatsApp |
| Laporan | Export dan ringkasan data |
| Pengaturan | Konfigurasi sistem |

### Bulk Import
- Import mahasiswa via CSV
- Import dosen via CSV
- Validasi data sebelum insert

---

## Modul 9 — Company Dashboard

### Filter Pencarian Mahasiswa
| Filter | Tipe |
|--------|------|
| Program Studi | Multi-select |
| IPK minimum | Slider / Input |
| Skill | Multi-select tag |
| Target Karier | Multi-select |

### Aturan Tampil
- Mahasiswa **hanya muncul** jika toggle consent aktif
- Data yang ditampilkan: nama, prodi, IPK, skill, target karier, portofolio URL
- Data yang **tidak** ditampilkan: NIM, nilai detail, data pribadi sensitif

---

## Modul 10 — WhatsApp Notification (WAHA)

### Integrasi
- Menggunakan **WAHA** (WhatsApp HTTP API)
- Dikonfigurasi oleh Admin Kampus

### Trigger Pengiriman

#### Ke Mahasiswa
- Akhir semester: ringkasan akademik
  - IPK terkini
  - Total SKS
  - Status akademik
  - Reminder target kelulusan

#### Ke Dosen Wali
- Notifikasi mahasiswa berisiko
- Ringkasan bulanan mahasiswa bimbingan

#### Ke Admin
- Rekap keseluruhan semester
- Statistik platform

### Format Pesan
Pesan dikirim dalam format teks terstruktur.
Template pesan dikonfigurasi di panel Admin.

---

## Dokumen Terkait

- [04 — Academic Rules](./04-academic-rules.md)
- [05 — Dummy Data](./05-dummy-data.md)
- [06 — Database Schema](./06-database-schema.md)
- [08 — Development Roadmap](./08-development-roadmap.md)

# 02 — User Roles & Permission Matrix

| Informasi | Detail |
|-----------|--------|
| Versi | 1.0 (MVP) |
| Tanggal Dokumen | 09 Juli 2026 |

---

## 2.1 Daftar Role

Gradely memiliki 4 role pengguna:

| Role | Kode | Deskripsi |
|------|------|-----------|
| Mahasiswa | `student` | Pengguna utama, memantau akademik dan portofolio |
| Dosen Wali | `lecturer` | Memantau mahasiswa bimbingan |
| Admin Kampus | `admin` | Mengelola sistem, pengguna, dan aturan akademik |
| Perusahaan | `company` | Mencari kandidat mahasiswa |

> Registrasi mandiri tidak tersedia. Seluruh akun dibuat oleh Admin Kampus.

---

## 2.2 Detail Hak Akses per Role

### Mahasiswa (`student`)

| Fitur | Akses |
|-------|-------|
| Login | ✅ |
| Input nilai | ✅ |
| Import KHS | ✅ |
| Import KRS | ✅ |
| Kelola portofolio | ✅ |
| Target karier | ✅ |
| Target kelulusan | ✅ |
| Dashboard akademik | ✅ |
| Mengaktifkan profil perusahaan | ✅ |
| Monitoring mahasiswa lain | ❌ |
| User management | ❌ |

---

### Dosen Wali (`lecturer`)

| Fitur | Akses |
|-------|-------|
| Login | ✅ |
| Dashboard mahasiswa bimbingan | ✅ |
| Monitoring akademik per mahasiswa | ✅ |
| Detail histori akademik mahasiswa | ✅ |
| Membuat kode bergabung mahasiswa | ✅ |
| Laporan WhatsApp | ✅ |
| Input nilai mahasiswa | ❌ |
| Edit data mahasiswa | ❌ |
| User management | ❌ |

---

### Admin Kampus (`admin`)

| Fitur | Akses |
|-------|-------|
| Login | ✅ |
| Kelola pengguna (CRUD) | ✅ |
| Bulk import akun | ✅ |
| Aturan akademik | ✅ |
| Kelola perusahaan | ✅ |
| Konfigurasi WAHA | ✅ |
| Dashboard overview | ✅ |
| Lihat data semua mahasiswa | ✅ |
| Input nilai mahasiswa | ✅ |

---

### Perusahaan (`company`)

| Fitur | Akses |
|-------|-------|
| Login | ✅ |
| Melihat profil mahasiswa (dengan consent) | ✅ |
| Filter mahasiswa berdasarkan skill | ✅ |
| Filter mahasiswa berdasarkan program studi | ✅ |
| Filter mahasiswa berdasarkan IPK | ✅ |
| Filter mahasiswa berdasarkan target karier | ✅ |
| Edit data mahasiswa | ❌ |
| Melihat profil tanpa consent | ❌ |

---

## 2.3 Pain Points per Role

### Mahasiswa
- Tidak mengetahui sisa SKS yang harus ditempuh
- Tidak mengetahui mata kuliah mana yang belum lulus
- Tidak memiliki gambaran tren IPK dari semester ke semester
- Tidak memiliki portofolio yang terdokumentasi dan terstruktur

### Dosen Wali
- Monitoring akademik mahasiswa masih dilakukan secara manual
- Sulit mendeteksi mahasiswa yang mulai mengalami masalah akademik lebih awal
- Tidak ada sistem notifikasi otomatis untuk mahasiswa berisiko

### Admin Kampus
- Aturan akademik tidak terpusat, tersebar di berbagai dokumen
- Manajemen akun pengguna belum terotomasi

### Perusahaan
- Sulit menemukan kandidat mahasiswa yang sesuai kebutuhan industri
- Tidak ada platform khusus untuk talent scouting dari kampus seni

---

## 2.4 Permission Matrix Lengkap

| Fitur | Mahasiswa | Dosen | Admin | Company |
|-------|-----------|-------|-------|---------|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Input Nilai | ✅ | ❌ | ✅ | ❌ |
| Import KHS/KRS | ✅ | ❌ | ✅ | ❌ |
| Portofolio (write) | ✅ | ❌ | ✅ | ❌ |
| Portofolio (read) | ✅ | ✅ (bimbingan) | ✅ | ✅ (consent) |
| Career Profile (write) | ✅ | ❌ | ✅ | ❌ |
| Career Profile (read) | ✅ | ✅ | ✅ | ✅ |
| Target Kelulusan | ✅ | Read | ✅ | ❌ |
| Monitoring Akademik | ❌ | ✅ | ✅ | ❌ |
| User Management | ❌ | ❌ | ✅ | ❌ |
| Aturan Akademik | ❌ | ❌ | ✅ | ❌ |
| Konfigurasi WAHA | ❌ | ❌ | ✅ | ❌ |
| Laporan WhatsApp | ❌ | ✅ | ✅ | ❌ |
| Kelola Perusahaan | ❌ | ❌ | ✅ | ❌ |
| Filter & Cari Mahasiswa | ❌ | ❌ | ✅ | ✅ (consent) |

---

## 2.5 Consent Profil Perusahaan

Mahasiswa memiliki kontrol penuh atas visibilitas profil mereka ke perusahaan melalui toggle:

> **"Tampilkan Profil ke Perusahaan"**

- Default: **OFF** (profil tidak terlihat)
- Jika diaktifkan: profil, portofolio, IPK, skill, dan target karier dapat dilihat perusahaan
- Mahasiswa dapat menonaktifkan kapan saja

---

## Dokumen Terkait

- [01 — Project Overview](./01-project-overview.md)
- [03 — Scope MVP](./03-scope-mvp.md)
- [06 — Database Schema](./06-database-schema.md)

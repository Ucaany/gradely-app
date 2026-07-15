# 01 — Project Overview

> Gradely: Platform Monitoring Akademik, Perencanaan Kelulusan, Portofolio, dan Career Development Mahasiswa

| Informasi | Detail |
|-----------|--------|
| Versi | 1.0 (MVP) |
| Status | Ready for Development |
| Target Kampus MVP | Institut Seni Indonesia (ISI) Yogyakarta |
| Tanggal Dokumen | 09 Juli 2026 |

---

## 1.1 Executive Summary

Gradely adalah platform digital yang membantu mahasiswa memantau perkembangan akademik, menghitung progres kelulusan, mengevaluasi IPK dan IPS, menyusun target kelulusan, membangun portofolio, serta menghubungkan mahasiswa dengan perusahaan mitra.

Platform juga menyediakan dashboard khusus bagi dosen wali untuk memonitor mahasiswa bimbingan, mendeteksi risiko akademik lebih awal, dan mengirim laporan perkembangan melalui WhatsApp menggunakan WAHA.

Pada tahap MVP, Gradely ditujukan untuk satu kampus dengan arsitektur yang mudah dikembangkan menjadi platform multi-kampus (SaaS) di masa depan.

---

## 1.2 Product Vision

> Membantu setiap mahasiswa lulus tepat waktu, memiliki portofolio yang terdokumentasi dengan baik, serta lebih siap memasuki dunia kerja melalui monitoring akademik yang sederhana, visual, dan berbasis data.

---

## 1.3 Product Goals

### Mahasiswa
- Memahami progres akademik secara real-time
- Mengetahui sisa SKS dan mata kuliah yang belum lulus
- Memiliki target kelulusan yang jelas
- Mendokumentasikan portofolio secara terstruktur
- Menerima pengingat setiap akhir semester

### Dosen Wali
- Memantau seluruh mahasiswa bimbingan dari satu dashboard
- Mendeteksi mahasiswa berisiko lebih awal
- Mempercepat proses pembinaan akademik

### Admin Kampus
- Mengelola aturan akademik secara terpusat
- Mengelola akun pengguna
- Menghasilkan data monitoring akademik

### Perusahaan Mitra
- Menemukan mahasiswa sesuai kebutuhan industri
- Melihat profil mahasiswa yang telah memberikan persetujuan

---

## 1.4 Success Metrics (KPI)

| KPI | Target |
|-----|--------|
| Mahasiswa aktif memperbarui data setiap semester | 90% |
| Dosen wali membuka dashboard minimal 1x/bulan | 80% |
| Mahasiswa melengkapi portofolio | 70% |
| Keberhasilan pengiriman WhatsApp | 100% |
| Penurunan mahasiswa terlambat lulus | Meningkat setiap semester |

---

## 1.5 Ringkasan Modul MVP

| No | Modul | Pengguna Utama |
|----|-------|----------------|
| 1 | Authentication | Semua |
| 2 | Dashboard Mahasiswa | Mahasiswa |
| 3 | Nilai Akademik | Mahasiswa |
| 4 | Target Kelulusan | Mahasiswa |
| 5 | Portofolio | Mahasiswa |
| 6 | Career Profile | Mahasiswa |
| 7 | Dashboard Dosen | Dosen Wali |
| 8 | Dashboard Admin | Admin |
| 9 | Company Dashboard | Perusahaan |
| 10 | WhatsApp Notification | Semua |

---

## Dokumen Terkait

- [02 — User Roles & Permission Matrix](./02-user-roles.md)
- [03 — Scope MVP](./03-scope-mvp.md)
- [08 — Development Roadmap](./08-development-roadmap.md)

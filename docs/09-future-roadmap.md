# 09 — Future Roadmap (V2)

| Informasi | Detail |
|-----------|--------|
| Versi | Pasca-MVP (V2+) |
| Tanggal Dokumen | 09 Juli 2026 |

---

## 9.1 Filosofi V2

V2 dibangun setelah MVP terbukti berjalan stabil di satu kampus. Prioritas V2 adalah:

1. **Efisiensi operasional** — automasi lebih dalam (OCR, AI)
2. **Skalabilitas** — multi-kampus, SaaS model
3. **Nilai tambah pengguna** — AI advisor, CV generator, mobile app
4. **Data insight** — analitik lanjutan untuk pimpinan kampus

---

## 9.2 Fitur V2

### Integrasi SIAKAD
- Sinkronisasi data nilai langsung dari Sistem Informasi Akademik kampus
- Eliminasi input manual mahasiswa
- Sinkronisasi otomatis setiap akhir semester
- Mendukung format SIAKAD umum yang digunakan kampus di Indonesia

---

### OCR KHS/KRS
- Upload foto/scan KHS dan KRS
- Sistem membaca otomatis menggunakan OCR
- Ekstraksi data: nama MK, SKS, nilai
- Preview dan konfirmasi sebelum data disimpan
- Mengurangi effort input manual

---

### AI Academic Advisor
- Chatbot berbasis AI yang memahami data akademik mahasiswa
- Memberikan saran berdasarkan progres aktual:
  - "Kamu perlu ambil minimal 18 SKS semester depan untuk lulus semester 8"
  - "IPK kamu turun 0.3 poin. Mata kuliah mana yang ingin difokuskan?"
- Tidak menggantikan dosen wali, melengkapi dengan tersedianya 24/7

---

### AI Career Recommendation
- Analisis portofolio dan skill mahasiswa
- Rekomendasi jalur karier yang cocok
- Rekomendasi perusahaan berdasarkan kecocokan profil
- Saran skill gap yang perlu dipenuhi

---

### CV Generator
- Generate CV otomatis dari data portofolio, skill, dan akademik
- Template CV yang dapat dikustomisasi
- Export ke PDF
- Format standar industri kreatif

---

### Export PDF
- Export laporan akademik per mahasiswa ke PDF
- Export portofolio ke PDF
- Export rekap semester ke PDF
- Berguna untuk keperluan beasiswa, magang, dan administrasi kampus

---

### Mobile App (Android & iOS)
- Notifikasi push menggantikan/melengkapi WhatsApp
- Input nilai dari mobile
- Scan dan upload KHS/KRS dari kamera
- Akses portofolio dari mobile
- Dikembangkan dengan React Native atau Expo (code sharing dengan Next.js)

---

### Multi Kampus (SaaS)
- Satu platform dapat digunakan oleh banyak kampus
- Setiap kampus memiliki subdomain sendiri: `isi.gradely.id`, `unpad.gradely.id`
- Isolasi data antar kampus menggunakan RLS + `university_id`
- Billing per kampus (subscription model)
- Superadmin dashboard untuk mengelola semua kampus

---

### Dashboard Fakultas
- Dashboard untuk Dekan Fakultas
- Monitoring akademik agregat per program studi
- Statistik kelulusan, rata-rata IPK, distribusi nilai
- Identifikasi tren akademik lintas semester

---

### Dashboard Rektor / Pimpinan
- Gambaran besar seluruh kampus
- KPI akademik: tingkat kelulusan tepat waktu, rata-rata IPK
- Distribusi mahasiswa berisiko
- Laporan untuk akreditasi dan pelaporan ke Kemdikbud

---

### Analitik Akademik Lanjutan
- Korelasi antara jumlah SKS dan IPK
- Prediksi mahasiswa berisiko menggunakan machine learning
- Analisis performa per mata kuliah
- Benchmark antar program studi
- Insight untuk peningkatan kurikulum

---

## 9.3 Prioritas V2 (Urutan Pengembangan)

| Prioritas | Fitur | Alasan |
|-----------|-------|--------|
| 1 | OCR KHS/KRS | Langsung mengurangi friction user terbesar |
| 2 | Export PDF | Banyak diminta untuk keperluan administrasi |
| 3 | Mobile App | Akses lebih mudah, notifikasi push |
| 4 | Integrasi SIAKAD | Menghilangkan input manual sepenuhnya |
| 5 | AI Academic Advisor | Nilai tambah tinggi, perlu data historis dulu |
| 6 | Multi Kampus (SaaS) | Revenue model, butuh MVP yang terbukti dulu |
| 7 | Dashboard Fakultas / Rektor | Butuh data dari banyak mahasiswa |
| 8 | AI Career Recommendation | Butuh data portofolio yang cukup banyak |
| 9 | CV Generator | Butuh portofolio lengkap dari mahasiswa |
| 10 | Analitik Lanjutan | Butuh data historis multi-semester |

---

## 9.4 Prasyarat Sebelum V2

Sebelum memulai V2, kondisi berikut harus terpenuhi:

- [ ] MVP berjalan stabil minimal 1 semester penuh
- [ ] Minimal 100 mahasiswa aktif menggunakan platform
- [ ] Feedback dari mahasiswa, dosen, dan admin sudah dikumpulkan
- [ ] Data historis minimal 2 semester tersedia
- [ ] Tim engineering siap untuk skalabilitas

---

## Dokumen Terkait

- [08 — Development Roadmap](./08-development-roadmap.md)
- [10 — Definition of Done](./10-definition-of-done.md)

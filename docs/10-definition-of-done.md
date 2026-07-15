# 10 — Definition of Done & Implementation Notes

| Informasi | Detail |
|-----------|--------|
| Versi | 1.0 (MVP) |
| Tanggal Dokumen | 09 Juli 2026 |

---

## 10.1 Definition of Done — MVP

Produk dianggap siap MVP apabila seluruh checklist berikut terpenuhi:

### Authentication & Authorization
- [ ] Seluruh role dapat login sesuai hak akses masing-masing
- [ ] Route protection berjalan: user tidak bisa akses halaman role lain
- [ ] Reset password berfungsi via email
- [ ] Session expired mengarahkan ke halaman login

### Admin
- [ ] Admin dapat membuat akun mahasiswa (satu per satu dan bulk CSV)
- [ ] Admin dapat membuat akun dosen wali
- [ ] Admin dapat mengonfigurasi aturan akademik per program studi
- [ ] Admin dapat mengelola data perusahaan mitra
- [ ] Admin dapat mengonfigurasi WAHA

### Mahasiswa
- [ ] Mahasiswa dapat input nilai per mata kuliah
- [ ] Mahasiswa dapat import KHS dan KRS
- [ ] Sistem menghitung IPK, IPS, dan SKS secara otomatis
- [ ] Sistem menampilkan status akademik visual (Ahead / On Track / dst)
- [ ] Mahasiswa dapat menetapkan target kelulusan
- [ ] Sistem menampilkan prediksi kelulusan berdasarkan progres aktual
- [ ] Mahasiswa dapat mengelola portofolio (CRUD semua kategori)
- [ ] Mahasiswa dapat memilih minat karier
- [ ] Mahasiswa dapat mengaktifkan/menonaktifkan consent profil ke perusahaan

### Dosen Wali
- [ ] Dosen wali dapat melihat semua mahasiswa bimbingan dari satu dashboard
- [ ] Dosen dapat membuat kode bergabung untuk mahasiswa
- [ ] Status risiko mahasiswa ditampilkan dengan indikator visual
- [ ] Dosen dapat melihat histori akademik lengkap per mahasiswa

### Company
- [ ] Perusahaan hanya dapat melihat profil mahasiswa yang consent aktif
- [ ] Filter pencarian (prodi, IPK, skill, target karier) berfungsi

### WhatsApp Notification
- [ ] Notifikasi WhatsApp berhasil dikirim ke mahasiswa (ringkasan semester)
- [ ] Notifikasi WhatsApp berhasil dikirim ke dosen (mahasiswa berisiko)
- [ ] Notifikasi WhatsApp berhasil dikirim ke admin (rekap keseluruhan)
- [ ] Log pengiriman tersimpan di database

### Quality
- [ ] Seluruh fitur utama telah diuji (functional testing)
- [ ] Tidak ada bug kritis yang belum diperbaiki
- [ ] RLS database berfungsi: data terisolasi antar pengguna sesuai role
- [ ] Dokumentasi sistem tersedia (dokumen ini dan schema database)

---

## 10.2 Definition of Done — Per Fitur

Setiap fitur individual dianggap selesai jika:

1. **Implementasi** — kode selesai dan berjalan sesuai spesifikasi
2. **Validasi input** — semua input tervalidasi (Zod) di client dan server
3. **Error handling** — error ditangani dengan pesan yang jelas ke user
4. **RLS** — policy RLS sesuai permission matrix
5. **Responsif** — tampilan berfungsi di mobile dan desktop
6. **Testing** — minimal happy path dan 1 edge case diuji

---

## 10.3 Implementation Notes

### Prioritas Pengembangan

Pengembangan dimulai dari fondasi sistem, bukan dari fitur yang paling terlihat. Urutan ini penting agar setiap fitur berikutnya berdiri di atas fondasi yang stabil.

```
Fondasi (Auth + DB + Admin)
  → Akademik (Nilai + IPK + Target)
    → Monitoring (Dashboard Dosen + Risiko)
      → Portofolio + Career + Company
        → Integrasi + Notifikasi
```

### Aturan Akademik Dinamis

Jangan hardcode angka seperti `144`, `8`, atau `2.00` di kode. Selalu baca dari tabel `academic_rules` berdasarkan `study_program_id` mahasiswa. Ini memastikan sistem dapat dikonfigurasi untuk kampus/prodi berbeda.

```typescript
// Contoh pengambilan aturan akademik
const rules = await getAcademicRules(student.study_program_id)
const sksRequired = rules.total_sks_graduation
const normalSemester = rules.normal_semester
```

### Kalkulasi Akademik di Server

Semua kalkulasi IPK, IPS, status risiko, dan prediksi kelulusan dilakukan di server (API route atau Supabase function), **bukan** di client. Ini mencegah manipulasi data dan memastikan konsistensi.

### Consent Profil Perusahaan

Field `profile_visible` di tabel `users` adalah toggle utama. RLS policy memastikan company tidak bisa query data mahasiswa dengan `profile_visible = FALSE` bahkan jika mereka mengirim request langsung ke Supabase.

### Import KHS/KRS

Untuk MVP, format import yang didukung cukup **CSV** atau **Excel (.xlsx)**. Buat template yang bisa diunduh agar mahasiswa tahu format yang diharapkan. OCR (scan foto) masuk ke roadmap V2.

### WhatsApp via WAHA

Kirim pesan secara **asinkron** (queue/background job), jangan blocking request. Catat semua upaya pengiriman di `whatsapp_logs` termasuk yang gagal agar admin bisa monitor.

### Penanganan Error Import

Jika import KHS/KRS gagal parsial (beberapa baris valid, beberapa tidak), tampilkan preview dengan baris yang berhasil dan baris yang gagal beserta alasannya. Jangan import partial tanpa konfirmasi user.

---

## 10.4 Checklist Akhir Setiap Phase

Setiap phase pengembangan wajib diakhiri dengan:

| Aktivitas | Deskripsi |
|-----------|-----------|
| Functional Testing | Uji semua fitur dalam phase secara manual |
| Bug Fixing | Perbaiki semua bug yang ditemukan |
| Code Review | Review kode oleh minimal 1 orang lain |
| Dokumentasi | Perbarui dokumen jika ada perubahan dari spesifikasi |
| Persiapan Deployment | Tag versi, update environment, siapkan changelog |

---

## 10.5 Risk Register

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Format KHS/KRS berbeda antar dosen | Tinggi | Sediakan template CSV standar |
| WAHA instance tidak stabil | Sedang | Log kegagalan, retry mechanism |
| Mahasiswa tidak update data | Tinggi | Reminder WhatsApp akhir semester |
| RLS misconfiguration | Tinggi | Test RLS di staging sebelum production |
| Data mahasiswa tidak lengkap | Sedang | Validasi wajib field saat input |

---

## Dokumen Terkait

- [01 — Project Overview](./01-project-overview.md)
- [08 — Development Roadmap](./08-development-roadmap.md)
- [PLAN.md](../PLAN.md)

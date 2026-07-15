# 04 — Academic Rules

| Informasi | Detail |
|-----------|--------|
| Versi | 1.0 (MVP) |
| Tanggal Dokumen | 09 Juli 2026 |

---

## 4.1 Prinsip

Seluruh aturan akademik bersifat **dinamis** dan **tidak hardcoded** di aplikasi.

Admin Kampus mengonfigurasi aturan melalui panel Admin. Sistem membaca aturan dari database saat melakukan kalkulasi IPK, progres kelulusan, dan status risiko.

Ini memungkinkan Gradely digunakan oleh kampus yang berbeda dengan aturan akademik yang berbeda pula (multi-kampus SaaS di masa depan).

---

## 4.2 Konfigurasi Aturan Akademik

### Aturan Kelulusan

| Parameter | Tipe | Contoh Nilai ISI Yogyakarta |
|-----------|------|----------------------------|
| `total_sks_graduation` | Integer | 144 |
| `normal_semester` | Integer | 8 |
| `max_semester` | Integer | 14 |
| `min_gpa` | Decimal | 2.00 |
| `max_sks_per_semester` | Integer | 24 |
| `min_sks_per_semester` | Integer | 12 |

### Aturan Nilai

| Parameter | Tipe | Deskripsi |
|-----------|------|-----------|
| `passing_grade` | Enum | Nilai minimal dianggap lulus (default: `D`) |
| `grade_scale` | JSON | Pemetaan nilai huruf ke bobot angka |

### Contoh `grade_scale` (JSON)
```json
{
  "A":  4.0,
  "AB": 3.5,
  "B":  3.0,
  "BC": 2.5,
  "C":  2.0,
  "D":  1.0,
  "E":  0.0
}
```

---

## 4.3 Aturan per Program Studi

Setiap program studi dapat memiliki aturan yang berbeda dari aturan default kampus.

| Parameter | Override per Prodi? |
|-----------|---------------------|
| `total_sks_graduation` | ✅ |
| `normal_semester` | ✅ |
| `max_semester` | ✅ |
| `min_gpa` | ✅ |
| `max_sks_per_semester` | ✅ |
| `passing_grade` | ✅ |

Jika program studi tidak memiliki override, sistem menggunakan aturan default kampus.

---

## 4.4 Logika Status Akademik

### Kriteria per Status

| Status | Kondisi |
|--------|---------|
| 🟢 Ahead | SKS_lulus / semester_aktif > target_sks_per_semester × 1.1 |
| 🔵 On Track | SKS dalam jalur ±10% dari target |
| 🟡 Need Attention | SKS 10–20% di bawah target ATAU IPK turun |
| 🟠 Recovery Mode | SKS 20–30% di bawah target ATAU mengulang 2+ MK |
| 🔴 Critical | SKS >30% di bawah target ATAU IPK < min_gpa ATAU semester > max_semester |

### Kalkulasi Target SKS per Semester

```
target_sks_per_semester = total_sks_graduation / normal_semester
expected_sks_at_semester_n = target_sks_per_semester × n
```

---

## 4.5 Prediksi Kelulusan

Formula prediksi kelulusan berdasarkan rata-rata SKS aktual mahasiswa:

```
avg_sks_per_semester = total_sks_lulus / semester_aktif
sks_remaining = total_sks_graduation - total_sks_lulus
semester_remaining = CEIL(sks_remaining / avg_sks_per_semester)
predicted_graduation = semester_aktif + semester_remaining
```

Jika `avg_sks_per_semester` = 0 (belum ada data), sistem menggunakan `target_sks_per_semester` dari aturan kampus.

---

## 4.6 Penerapan Aturan Akademik di Tabel Database

Aturan akademik disimpan di tabel `academic_rules` dengan referensi ke `study_programs`.

Lihat detail schema di [06 — Database Schema](./06-database-schema.md).

---

## 4.7 Contoh Konfigurasi ISI Yogyakarta (Dummy)

| Aturan | Nilai |
|--------|-------|
| Total SKS Kelulusan | 144 |
| Semester Normal | 8 |
| Semester Maksimal | 14 |
| IPK Minimum | 2.00 |
| SKS Maksimal/Semester | 24 |
| SKS Minimal/Semester | 12 |
| Nilai Lulus Minimum | D |

Program studi dengan override (contoh):

| Program Studi | Total SKS | Semester Normal |
|---------------|-----------|-----------------|
| Musik | 148 | 8 |
| Tari | 148 | 8 |
| Teater | 146 | 8 |
| DKV | 144 | 8 |
| Animasi | 144 | 8 |
| Film | 144 | 8 |
| Fotografi | 144 | 8 |
| Desain Interior | 144 | 8 |
| Kriya | 146 | 8 |

---

## Dokumen Terkait

- [03 — Scope MVP](./03-scope-mvp.md)
- [05 — Dummy Data](./05-dummy-data.md)
- [06 — Database Schema](./06-database-schema.md)

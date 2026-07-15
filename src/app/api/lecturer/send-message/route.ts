import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateAcademicSummary, groupGradesBySemester } from '@/lib/utils/academic'
import { sendAndLog } from '@/lib/waha'
import type { ApiResponse, AcademicRule, StudentGrade } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: lecturer } = await supabase
      .from('users')
      .select('role, full_name, university_id, phone, email')
      .eq('id', user.id)
      .single()

    if (!lecturer || lecturer.role !== 'lecturer') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const body = await request.json()
    const { student_id, preview_only = false } = body as { student_id: string; preview_only?: boolean }

    if (!student_id) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'student_id diperlukan', success: false }, { status: 400 })
    }

    // Verify this student is actually under this lecturer
    const { data: bound } = await supabase
      .from('advisor_students')
      .select('id')
      .eq('lecturer_id', user.id)
      .eq('student_id', student_id)
      .single()

    if (!bound) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Mahasiswa bukan bimbingan Anda', success: false }, { status: 403 })
    }

    // Load student profile
    const { data: student } = await supabase
      .from('users')
      .select('full_name, phone, nim, current_semester, email, study_programs(name)')
      .eq('id', student_id)
      .single()

    if (!student) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Mahasiswa tidak ditemukan', success: false }, { status: 404 })
    }

    // Validasi nomor HP hanya diperlukan saat benar-benar mengirim
    let phoneDigits = ''
    if (!preview_only) {
      if (!student.phone || student.phone.trim() === '') {
        return NextResponse.json<ApiResponse>({
          data: null,
          error: `Nomor HP mahasiswa ${student.full_name} (${student.nim ?? '-'}) belum diisi. Minta mahasiswa mengisi nomor HP di profil terlebih dahulu.`,
          success: false,
        }, { status: 400 })
      }
      phoneDigits = student.phone.replace(/\D/g, '')
      if (phoneDigits.length < 9 || phoneDigits.length > 15) {
        return NextResponse.json<ApiResponse>({
          data: null,
          error: `Nomor HP mahasiswa ${student.full_name} tidak valid (${student.phone}). Minta mahasiswa memperbarui nomor HP di profil.`,
          success: false,
        }, { status: 400 })
      }
    }

    // Load grades
    const { data: gradesRaw } = await supabase
      .from('student_grades')
      .select('*')
      .eq('student_id', student_id)
      .order('semester_number', { ascending: true })

    const grades = (gradesRaw ?? []) as StudentGrade[]

    // Load student target
    const { data: studentTarget } = await supabase
      .from('student_targets')
      .select('target_semester, target_ipk, target_years, career_goal, notes')
      .eq('student_id', student_id)
      .single()

    // Load academic rule
    let rule: AcademicRule | null = null
    if (lecturer.university_id) {
      const { data } = await supabase
        .from('academic_rules')
        .select('*')
        .eq('university_id', lecturer.university_id)
        .is('study_program_id', null)
        .single()
      rule = data
    }

    const effectiveRule: AcademicRule = rule ?? {
      id: '', university_id: lecturer.university_id ?? '', study_program_id: null,
      total_sks_graduation: 144, normal_semester: 8, max_semester: 14,
      min_gpa: 2.0, max_sks_per_semester: 24, min_sks_per_semester: 12,
      passing_grade: 'D',
      grade_scale: { A: 4.0, 'A-': 3.75, BA: 3.5, 'B+': 3.25, B: 3.0, 'B-': 2.75, C: 2.0, D: 1.0, E: 0.0 },
      sks_rules_by_ipk: { enabled: true, semester_1_2_max: 20, tiers: [{ ipk_min: 3.00, ipk_max: 4.00, sks_min: 22, sks_max: 24 }, { ipk_min: 2.50, ipk_max: 2.99, sks_min: 20, sks_max: 22 }, { ipk_min: 2.00, ipk_max: 2.49, sks_min: 16, sks_max: 20 }, { ipk_min: 1.50, ipk_max: 1.99, sks_min: 12, sks_max: 16 }, { ipk_min: 0.00, ipk_max: 1.49, sks_min: 2, sks_max: 12 }] },
      created_at: '', updated_at: '',
    }

    // Load admin contact info (nomor Gradely/kampus untuk dihubungi)
    const { data: adminUser } = await supabase
      .from('users')
      .select('full_name, phone, email')
      .eq('university_id', lecturer.university_id ?? '')
      .eq('role', 'admin')
      .eq('is_active', true)
      .limit(1)
      .single()

    const currentSemester = student.current_semester ?? 1
    const summary = calculateAcademicSummary(grades, currentSemester, effectiveRule.normal_semester, effectiveRule)
    const semesterSummaries = groupGradesBySemester(grades)

    const studyProgramName = (student.study_programs && typeof student.study_programs === 'object' && !Array.isArray(student.study_programs))
      ? (student.study_programs as { name: string }).name
      : 'Program Studi'

    // Build per-semester rows for AI
    const semesterRows = semesterSummaries.map((s) => {
      const gradesUpTo = semesterSummaries.filter(x => x.semester_number <= s.semester_number).flatMap(x => x.grades)
      const ipkKumulatif = gradesUpTo.length > 0
        ? Math.round((gradesUpTo.reduce((a, g) => a + g.grade_points * g.credits, 0) / gradesUpTo.reduce((a, g) => a + g.credits, 0)) * 100) / 100
        : 0
      const retakes = s.grades.filter(g => g.is_retake).length
      return `  Semester ${s.semester_number}: IPS ${s.gpa.toFixed(2)}, IPK kumulatif ${ipkKumulatif.toFixed(2)}, ${s.total_sks} SKS${retakes > 0 ? `, ${retakes} MK mengulang` : ''}`
    })

    const ipsValues = semesterSummaries.map(s => s.gpa)
    const ipsTrend = ipsValues.length >= 2
      ? ipsValues[ipsValues.length - 1] > ipsValues[ipsValues.length - 2] ? 'meningkat'
      : ipsValues[ipsValues.length - 1] < ipsValues[ipsValues.length - 2] ? 'menurun' : 'stabil'
      : 'belum dapat ditentukan'

    const semestersLeft = (studentTarget?.target_semester ?? effectiveRule.normal_semester) - currentSemester
    const sksLeft = effectiveRule.total_sks_graduation - summary.total_sks_earned
    const avgSksPerSemNeeded = semestersLeft > 0 ? Math.ceil(sksLeft / semestersLeft) : 0

    const statusLabels: Record<string, string> = {
      ahead: 'Unggul', on_track: 'Sesuai Target',
      need_attention: 'Perlu Perhatian', recovery_mode: 'Butuh Pemulihan', critical: 'Darurat Akademik',
    }

    // Load AI settings dari database (sama seperti route lain)
    const { data: aiSettingRows } = await supabase
      .from('settings')
      .select('key, value')
      .eq('university_id', lecturer.university_id ?? '')
      .in('key', ['ai_api_key', 'ai_base_url', 'ai_model'])

    const aiSettingsMap = Object.fromEntries((aiSettingRows ?? []).map(r => [r.key, r.value]))
    const apiKey = aiSettingsMap['ai_api_key'] ?? process.env.AI_API_KEY ?? ''
    const baseUrl = (aiSettingsMap['ai_base_url'] ?? process.env.AI_BASE_URL ?? '').replace(/\/$/, '')
    const model = aiSettingsMap['ai_model'] ?? process.env.AI_MODEL ?? 'kr/auto'

    if (!apiKey || !baseUrl) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Layanan AI belum dikonfigurasi. Hubungi admin kampus.', success: false }, { status: 503 })
    }

    const adminContact = adminUser?.phone
      ? `📞 Kontak Gradely: ${adminUser.phone}${adminUser.email ? ` | ${adminUser.email}` : ''}`
      : adminUser?.email
        ? `📧 Kontak Gradely: ${adminUser.email}`
        : '📩 Hubungi kantor akademik kampus untuk info lebih lanjut'

    const prompt = (() => {
      const nowWIB = new Date(Date.now() + 7 * 60 * 60 * 1000)
      const hour = nowWIB.getUTCHours()
      const greeting = hour >= 4 && hour < 11 ? 'Selamat Pagi'
        : hour >= 11 && hour < 15 ? 'Selamat Siang'
        : hour >= 15 && hour < 18 ? 'Selamat Sore'
        : 'Selamat Malam'
      const dateStr = nowWIB.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
      const timeStr = `${String(nowWIB.getUTCHours()).padStart(2,'0')}.${String(nowWIB.getUTCMinutes()).padStart(2,'0')} WIB`

      return `Kamu adalah sistem notifikasi akademik Gradely. Buatkan pesan WhatsApp resmi dari sistem Gradely kepada mahasiswa berisi laporan lengkap perkembangan akademik beserta saran konkret. Pesan harus informatif, terstruktur, hangat, dan profesional dalam Bahasa Indonesia.

WAKTU PENGIRIMAN: ${greeting}, ${dateStr} pukul ${timeStr}
Gunakan salam "${greeting}" di awal pesan (WAJIB sesuai waktu di atas).

============================
DATA MAHASISWA
============================
Nama         : ${student.full_name}
NIM          : ${student.nim ?? '-'}
Program Studi: ${studyProgramName}
Semester     : ${currentSemester} dari maks ${effectiveRule.max_semester}
Email        : ${student.email ?? '-'}

============================
DOSEN WALI
============================
Nama: ${lecturer.full_name}
${lecturer.email ? `Email: ${lecturer.email}` : ''}
${lecturer.phone ? `No HP: ${lecturer.phone}` : ''}

============================
RIWAYAT NILAI PER SEMESTER
============================
${semesterRows.length > 0 ? semesterRows.join('\n') : '  (belum ada data nilai)'}

============================
RINGKASAN AKADEMIK SAAT INI
============================
IPK saat ini         : ${summary.gpa.toFixed(2)} (min lulus: ${effectiveRule.min_gpa.toFixed(2)})
IPS semester terakhir: ${summary.last_gpa.toFixed(2)}
Tren IPS             : ${ipsTrend}
SKS lulus            : ${summary.total_sks_earned} / ${effectiveRule.total_sks_graduation} SKS (${summary.sks_percentage}%)
MK mengulang         : ${summary.courses_retake} mata kuliah
Status akademik      : ${statusLabels[summary.academic_status] ?? summary.academic_status}
Prediksi lulus       : Semester ${summary.predicted_graduation_semester}

============================
TARGET MAHASISWA
============================
Target semester lulus: ${studentTarget?.target_semester ?? effectiveRule.normal_semester}
Target IPK           : ${studentTarget?.target_ipk ? studentTarget.target_ipk.toFixed(2) : 'belum ditentukan'}
Target durasi        : ${studentTarget?.target_years ? `${studentTarget.target_years} tahun` : 'belum ditentukan'}
Minat karier         : ${studentTarget?.career_goal ?? 'belum diisi'}
Catatan target       : ${studentTarget?.notes ?? '-'}

============================
ANALISIS KEBUTUHAN
============================
Sisa semester        : ${semestersLeft} semester
Sisa SKS             : ${sksLeft} SKS
SKS/semester yg harus diambil: ${avgSksPerSemNeeded} SKS
IPK min per semester : ${effectiveRule.min_gpa.toFixed(2)}
Maks SKS/semester    : ${effectiveRule.max_sks_per_semester} SKS

Buatkan pesan WhatsApp dengan struktur TEPAT sebagai berikut:

1. HEADER: Salam pembuka resmi dari sistem Gradely + nama mahasiswa
2. IDENTITAS: Tampilkan NIM, Prodi, Semester aktif
3. LAPORAN NILAI: Ringkas riwayat IPS per semester dengan highlight tren naik/turun (gunakan ✅ naik, ⚠️ turun, ➡️ stabil)
4. STATUS AKADEMIK: IPK saat ini, progress SKS, prediksi lulus, status (${statusLabels[summary.academic_status] ?? summary.academic_status})
5. TARGET VS REALITA: Bandingkan kondisi sekarang dengan target mahasiswa, apakah on track atau perlu effort lebih
6. REKOMENDASI: 4-5 saran konkret dan actionable berdasarkan kondisi nyata (bukan generik)
7. PENUTUP: Motivasi + info kontak dosen wali untuk konsultasi
8. FOOTER: "${adminContact}"

Aturan format:
- Gunakan emoji yang relevan tapi tidak berlebihan
- Paragraf pendek, mudah dibaca di layar HP
- Jangan gunakan format markdown bold (*text*) atau italic (_text_)
- Pisahkan tiap bagian dengan baris kosong
- Maksimal 500 kata
- Balas HANYA dengan teks pesan WA, tidak perlu penjelasan tambahan`
    })()

    const aiRes = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.65,
        max_tokens: 1024,
        stream: false,
      }),
      signal: AbortSignal.timeout(60000),
    })

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => aiRes.status.toString())
      return NextResponse.json<ApiResponse>({ data: null, error: `AI error (${aiRes.status}): ${errText.slice(0, 200)}`, success: false }, { status: 502 })
    }

    let messageText = ''
    try {
      const json = await aiRes.json()
      messageText = json.choices?.[0]?.message?.content ?? ''
    } catch {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Gagal parse respons AI', success: false }, { status: 502 })
    }

    if (!messageText) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Gagal generate pesan dari AI', success: false }, { status: 502 })
    }

    if (preview_only) {
      return NextResponse.json<ApiResponse>({ data: { message: messageText }, error: null, success: true })
    }

    const result = await sendAndLog(lecturer.university_id ?? '', {
      phone: student.phone!,
      message: messageText,
      recipientId: student_id,
    })

    if (!result.success) {
      return NextResponse.json<ApiResponse>({ data: null, error: result.error ?? 'Gagal mengirim pesan', success: false }, { status: 502 })
    }

    return NextResponse.json<ApiResponse>({ data: { message: messageText }, error: null, success: true })
  } catch (err) {
    console.error('send-message error:', err)
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

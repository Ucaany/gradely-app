import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateAcademicSummary, groupGradesBySemester } from '@/lib/utils/academic'
import type { ApiResponse, AcademicRule, StudentGrade } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: lecturer } = await supabase
      .from('users')
      .select('role, full_name, university_id')
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
      .select('full_name, phone, nim, current_semester, study_programs(name)')
      .eq('id', student_id)
      .single()

    if (!student) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Mahasiswa tidak ditemukan', success: false }, { status: 404 })
    }

    if (!student.phone) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Mahasiswa tidak memiliki nomor HP yang terdaftar', success: false }, { status: 400 })
    }

    // Load grades
    const { data: gradesRaw } = await supabase
      .from('student_grades')
      .select('*')
      .eq('student_id', student_id)
      .order('semester_number', { ascending: true })

    const grades = (gradesRaw ?? []) as StudentGrade[]

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
      grade_scale: { A: 4.0, AB: 3.5, B: 3.0, BC: 2.5, C: 2.0, D: 1.0, E: 0.0 },
      created_at: '', updated_at: '',
    }

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
      return `Semester ${s.semester_number}: IPS ${s.gpa.toFixed(2)}, IPK kumulatif ${ipkKumulatif.toFixed(2)}, ${s.total_sks} SKS${retakes > 0 ? `, ${retakes} MK mengulang` : ''}`
    })

    const ipsValues = semesterSummaries.map(s => s.gpa)
    const ipsTrend = ipsValues.length >= 2
      ? ipsValues[ipsValues.length - 1] > ipsValues[ipsValues.length - 2] ? 'meningkat'
      : ipsValues[ipsValues.length - 1] < ipsValues[ipsValues.length - 2] ? 'menurun' : 'stabil'
      : 'belum dapat ditentukan'

    // Load WAHA settings
    const { data: wahaSettings } = await supabase
      .from('settings')
      .select('key, value')
      .eq('university_id', lecturer.university_id ?? '')
      .in('key', ['waha_url', 'waha_session', 'waha_api_key'])

    const settingsMap: Record<string, string> = {}
    for (const s of (wahaSettings ?? [])) settingsMap[s.key] = s.value

    const wahaUrl = settingsMap['waha_url']
    const wahaSession = settingsMap['waha_session']
    const wahaApiKey = settingsMap['waha_api_key']

    if (!wahaUrl || !wahaSession) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Konfigurasi WAHA belum diatur. Hubungi admin kampus.', success: false }, { status: 503 })
    }

    // Generate message with AI
    const apiKey = process.env.AI_API_KEY ?? ''
    if (!apiKey) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Layanan AI belum tersedia', success: false }, { status: 503 })
    }

    const statusLabels: Record<string, string> = {
      ahead: 'Unggul', on_track: 'Sesuai Target',
      need_attention: 'Perlu Perhatian', recovery_mode: 'Butuh Pemulihan', critical: 'Darurat Akademik',
    }

    const prompt = `Kamu adalah Asisten Gradely, konselor akademik digital kampus. Buatkan pesan WhatsApp dari dosen wali kepada mahasiswa berisi ringkasan perkembangan akademik dan saran-saran konkret. Pesan harus personal, hangat, profesional, dan dalam Bahasa Indonesia.

PROFIL MAHASISWA:
- Nama: ${student.full_name}
- NIM: ${student.nim ?? '-'}
- Program Studi: ${studyProgramName}
- Semester aktif: ${currentSemester}

RIWAYAT AKADEMIK (Semester 1 s/d ${currentSemester}):
${semesterRows.length > 0 ? semesterRows.join('\n') : '(belum ada data nilai)'}

RINGKASAN AKADEMIK:
- IPK saat ini: ${summary.gpa.toFixed(2)}
- IPS semester terakhir: ${summary.last_gpa.toFixed(2)}
- Tren IPS: ${ipsTrend}
- SKS lulus: ${summary.total_sks_earned} / ${effectiveRule.total_sks_graduation} (${summary.sks_percentage}%)
- MK mengulang: ${summary.courses_retake}
- Status akademik: ${statusLabels[summary.academic_status] ?? summary.academic_status}
- Prediksi lulus: Semester ${summary.predicted_graduation_semester}

DOSEN WALI: ${lecturer.full_name}

Buatkan pesan WhatsApp yang:
1. Dibuka dengan salam dan perkenalan singkat dari dosen wali
2. Ringkasan perkembangan IPK dari semester 1 hingga sekarang (highlight tren naik/turun)
3. Apresiasi jika ada progres baik, atau perhatian khusus jika ada penurunan
4. 3-4 saran konkret dan actionable berdasarkan kondisi akademik
5. Penutup yang memotivasi dan tawaran konsultasi

Format pesan: gunakan emoji secukupnya, paragraf pendek, mudah dibaca di WhatsApp. Maksimal 400 kata. Jangan gunakan format markdown bold/italic. Balas HANYA dengan teks pesan WA, tidak perlu penjelasan lain.`

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
      }),
    })

    let messageText = ''
    if (geminiRes.ok) {
      const geminiData = await geminiRes.json()
      messageText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    } else {
      // Fallback to gemini-1.5-flash
      const fallbackRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-goog-api-key': apiKey },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
          }),
        }
      )
      if (!fallbackRes.ok) {
        return NextResponse.json<ApiResponse>({ data: null, error: 'Gagal generate pesan dari AI', success: false }, { status: 502 })
      }
      const fallbackData = await fallbackRes.json()
      messageText = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    }

    if (!messageText) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'AI tidak menghasilkan pesan', success: false }, { status: 422 })
    }

    // If preview_only, return message without sending
    if (preview_only) {
      return NextResponse.json<ApiResponse>({ data: { message: messageText }, error: null, success: true })
    }

    // Send via WAHA
    const phone = student.phone.replace(/\D/g, '')
    const chatId = phone.startsWith('0') ? `62${phone.slice(1)}@c.us` : `${phone}@c.us`

    const wahaHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
    if (wahaApiKey) wahaHeaders['X-Api-Key'] = wahaApiKey

    const wahaRes = await fetch(`${wahaUrl}/api/sendText`, {
      method: 'POST',
      headers: wahaHeaders,
      body: JSON.stringify({ session: wahaSession, chatId, text: messageText }),
      signal: AbortSignal.timeout(10000),
    })

    if (!wahaRes.ok) {
      const errText = await wahaRes.text()
      // Log failed attempt
      await supabase.from('whatsapp_logs').insert({
        recipient_id: student_id,
        phone_number: student.phone,
        message: messageText,
        status: 'failed',
        error_message: `WAHA error: ${wahaRes.status} ${errText}`,
      })
      return NextResponse.json<ApiResponse>({ data: null, error: `Gagal mengirim via WAHA: ${wahaRes.status}`, success: false }, { status: 502 })
    }

    // Log success
    await supabase.from('whatsapp_logs').insert({
      recipient_id: student_id,
      phone_number: student.phone,
      message: messageText,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })

    return NextResponse.json<ApiResponse>({ data: { message: messageText }, error: null, success: true })
  } catch (err) {
    console.error('send-message error:', err)
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, AcademicRule, StudentGrade } from '@/types'
import { calculateAcademicSummary, groupGradesBySemester, autoDetectSemester, DEFAULT_SKS_RULES_BY_IPK } from '@/lib/utils/academic'

const RATE_LIMIT_MAX = 5

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role, study_program_id, university_id, current_semester, full_name')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'student') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentCount } = await supabase
      .from('student_target_analyses')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', user.id)
      .gte('created_at', oneHourAgo)

    const usedCount = recentCount ?? 0
    if (usedCount >= RATE_LIMIT_MAX) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: `Batas analisis tercapai (${RATE_LIMIT_MAX}x/jam). Coba lagi dalam beberapa menit.`, success: false },
        { status: 429 }
      )
    }
    const remaining = RATE_LIMIT_MAX - usedCount - 1

    const body = await request.json()
    const { target_semester, target_ipk, target_years, career_goal, target_skills, target_industries } = body as {
      target_semester: number
      target_ipk: number | null
      target_years: number | null
      career_goal?: string | null
      target_skills?: string[] | null
      target_industries?: string[] | null
    }

    if (!target_semester || target_semester < 2 || target_semester > 14) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Target semester tidak valid. Harus antara 2 dan 14.', success: false }, { status: 400 })
    }

    const apiKey = process.env.AI_API_KEY ?? ''
    const baseUrl = process.env.AI_BASE_URL ?? 'https://9prxy.sribuai.my.id/v1'
    const model = process.env.AI_MODEL ?? 'kr/auto'

    if (!apiKey) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: 'Layanan AI belum tersedia. Coba lagi nanti.', success: false },
        { status: 503 }
      )
    }

    const { data: grades } = await supabase
      .from('student_grades')
      .select('*')
      .eq('student_id', user.id)
      .order('semester_number', { ascending: true })

    let rule: AcademicRule | null = null
    if (profile.university_id) {
      if (profile.study_program_id) {
        const { data: specificRule } = await supabase
          .from('academic_rules')
          .select('*')
          .eq('university_id', profile.university_id)
          .eq('study_program_id', profile.study_program_id)
          .single()
        rule = specificRule
      }
      if (!rule) {
        const { data: defaultRule } = await supabase
          .from('academic_rules')
          .select('*')
          .eq('university_id', profile.university_id)
          .is('study_program_id', null)
          .single()
        rule = defaultRule
      }
    }

    const effectiveRule: AcademicRule = rule ?? {
      id: '',
      university_id: profile.university_id ?? '',
      study_program_id: null,
      total_sks_graduation: 144,
      normal_semester: 8,
      max_semester: 14,
      min_gpa: 2.0,
      max_sks_per_semester: 24,
      min_sks_per_semester: 12,
      passing_grade: 'D',
      grade_scale: { A: 4.0, 'A-': 3.75, BA: 3.5, 'B+': 3.25, B: 3.0, 'B-': 2.75, C: 2.0, D: 1.0, E: 0.0 },
      sks_rules_by_ipk: DEFAULT_SKS_RULES_BY_IPK,
      created_at: '',
      updated_at: '',
    }

    const typedGrades = (grades ?? []) as StudentGrade[]

    // Auto-detect semester dari data nilai (semester tertinggi yang ada)
    const currentSemester = autoDetectSemester(typedGrades, profile.current_semester ?? 1)

    if (target_semester <= currentSemester) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Target semester harus lebih besar dari semester aktif saat ini.', success: false }, { status: 400 })
    }

    const summary = calculateAcademicSummary(typedGrades, currentSemester, target_semester, effectiveRule)
    const semesterSummaries = groupGradesBySemester(typedGrades)

    const sksPerSemester = target_semester > currentSemester
      ? Math.ceil((effectiveRule.total_sks_graduation - summary.total_sks_earned) / (target_semester - currentSemester))
      : null

    const semestersRemaining = Math.max(0, target_semester - currentSemester)
    const sksRemaining = effectiveRule.total_sks_graduation - summary.total_sks_earned
    const ipkGap = target_ipk ? Number(target_ipk) - summary.gpa : null

    const semesterRows = semesterSummaries.map((s) => {
      const ipkKumulatif = (() => {
        const allUpTo = semesterSummaries
          .filter((x) => x.semester_number <= s.semester_number)
          .flatMap((x) => x.grades)
        if (allUpTo.length === 0) return 0
        const w = allUpTo.reduce((a, g) => a + g.grade_points * g.credits, 0)
        const c = allUpTo.reduce((a, g) => a + g.credits, 0)
        return c > 0 ? Math.round((w / c) * 100) / 100 : 0
      })()
      const retakes = s.grades.filter((g) => g.is_retake).length
      const failedMK = s.grades.filter((g) => {
        const passingPts = effectiveRule.grade_scale[effectiveRule.passing_grade as keyof typeof effectiveRule.grade_scale] ?? 0
        return g.grade_points < passingPts
      })
      return `  Semester ${s.semester_number}: IPS ${s.gpa.toFixed(2)}, IPK kumulatif ${ipkKumulatif.toFixed(2)}, ${s.total_sks} SKS, ${s.grades.length} MK${retakes > 0 ? `, ${retakes} mengulang` : ''}${failedMK.length > 0 ? `, ${failedMK.length} tidak lulus (${failedMK.map(g => g.course_name).join(', ')})` : ''}`
    })

    const ipsValues = semesterSummaries.map((s) => s.gpa)
    const ipsTrend = ipsValues.length >= 2
      ? ipsValues[ipsValues.length - 1] > ipsValues[ipsValues.length - 2]
        ? 'meningkat'
        : ipsValues[ipsValues.length - 1] < ipsValues[ipsValues.length - 2]
          ? 'menurun'
          : 'stabil'
      : 'belum dapat ditentukan'

    const remainingSemestersList = semestersRemaining > 0
      ? Array.from({ length: semestersRemaining }, (_, i) => `Semester ${currentSemester + i + 1}`).join(', ')
      : 'tidak ada'

    // Skill & industri yang diminati mahasiswa
    const skillsLine = target_skills && target_skills.length > 0
      ? `- Skill yang ingin dikuasai: ${target_skills.join(', ')}`
      : '- Skill yang ingin dikuasai: tidak disebutkan'
    const industriesLine = target_industries && target_industries.length > 0
      ? `- Industri yang diminati: ${target_industries.join(', ')}`
      : '- Industri yang diminati: tidak disebutkan'

    // Batas SKS semester berikutnya berdasarkan IPK
    const allowedSKSLine = currentSemester <= 2
      ? `- Batas SKS semester berikutnya: maks ${effectiveRule.sks_rules_by_ipk?.semester_1_2_max ?? 20} SKS (sistem paket Sem 1-2)`
      : `- Batas SKS semester berikutnya: ${summary.allowed_sks_min}–${summary.allowed_sks_max} SKS (berdasarkan IPK ${summary.gpa.toFixed(2)})`

    const prompt = `Kamu adalah Asisten Gradely, konselor akademik pribadi untuk mahasiswa Indonesia. Lakukan analisis MENYELURUH dari Semester 1 hingga prediksi kelulusan. Berikan insight per-semester, identifikasi pola, dan rekomendasi spesifik & actionable. Jangan sebutkan nama model AI.

PROFIL MAHASISWA:
- Nama: ${profile.full_name ?? 'Mahasiswa'}
- Semester aktif: ${currentSemester}
- Target karier: ${career_goal ?? 'tidak disebutkan'}
${skillsLine}
${industriesLine}

RIWAYAT AKADEMIK DETAIL (Semester 1 s/d ${currentSemester}):
${semesterRows.length > 0 ? semesterRows.join('\n') : '  (belum ada data nilai — mahasiswa baru)'}

RINGKASAN AKADEMIK KUMULATIF:
- IPK kumulatif saat ini: ${summary.gpa.toFixed(2)}
- IPS semester terakhir: ${summary.last_gpa.toFixed(2)}
- Tren IPS: ${ipsTrend}
- SKS lulus: ${summary.total_sks_earned} / ${effectiveRule.total_sks_graduation} (${summary.sks_percentage}%)
- SKS tersisa: ${sksRemaining}
- MK lulus: ${summary.courses_passed}
- MK mengulang: ${summary.courses_retake}
- Status akademik: ${summary.academic_status}
- Prediksi lulus (tren saat ini): Semester ${summary.predicted_graduation_semester}
${allowedSKSLine}

TARGET YANG INGIN DICAPAI:
- Target lulus: Semester ${target_semester}${target_years ? ` (dalam ${target_years} tahun)` : ''}
- Target IPK akhir: ${target_ipk ? Number(target_ipk).toFixed(2) : 'tidak ditentukan'}
- Sisa semester menuju target: ${semestersRemaining}
- Semester yang tersisa: ${remainingSemestersList}
- SKS harus diambil per semester: ${sksPerSemester ?? 'sudah cukup / melebihi target'}
${ipkGap !== null ? `- Gap IPK (saat ini vs target): ${ipkGap > 0 ? '+' : ''}${ipkGap.toFixed(2)} (${ipkGap > 0 ? 'perlu ditingkatkan' : 'sudah melampaui target'})` : ''}

ATURAN AKADEMIK PROGRAM STUDI:
- Total SKS kelulusan: ${effectiveRule.total_sks_graduation}
- Semester normal: ${effectiveRule.normal_semester}, maksimal: ${effectiveRule.max_semester}
- IPK minimum lulus: ${effectiveRule.min_gpa}
- SKS per semester: min ${effectiveRule.min_sks_per_semester}, maks ${effectiveRule.max_sks_per_semester}

Analisis secara mendalam kondisi dari semester 1 hingga prediksi lulus. Balas HANYA dengan JSON berikut (tanpa teks lain di luar JSON):
{
  "status": "aman" | "perlu_usaha" | "berisiko",
  "status_label": "2-4 kata deskriptif",
  "ringkasan": "3-4 kalimat analisis menyeluruh: kondisi saat ini, tren dari semester 1, peluang nyata mencapai target, dan gambaran umum perjalanan akademik",
  "sks_per_semester_dibutuhkan": number | null,
  "ipk_minimal_per_semester": number | null,
  "ips_target_semester_depan": number | null,
  "analisis_per_semester": [
    {
      "semester": number,
      "status": "baik" | "cukup" | "perlu_perbaikan",
      "catatan": "1 kalimat insight untuk semester ini"
    }
  ],
  "rekomendasi": [
    "rekomendasi spesifik 1 berdasarkan pola nilai dari semester 1",
    "rekomendasi spesifik 2 berdasarkan tren IPS",
    "rekomendasi spesifik 3 untuk MK yang perlu diperhatikan",
    "rekomendasi spesifik 4 strategi SKS semester-semester berikutnya",
    "rekomendasi spesifik 5 untuk mencapai target IPK",
    "rekomendasi spesifik 6 terkait skill dan industri yang diminati"
  ],
  "roadmap_semester": [
    {
      "semester": number,
      "fokus": "1 kalimat fokus utama semester ini",
      "target_ips": number,
      "target_sks": number
    }
  ],
  "analisis_tren": "2-3 kalimat analisis tren IPK dan IPS dari semester 1 hingga sekarang, termasuk pola naik/turun",
  "strategi_kelulusan": "2-3 kalimat strategi konkret dan realistis untuk mencapai target semester lulus dan IPK",
  "peringatan": "string jika ada risiko serius (DO, gagal tepat waktu, IPK di bawah minimum), null jika tidak ada",
  "motivasi": "1 kalimat motivasi personal yang relevan dengan kondisi spesifik mahasiswa ini"
}`

    const callAI = () => fetch(
      `${baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
          max_tokens: 1500,
          stream: true,
        }),
      }
    )

    let aiRes: Response | null = null
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await callAI()
      if (res.ok) { aiRes = res; break }
      if (res.status === 429) { await new Promise(r => setTimeout(r, 1000)); continue }
      break
    }

    if (!aiRes || !aiRes.ok) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: 'Layanan AI sedang sibuk. Tunggu beberapa saat lalu coba lagi.', success: false },
        { status: 429 }
      )
    }

    const rawText = await aiRes.text()
    const lines = rawText.split('\n').filter(l => l.startsWith('data: ') && !l.includes('[DONE]'))
    let content = ''
    for (const line of lines) {
      try {
        const json = JSON.parse(line.replace('data: ', ''))
        const delta = json.choices?.[0]?.delta?.content
        if (delta) content += delta
      } catch { /* skip malformed lines */ }
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: 'AI tidak dapat menghasilkan analisis. Coba lagi.', success: false },
        { status: 422 }
      )
    }

    const analysis = JSON.parse(jsonMatch[0])

    await supabase.from('student_target_analyses').insert({
      student_id: user.id,
      target_semester,
      target_ipk: target_ipk ?? null,
      target_years: target_years ?? null,
      analysis,
    })

    return NextResponse.json({
      data: { ...analysis, remaining_quota: remaining },
      error: null,
      success: true,
    })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

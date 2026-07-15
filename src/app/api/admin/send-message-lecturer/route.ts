import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateAcademicSummary, groupGradesBySemester } from '@/lib/utils/academic'
import type { ApiResponse, AcademicRule, StudentGrade } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: adminUser } = await supabase
      .from('users')
      .select('role, full_name, university_id, phone, email')
      .eq('id', user.id)
      .single()

    if (!adminUser || adminUser.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const body = await request.json()
    const { lecturer_id, preview_only = false } = body as { lecturer_id: string; preview_only?: boolean }

    if (!lecturer_id) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'lecturer_id diperlukan', success: false }, { status: 400 })
    }

    // Load lecturer profile
    const { data: lecturer } = await supabase
      .from('users')
      .select('full_name, phone, email, nim, university_id, study_program_id')
      .eq('id', lecturer_id)
      .eq('role', 'lecturer')
      .single()

    if (!lecturer) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Dosen tidak ditemukan', success: false }, { status: 404 })
    }

    // Validasi nomor HP dosen
    if (!lecturer.phone || lecturer.phone.trim() === '') {
      return NextResponse.json<ApiResponse>({
        data: null,
        error: `Nomor HP dosen ${lecturer.full_name} belum diisi. Minta dosen mengisi nomor HP di profil terlebih dahulu.`,
        success: false,
      }, { status: 400 })
    }

    const phoneDigits = lecturer.phone.replace(/\D/g, '')
    if (phoneDigits.length < 9 || phoneDigits.length > 15) {
      return NextResponse.json<ApiResponse>({
        data: null,
        error: `Nomor HP dosen ${lecturer.full_name} tidak valid (${lecturer.phone}). Minta dosen memperbarui nomor HP di profil.`,
        success: false,
      }, { status: 400 })
    }

    // Load semua mahasiswa bimbingan dosen ini
    const { data: advisorRows } = await supabase
      .from('advisor_students')
      .select('student_id')
      .eq('lecturer_id', lecturer_id)

    const studentIds = (advisorRows ?? []).map(r => r.student_id)
    const totalAdvisees = studentIds.length

    // Load profil & nilai semua mahasiswa bimbingan
    let students: Array<{
      id: string
      full_name: string
      nim: string | null
      current_semester: number | null
      phone: string | null
      study_programs: { name: string } | null
    }> = []

    let allGrades: StudentGrade[] = []

    if (studentIds.length > 0) {
      const { data: studentsData } = await supabase
        .from('users')
        .select('id, full_name, nim, current_semester, phone, study_programs(name)')
        .in('id', studentIds)
        .eq('is_active', true)

      students = (studentsData ?? []) as unknown as typeof students

      const { data: gradesData } = await supabase
        .from('student_grades')
        .select('*')
        .in('student_id', studentIds)

      allGrades = (gradesData ?? []) as StudentGrade[]
    }

    // Load academic rule
    const { data: rule } = await supabase
      .from('academic_rules')
      .select('*')
      .eq('university_id', adminUser.university_id ?? '')
      .is('study_program_id', null)
      .single()

    const effectiveRule: AcademicRule = rule ?? {
      id: '', university_id: adminUser.university_id ?? '', study_program_id: null,
      total_sks_graduation: 144, normal_semester: 8, max_semester: 14,
      min_gpa: 2.0, max_sks_per_semester: 24, min_sks_per_semester: 12,
      passing_grade: 'D',
      grade_scale: { A: 4.0, 'A-': 3.75, BA: 3.5, 'B+': 3.25, B: 3.0, 'B-': 2.75, C: 2.0, D: 1.0, E: 0.0 },
      created_at: '', updated_at: '',
    }

    // Hitung status akademik per mahasiswa
    const statusLabels: Record<string, string> = {
      ahead: 'Unggul', on_track: 'Sesuai Target',
      need_attention: 'Perlu Perhatian', recovery_mode: 'Butuh Pemulihan', critical: 'Darurat Akademik',
    }

    const studentSummaries = students.map(s => {
      const grades = allGrades.filter(g => g.student_id === s.id)
      const semGroups = groupGradesBySemester(grades)
      const currentSem = s.current_semester ?? 1
      const summary = calculateAcademicSummary(grades, currentSem, effectiveRule.normal_semester, effectiveRule)
      const lastIps = semGroups.length > 0 ? semGroups[semGroups.length - 1].gpa : 0
      return {
        name: s.full_name,
        nim: s.nim ?? '-',
        prodi: s.study_programs?.name ?? '-',
        semester: currentSem,
        ipk: summary.gpa,
        ips_terakhir: lastIps,
        sks_lulus: summary.total_sks_earned,
        sks_total: effectiveRule.total_sks_graduation,
        status: statusLabels[summary.academic_status] ?? summary.academic_status,
        prediksi_lulus: summary.predicted_graduation_semester,
        mk_mengulang: summary.courses_retake,
        phone_valid: !!(s.phone && s.phone.trim().length >= 9),
      }
    })

    const critical = studentSummaries.filter(s => s.status === 'Darurat Akademik' || s.status === 'Butuh Pemulihan')
    const needAttention = studentSummaries.filter(s => s.status === 'Perlu Perhatian')
    const onTrack = studentSummaries.filter(s => s.status === 'Sesuai Target' || s.status === 'Unggul')
    const noPhone = studentSummaries.filter(s => !s.phone_valid)

    const avgIpk = studentSummaries.length > 0
      ? (studentSummaries.reduce((a, s) => a + s.ipk, 0) / studentSummaries.length).toFixed(2)
      : '-'

    const adminContact = adminUser.phone
      ? `${adminUser.phone}${adminUser.email ? ` / ${adminUser.email}` : ''}`
      : adminUser.email ?? '-'

    // Load WAHA settings
    const { data: wahaSettings } = await supabase
      .from('settings')
      .select('key, value')
      .eq('university_id', adminUser.university_id ?? '')
      .in('key', ['waha_url', 'waha_session', 'waha_api_key'])

    const settingsMap: Record<string, string> = {}
    for (const s of (wahaSettings ?? [])) settingsMap[s.key] = s.value

    const wahaUrl = settingsMap['waha_url']
    const wahaSession = settingsMap['waha_session']
    const wahaApiKey = settingsMap['waha_api_key']

    if (!wahaUrl || !wahaSession) {
      if (!preview_only) {
        return NextResponse.json<ApiResponse>({ data: null, error: 'Konfigurasi WAHA belum diatur. Hubungi admin kampus.', success: false }, { status: 503 })
      }
    }

    const apiKey = process.env.AI_API_KEY ?? ''
    const baseUrl = (process.env.AI_BASE_URL ?? 'https://9prxy.sribuai.my.id/v1').replace(/\/$/, '')
    const model = process.env.AI_MODEL ?? 'kr/auto'
    if (!apiKey) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Layanan AI belum tersedia', success: false }, { status: 503 })
    }

    const prompt = (() => {
      const nowWIB = new Date(Date.now() + 7 * 60 * 60 * 1000)
      const hour = nowWIB.getUTCHours()
      const greeting = hour >= 4 && hour < 11 ? 'Selamat Pagi'
        : hour >= 11 && hour < 15 ? 'Selamat Siang'
        : hour >= 15 && hour < 18 ? 'Selamat Sore'
        : 'Selamat Malam'
      const dateStr = nowWIB.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
      const timeStr = `${String(nowWIB.getUTCHours()).padStart(2,'0')}.${String(nowWIB.getUTCMinutes()).padStart(2,'0')} WIB`

      return `Kamu adalah sistem notifikasi akademik Gradely. Tugas kamu adalah membuat pesan WhatsApp RESMI dari Admin Gradely kepada dosen wali. IKUTI TEMPLATE BERIKUT PERSIS, jangan ubah urutan atau judul section.

WAKTU: ${greeting}, ${dateStr} pukul ${timeStr}

============================
DATA INPUT
============================
Nama Dosen     : ${lecturer.full_name}
Total Bimbingan: ${totalAdvisees} mahasiswa
Rata-rata IPK  : ${avgIpk}
Unggul/On Track: ${onTrack.length} orang
Perlu Perhatian: ${needAttention.length} orang
Kritis/Darurat : ${critical.length} orang
No HP belum diisi: ${noPhone.length} orang
Detail mahasiswa:
${studentSummaries.length > 0 ? studentSummaries.map((s, i) => `${i + 1}. ${s.name} (${s.nim}) - ${s.prodi} Sem ${s.semester}
   IPK: ${s.ipk.toFixed(2)} | IPS Terakhir: ${s.ips_terakhir.toFixed(2)} | SKS: ${s.sks_lulus}/${s.sks_total}
   Status: ${s.status} | Prediksi Lulus: Sem ${s.prediksi_lulus}${s.mk_mengulang > 0 ? ` | MK Mengulang: ${s.mk_mengulang}` : ''}${!s.phone_valid ? ' | ⚠️ No HP belum diisi' : ''}`).join('\n\n') : '(Belum ada mahasiswa bimbingan)'}
Kontak Admin   : ${adminUser.full_name} | ${adminContact}

============================
TEMPLATE PESAN (IKUTI PERSIS)
============================

${greeting}, Bapak/Ibu ${lecturer.full_name} 🙏

Kami dari Admin Gradely menyampaikan laporan akademik mahasiswa bimbingan Bapak/Ibu per ${dateStr}.

📊 RINGKASAN BIMBINGAN
[Tulis ringkasan: total mahasiswa, rata-rata IPK, distribusi status. Jika 0 mahasiswa, tulis bahwa belum ada mahasiswa terdaftar dan minta dosen bagikan join code]

🔴 SOROTAN KRITIS
[Jika ada mahasiswa kritis, sebutkan nama + kondisi + saran tindakan. Jika tidak ada, tulis "Tidak ada mahasiswa dengan status kritis."]

🟡 PERLU PERHATIAN
[Jika ada, sebutkan nama + kondisi. Jika tidak ada, tulis "Tidak ada mahasiswa yang memerlukan perhatian khusus."]

🟢 APRESIASI
[Jika ada mahasiswa Unggul/On Track, sebutkan nama + IPK. Jika tidak ada, tulis "Belum ada data."]

📋 TINDAKAN YANG DIPERLUKAN
[Tulis 2-3 tindakan konkret yang perlu dilakukan dosen berdasarkan kondisi di atas. Jika 0 mahasiswa, minta dosen aktifkan join code]

⚠️ INFO NOMOR HP
[Jika ada yang belum mengisi HP, sebutkan. Jika semua sudah, tulis "Semua mahasiswa sudah mengisi nomor HP."]

Terima kasih atas perhatian dan kerja sama Bapak/Ibu ${lecturer.full_name}. Kami siap membantu jika ada pertanyaan.

Salam hormat,
${adminUser.full_name}
Admin Gradely
${adminContact}

============================
ATURAN FORMAT
============================
- WAJIB gunakan salam "${greeting}" di baris pertama
- Gunakan emoji persis seperti di template (📊 🔴 🟡 🟢 📋 ⚠️)
- Paragraf pendek, mudah dibaca di layar HP
- JANGAN gunakan *bold* atau _italic_
- Pisahkan tiap section dengan baris kosong
- Balas HANYA teks pesan WA, tanpa penjelasan tambahan`
    })()

    const aiRes = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 1200,
        stream: true,
      }),
      signal: AbortSignal.timeout(60000),
    })

    let messageText = ''
    if (aiRes.ok) {
      const rawText = await aiRes.text()
      const lines = rawText.split('\n').filter(l => l.startsWith('data: ') && !l.includes('[DONE]'))
      for (const line of lines) {
        try {
          const json = JSON.parse(line.replace('data: ', ''))
          const delta = json.choices?.[0]?.delta?.content
          if (delta) messageText += delta
        } catch { /* skip */ }
      }
      if (!messageText) {
        try {
          const jsonResp = JSON.parse(rawText)
          messageText = jsonResp.choices?.[0]?.message?.content ?? ''
        } catch { /* not JSON */ }
      }
    }

    if (!messageText) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Gagal generate pesan dari AI', success: false }, { status: 502 })
    }

    if (preview_only) {
      return NextResponse.json<ApiResponse>({ data: { message: messageText }, error: null, success: true })
    }

    // Format nomor HP dosen ke format WhatsApp
    const chatId = phoneDigits.startsWith('0')
      ? `62${phoneDigits.slice(1)}@c.us`
      : phoneDigits.startsWith('62')
        ? `${phoneDigits}@c.us`
        : `62${phoneDigits}@c.us`

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
      await supabase.from('whatsapp_logs').insert({
        recipient_id: lecturer_id,
        phone_number: lecturer.phone,
        message: messageText,
        status: 'failed',
        error_message: `WAHA error: ${wahaRes.status} ${errText}`,
      })
      return NextResponse.json<ApiResponse>({ data: null, error: `Gagal mengirim via WAHA: ${wahaRes.status}`, success: false }, { status: 502 })
    }

    await supabase.from('whatsapp_logs').insert({
      recipient_id: lecturer_id,
      phone_number: lecturer.phone,
      message: messageText,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })

    return NextResponse.json<ApiResponse>({ data: { message: messageText }, error: null, success: true })
  } catch (err) {
    console.error('admin send-message-lecturer error:', err)
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

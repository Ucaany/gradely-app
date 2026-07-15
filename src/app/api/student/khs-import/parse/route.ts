import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

const SUPPORTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024
const VALID_GRADES = new Set(['A', 'AB', 'B', 'BC', 'C', 'D', 'E'])

function isValidPublicHttpsUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'https:') return false
    const h = parsed.hostname
    if (
      h === 'localhost' ||
      /^127\./.test(h) ||
      /^10\./.test(h) ||
      /^192\.168\./.test(h) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
      h === '169.254.169.254' ||
      h.endsWith('.internal') ||
      h.endsWith('.local')
    ) return false
    return true
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role, university_id')
      .eq('id', user.id)
      .single()
    if (!profile || profile.role !== 'student') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const { data: settingRows } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['ai_vision_api_key', 'ai_vision_base_url', 'ai_vision_model'])

    const settingsMap = Object.fromEntries((settingRows ?? []).map(r => [r.key, r.value]))

    // Fallback ke env vars jika settings DB kosong
    const apiKey = settingsMap['ai_vision_api_key'] ?? process.env.AI_VISION_API_KEY ?? process.env.AI_API_KEY ?? ''
    const rawBaseUrl = (settingsMap['ai_vision_base_url'] ?? process.env.AI_VISION_BASE_URL ?? process.env.AI_BASE_URL ?? 'https://9prxy.sribuai.my.id/v1').replace(/\/$/, '')
    const model = settingsMap['ai_vision_model'] ?? process.env.AI_VISION_MODEL ?? process.env.AI_MODEL ?? 'kr/auto'

    if (!apiKey) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: 'AI Vision API key belum dikonfigurasi. Hubungi admin.', success: false },
        { status: 503 }
      )
    }

    if (!isValidPublicHttpsUrl(rawBaseUrl)) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: 'Konfigurasi AI Base URL tidak valid. Hubungi admin.', success: false },
        { status: 503 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json<ApiResponse>({ data: null, error: 'File tidak ditemukan', success: false }, { status: 400 })
    if (!SUPPORTED_TYPES.includes(file.type)) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Format file tidak didukung. Gunakan PDF, PNG, JPG, atau WebP.', success: false }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Ukuran file melebihi 10 MB', success: false }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')
    const mimeType = file.type
    const isPdf = mimeType === 'application/pdf'

    const prompt = `Kamu adalah parser dokumen KHS (Kartu Hasil Studi) mahasiswa Indonesia.
Ekstrak semua mata kuliah dari dokumen ini dan kembalikan HANYA JSON array dengan format berikut:
[
  {
    "course_name": "Nama Mata Kuliah",
    "credits": 3,
    "grade": "A",
    "semester_number": 1,
    "semester_type": "ganjil",
    "academic_year": "2024/2025"
  }
]
Aturan:
- grade harus salah satu dari: A, AB, B, BC, C, D, E
- semester_type harus "ganjil" atau "genap" (ganjil = semester ganjil 1,3,5,7,9, genap = semester genap 2,4,6,8,10)
- credits harus angka integer 1-6
- semester_number harus angka integer 1-14
- academic_year format "YYYY/YYYY" misal "2024/2025"
- Jika informasi tahun ajaran tidak ada, gunakan "2024/2025"
- Kembalikan HANYA JSON array, tidak ada teks lain sama sekali`

    const contentParts: object[] = [{ type: 'text', text: prompt }]

    if (isPdf) {
      contentParts.push({
        type: 'text',
        text: `[File PDF terlampir sebagai base64 — ukuran: ${Math.round(file.size / 1024)} KB. Ekstrak semua data nilai dari dokumen KHS ini.]\nData base64 PDF: data:application/pdf;base64,${base64}`,
      })
    } else {
      contentParts.push({
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${base64}` },
      })
    }

    const aiUrl = `${rawBaseUrl}/chat/completions`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 90000)

    let aiRes: Response
    try {
      aiRes = await fetch(aiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: contentParts }],
          temperature: 0,
          max_tokens: 4096,
          stream: true,
        }),
        signal: controller.signal,
      })
    } catch (fetchErr: unknown) {
      clearTimeout(timeout)
      const isAbort = fetchErr instanceof Error && fetchErr.name === 'AbortError'
      return NextResponse.json<ApiResponse>(
        {
          data: null,
          error: isAbort
            ? 'AI terlalu lama merespons. Coba lagi dengan file yang lebih kecil atau gambar.'
            : 'Gagal menghubungi layanan AI. Periksa konfigurasi API key.',
          success: false,
        },
        { status: 502 }
      )
    }
    clearTimeout(timeout)

    if (!aiRes.ok) {
      const errBody = await aiRes.text()
      console.error('AI error:', aiRes.status, errBody)
      let userMsg = `Layanan AI mengembalikan error ${aiRes.status}.`
      if (aiRes.status === 401) userMsg = 'API key tidak valid atau tidak memiliki akses. Periksa konfigurasi Vision API key.'
      else if (aiRes.status === 403) userMsg = 'API key tidak memiliki izin untuk model ini.'
      else if (aiRes.status === 404) userMsg = `Model "${model}" tidak ditemukan di endpoint ini.`
      else if (aiRes.status === 429) userMsg = 'Rate limit tercapai. Coba lagi beberapa saat.'
      else if (aiRes.status >= 500) userMsg = 'Server AI sedang bermasalah. Coba lagi nanti.'
      return NextResponse.json<ApiResponse>({ data: null, error: userMsg, success: false }, { status: 502 })
    }

    // Parse SSE streaming response
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

    // Fallback: jika tidak ada SSE chunks, coba parse sebagai non-streaming
    if (!content) {
      try {
        const jsonResp = JSON.parse(rawText)
        content = jsonResp.choices?.[0]?.message?.content ?? ''
      } catch { /* not JSON */ }
    }

    if (!content) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: 'AI tidak mengembalikan respons. Pastikan model mendukung input gambar/dokumen.', success: false },
        { status: 422 }
      )
    }

    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: 'AI tidak dapat mengekstrak data nilai dari dokumen ini. Pastikan dokumen adalah KHS yang valid.', success: false },
        { status: 422 }
      )
    }

    const raw: object[] = JSON.parse(jsonMatch[0])
    const grades = raw
      .filter((g: object) => {
        const item = g as Record<string, unknown>
        return (
          typeof item.course_name === 'string' &&
          item.course_name.trim() !== '' &&
          VALID_GRADES.has(String(item.grade).toUpperCase()) &&
          Number(item.credits) >= 1 &&
          Number(item.credits) <= 6 &&
          Number(item.semester_number) >= 1
        )
      })
      .map((g: object) => {
        const item = g as Record<string, unknown>
        const semNum = Number(item.semester_number)
        return {
          course_name: String(item.course_name).trim(),
          credits: Math.min(6, Math.max(1, Number(item.credits))),
          grade: String(item.grade).toUpperCase(),
          semester_number: semNum,
          semester_type: String(item.semester_type ?? (semNum % 2 === 1 ? 'ganjil' : 'genap')),
          academic_year: String(item.academic_year ?? '2024/2025'),
        }
      })

    if (grades.length === 0) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: 'Tidak ada data nilai yang valid ditemukan. Pastikan dokumen adalah KHS yang terbaca jelas.', success: false },
        { status: 422 }
      )
    }

    return NextResponse.json({ data: grades, error: null, success: true })
  } catch (err) {
    console.error('KHS parse error:', err)
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

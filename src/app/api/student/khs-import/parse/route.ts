import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

const SUPPORTED_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024

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
      .select('value')
      .eq('key', 'gemini_api_key')
      .limit(1)
    const apiKey = settingRows?.[0]?.value ?? ''
    if (!apiKey) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: 'Gemini API key belum dikonfigurasi. Hubungi admin.', success: false },
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

    const geminiModel = 'gemini-2.0-flash'
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: 4096,
        },
      }),
    })

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text()
      console.error('Gemini error:', errBody)
      return NextResponse.json<ApiResponse>(
        { data: null, error: 'Gagal menghubungi layanan AI. Periksa konfigurasi API key.', success: false },
        { status: 502 }
      )
    }

    const geminiData = await geminiRes.json()
    const content: string = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? ''

    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: 'AI tidak dapat mengekstrak data nilai dari dokumen ini.', success: false },
        { status: 422 }
      )
    }

    const VALID_GRADES = new Set(['A', 'AB', 'B', 'BC', 'C', 'D', 'E'])
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

    return NextResponse.json({ data: grades, error: null, success: true })
  } catch (err) {
    console.error('KHS parse error:', err)
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

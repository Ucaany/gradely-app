import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { csvUserRowSchema } from '@/lib/validations'
import type { ApiResponse, ImportResult } from '@/types'

// POST /api/admin/import — bulk import via CSV data (parsed di client)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const { data: adminProfile } = await supabase
      .from('users')
      .select('university_id')
      .eq('id', user.id)
      .single()

    const body = await request.json()
    const { rows } = body

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Data tidak valid', success: false }, { status: 400 })
    }

    const university_id = adminProfile?.university_id ?? null
    if (!university_id) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'University tidak ditemukan untuk akun admin ini', success: false }, { status: 400 })
    }

    const default_password = process.env.DEFAULT_IMPORT_PASSWORD
    if (!default_password) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: 'DEFAULT_IMPORT_PASSWORD environment variable tidak di-set. Hubungi administrator.', success: false },
        { status: 500 }
      )
    }

    const serviceClient = createServiceClient()
    const result: ImportResult = { success: 0, failed: 0, errors: [] }

    // Cache lookup: nama prodi -> UUID (case-insensitive)
    const { data: studyPrograms } = await serviceClient
      .from('study_programs')
      .select('id, name')
      .eq('university_id', university_id)

    const studyProgramMap = new Map<string, string>(
      (studyPrograms ?? []).map((sp: { id: string; name: string }) => [sp.name.toLowerCase(), sp.id])
    )

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      // Resolve study_program_id: jika bukan UUID, coba lookup by name
      if (row.study_program_id && !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(row.study_program_id)) {
        const resolved = studyProgramMap.get(row.study_program_id.toLowerCase())
        if (resolved) {
          row.study_program_id = resolved
        } else {
          result.failed++
          result.errors.push({ row: i + 1, email: row.email ?? 'unknown', reason: `Program studi "${row.study_program_id}" tidak ditemukan` })
          continue
        }
      }

      const parsed = csvUserRowSchema.safeParse(row)

      if (!parsed.success) {
        result.failed++
        result.errors.push({
          row: i + 1,
          email: row.email ?? 'unknown',
          reason: parsed.error.issues.map((e) => e.message).join(', '),
        })
        continue
      }

      const data = parsed.data

      try {
        // Buat auth user
        const { data: authData, error: authError } =
          await serviceClient.auth.admin.createUser({
            email: data.email,
            password: default_password,
            email_confirm: true,
          })

        if (authError || !authData.user) {
          result.failed++
          result.errors.push({
            row: i + 1,
            email: data.email,
            reason: authError?.message?.includes('already registered')
              ? 'Email sudah terdaftar'
              : (authError?.message ?? 'Gagal membuat auth user'),
          })
          continue
        }

        // Insert ke users
        const { error: insertError } = await serviceClient.from('users').insert({
          id: authData.user.id,
          university_id,
          study_program_id: data.study_program_id ?? null,
          role: data.role,
          full_name: data.full_name,
          email: data.email,
          nim: data.nim ?? null,
          phone: data.phone ?? null,
          current_semester: data.current_semester ?? null,
          is_active: true,
        })

        if (insertError) {
          await serviceClient.auth.admin.deleteUser(authData.user.id)
          result.failed++
          result.errors.push({ row: i + 1, email: data.email, reason: insertError.message })
          continue
        }

        if (data.role === 'company') {
          await serviceClient.from('companies').insert({
            user_id: authData.user.id,
            university_id,
            company_name: data.full_name,
            is_active: true,
          })
        }

        result.success++
      } catch {
        result.failed++
        result.errors.push({ row: i + 1, email: row.email ?? 'unknown', reason: 'Error tidak terduga' })
      }
    }

    return NextResponse.json<ApiResponse>({ data: result, error: null, success: true }, { status: 200 })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

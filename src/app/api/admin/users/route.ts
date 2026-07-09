import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createUserSchema } from '@/lib/validations'
import type { ApiResponse } from '@/types'

// POST /api/admin/users — buat user baru
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    // Cek role admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { data: null, error: 'Forbidden', success: false },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = createUserSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        {
          data: null,
          error: parsed.error.issues.map((e) => e.message).join(', '),
          success: false,
        },
        { status: 422 }
      )
    }

    const data = parsed.data

    // Gunakan service role untuk bypass RLS saat create auth user
    const serviceClient = createServiceClient()

    // 1. Buat auth user
    const { data: authData, error: authError } =
      await serviceClient.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
      })

    if (authError || !authData.user) {
      if (authError?.message?.includes('already registered')) {
        return NextResponse.json<ApiResponse>(
          { data: null, error: 'Email sudah terdaftar', success: false },
          { status: 409 }
        )
      }
      return NextResponse.json<ApiResponse>(
        { data: null, error: authError?.message ?? 'Gagal membuat auth user', success: false },
        { status: 500 }
      )
    }

    // 2. Insert ke tabel users
    const { error: insertError } = await serviceClient.from('users').insert({
      id: authData.user.id,
      university_id: data.university_id,
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
      // Rollback: hapus auth user kalau insert gagal
      await serviceClient.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json<ApiResponse>(
        { data: null, error: insertError.message, success: false },
        { status: 500 }
      )
    }

    return NextResponse.json<ApiResponse>(
      { data: { id: authData.user.id }, error: null, success: true },
      { status: 201 }
    )
  } catch {
    return NextResponse.json<ApiResponse>(
      { data: null, error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}

// GET /api/admin/users — list users dengan filter
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json<ApiResponse>(
        { data: null, error: 'Forbidden', success: false },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const search = searchParams.get('search')
    const page = Number(searchParams.get('page') ?? 1)
    const pageSize = Number(searchParams.get('pageSize') ?? 20)
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('users')
      .select('*, study_programs(id, name, short_name)', { count: 'exact' })
      .order('full_name')
      .range(from, to)

    if (role) query = query.eq('role', role)
    if (search) {
      query = query.or(
        `full_name.ilike.%${search}%,email.ilike.%${search}%,nim.ilike.%${search}%`
      )
    }

    const { data, count, error } = await query

    if (error) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: error.message, success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data,
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
      error: null,
      success: true,
    })
  } catch {
    return NextResponse.json<ApiResponse>(
      { data: null, error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}

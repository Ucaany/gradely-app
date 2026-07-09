import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { updateUserSchema } from '@/lib/validations'
import type { ApiResponse } from '@/types'

// GET /api/admin/users/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('users')
      .select('*, study_programs(id, name, short_name), universities(id, name, short_name)')
      .eq('id', params.id)
      .single()

    if (error || !data) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'User tidak ditemukan', success: false }, { status: 404 })
    }

    return NextResponse.json<ApiResponse>({ data, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

// PATCH /api/admin/users/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const body = await request.json()
    const parsed = updateUserSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: parsed.error.issues.map((e) => e.message).join(', '), success: false },
        { status: 422 }
      )
    }

    const serviceClient = createServiceClient()
    const updateData = {
      ...parsed.data,
      study_program_id: parsed.data.study_program_id && parsed.data.study_program_id.length > 0
        ? parsed.data.study_program_id
        : null,
      phone: parsed.data.phone && parsed.data.phone.length > 0
        ? parsed.data.phone
        : null,
      nim: parsed.data.nim && parsed.data.nim.length > 0
        ? parsed.data.nim
        : null,
    }
    const { data, error } = await serviceClient
      .from('users')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 500 })
    }

    return NextResponse.json<ApiResponse>({ data, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

// DELETE /api/admin/users/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    // Cegah admin menghapus dirinya sendiri
    if (params.id === user.id) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Tidak dapat menghapus akun sendiri', success: false }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Hapus dari auth (cascade ke tabel users via FK)
    const { error } = await serviceClient.auth.admin.deleteUser(params.id)
    if (error) {
      return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 500 })
    }

    return NextResponse.json<ApiResponse>({ data: { id: params.id }, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

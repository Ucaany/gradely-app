import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'student') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const { data: alreadyJoined } = await supabase
      .from('advisor_students')
      .select('id')
      .eq('student_id', user.id)
      .maybeSingle()

    if (alreadyJoined) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: 'Kamu sudah terhubung ke dosen wali.', success: false },
        { status: 409 }
      )
    }

    const body = await request.json()
    const rawCode = String(body.join_code ?? '').trim()

    if (!rawCode || rawCode.length < 4) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: 'Kode tidak valid', success: false },
        { status: 400 }
      )
    }

    // Gunakan service client untuk bypass RLS saat query dosen
    const serviceClient = createServiceClient()
    const { data: lecturers } = await serviceClient
      .from('users')
      .select('id, full_name, join_code')
      .eq('role', 'lecturer')
      .ilike('join_code', rawCode.trim())

    const matched = lecturers?.[0] ?? null

    if (!matched) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: 'Kode tidak ditemukan. Pastikan kode yang dimasukkan sudah benar.', success: false },
        { status: 404 }
      )
    }

    const { error } = await serviceClient
      .from('advisor_students')
      .insert({
        lecturer_id: matched.id,
        student_id: user.id,
        join_code: rawCode.toUpperCase(),
      })

    if (error) {
      return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 500 })
    }

    return NextResponse.json({ data: { lecturer_name: matched.full_name }, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const serviceClient = createServiceClient()
    const { data } = await serviceClient
      .from('advisor_students')
      .select('id, created_at, join_code, users!advisor_students_lecturer_id_fkey(id, full_name, email, avatar_url)')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ data: data ?? [], error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

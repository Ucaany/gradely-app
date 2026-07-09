import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

// POST /api/student/join-advisor — mahasiswa input kode, hanya bisa 1x seumur hidup
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

    // Cek apakah mahasiswa sudah punya dosen wali (hanya boleh 1x)
    const { data: alreadyJoined } = await supabase
      .from('advisor_students')
      .select('id')
      .eq('student_id', user.id)
      .limit(1)
      .single()

    if (alreadyJoined) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: 'Kamu sudah terhubung ke dosen wali. Koneksi bersifat permanen dan tidak dapat diubah.', success: false },
        { status: 409 }
      )
    }

    const body = await request.json()
    const code = String(body.join_code ?? '').trim().toUpperCase()

    if (!code || code.length < 4) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: 'Kode tidak valid', success: false },
        { status: 400 }
      )
    }

    // Cari dosen berdasarkan join_code
    const { data: lecturer } = await supabase
      .from('users')
      .select('id, full_name, role')
      .eq('join_code', code)
      .eq('role', 'lecturer')
      .single()

    if (!lecturer) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: 'Kode tidak ditemukan. Periksa kembali kode yang diberikan dosen wali.', success: false },
        { status: 404 }
      )
    }

    // Insert ke advisor_students
    const { error } = await supabase
      .from('advisor_students')
      .insert({
        lecturer_id: lecturer.id,
        student_id: user.id,
        join_code: code,
      })

    if (error) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: error.message, success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: { lecturer_name: lecturer.full_name },
      error: null,
      success: true,
    })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

// GET /api/student/join-advisor — cek status advisor mahasiswa
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data } = await supabase
      .from('advisor_students')
      .select('id, created_at, join_code, users!advisor_students_lecturer_id_fkey(id, full_name, email, avatar_url)')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ data: data ?? [], error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateStudentProfileSchema } from '@/lib/validations'
import type { ApiResponse } from '@/types'

// GET /api/student/profile
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data, error } = await supabase
      .from('users')
      .select(`
        id, full_name, email, nim, phone, avatar_url,
        current_semester, current_semester_type, profile_visible,
        is_active, created_at, updated_at,
        university_id, study_program_id,
        study_programs(id, name, short_name, degree_level),
        universities(id, name, short_name, city, province)
      `)
      .eq('id', user.id)
      .single()

    if (error) return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 500 })

    return NextResponse.json({ data, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

// PATCH /api/student/profile
export async function PATCH(request: NextRequest) {
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

    const body = await request.json()
    const parsed = updateStudentProfileSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: parsed.error.issues.map((e) => e.message).join(', '), success: false },
        { status: 422 }
      )
    }

    const updateData: Record<string, unknown> = {}
    if (parsed.data.full_name !== undefined) updateData.full_name = parsed.data.full_name
    if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone
    if (parsed.data.avatar_url !== undefined) updateData.avatar_url = parsed.data.avatar_url || null || null
    if (parsed.data.avatar_url !== undefined) updateData.avatar_url = parsed.data.avatar_url || null
    if (parsed.data.current_semester !== undefined) updateData.current_semester = parsed.data.current_semester
    if (parsed.data.current_semester_type !== undefined) updateData.current_semester_type = parsed.data.current_semester_type
    if (parsed.data.profile_visible !== undefined) updateData.profile_visible = parsed.data.profile_visible

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select(`
        id, full_name, email, nim, phone, avatar_url,
        current_semester, current_semester_type, profile_visible,
        is_active, created_at, updated_at,
        university_id, study_program_id,
        study_programs(id, name, short_name, degree_level),
        universities(id, name, short_name, city, province)
      `)
      .single()

    if (error) return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 500 })

    return NextResponse.json({ data, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

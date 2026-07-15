import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createGradeSchema } from '@/lib/validations'
import { getGradePoints } from '@/lib/utils/academic'
import type { ApiResponse } from '@/types'

// GET /api/student/grades — ambil semua nilai mahasiswa yang login
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role, study_program_id, university_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'student') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const semester = searchParams.get('semester')

    let query = supabase
      .from('student_grades')
      .select('*')
      .eq('student_id', user.id)
      .order('semester_number', { ascending: true })
      .order('created_at', { ascending: true })

    if (semester) query = query.eq('semester_number', Number(semester))

    const { data, error } = await query

    if (error) return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 500 })

    return NextResponse.json({ data, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

// POST /api/student/grades — tambah nilai baru
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role, study_program_id, university_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'student') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const body = await request.json()
    const parsed = createGradeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: parsed.error.issues.map((e) => e.message).join(', '), success: false },
        { status: 422 }
      )
    }

    const { semester_number, semester_type, academic_year, course_name, credits, grade, is_retake } = parsed.data

    // Ambil academic rules untuk grade_scale
    let gradeScale = { A: 4.0, 'A-': 3.75, BA: 3.5, 'B+': 3.25, B: 3.0, 'B-': 2.75, C: 2.0, D: 1.0, E: 0.0 }
    if (profile.study_program_id) {
      const { data: rule } = await supabase
        .from('academic_rules')
        .select('grade_scale')
        .eq('university_id', profile.university_id)
        .or(`study_program_id.eq.${profile.study_program_id},study_program_id.is.null`)
        .order('study_program_id', { ascending: false })
        .limit(1)
        .single()
      if (rule?.grade_scale) gradeScale = rule.grade_scale
    }

    const grade_points = getGradePoints(grade, gradeScale)

    const { data, error } = await supabase
      .from('student_grades')
      .insert({
        student_id: user.id,
        semester_number,
        semester_type,
        academic_year,
        course_name,
        credits,
        grade,
        grade_points,
        is_retake: is_retake ?? false,
      })
      .select()
      .single()

    if (error) return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 500 })

    return NextResponse.json({ data, error: null, success: true }, { status: 201 })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

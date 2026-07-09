import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateGradeSchema } from '@/lib/validations'
import { getGradePoints } from '@/lib/utils/academic'
import type { ApiResponse } from '@/types'

// PATCH /api/student/grades/[id]
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Pastikan nilai milik mahasiswa ini
    const { data: existing } = await supabase
      .from('student_grades')
      .select('id')
      .eq('id', params.id)
      .eq('student_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Nilai tidak ditemukan', success: false }, { status: 404 })
    }

    const body = await request.json()
    const parsed = updateGradeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: parsed.error.issues.map((e) => e.message).join(', '), success: false },
        { status: 422 }
      )
    }

    const updateData: Record<string, unknown> = { ...parsed.data }

    // Recalculate grade_points jika grade berubah
    if (parsed.data.grade) {
      let gradeScale = { A: 4.0, AB: 3.5, B: 3.0, BC: 2.5, C: 2.0, D: 1.0, E: 0.0 }
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
      updateData.grade_points = getGradePoints(parsed.data.grade, gradeScale)
    }

    const { data, error } = await supabase
      .from('student_grades')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 500 })

    return NextResponse.json({ data, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

// DELETE /api/student/grades/[id]
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
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

    const { error } = await supabase
      .from('student_grades')
      .delete()
      .eq('id', params.id)
      .eq('student_id', user.id)

    if (error) return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 500 })

    return NextResponse.json({ data: null, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

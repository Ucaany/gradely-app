import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, AcademicRule } from '@/types'
import { DEFAULT_SKS_RULES_BY_IPK } from '@/lib/utils/academic'

export async function GET() {
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

    let rule: AcademicRule | null = null
    if (profile.university_id) {
      if (profile.study_program_id) {
        const { data } = await supabase
          .from('academic_rules')
          .select('*')
          .eq('university_id', profile.university_id)
          .eq('study_program_id', profile.study_program_id)
          .single()
        rule = data
      }
      if (!rule) {
        const { data } = await supabase
          .from('academic_rules')
          .select('*')
          .eq('university_id', profile.university_id)
          .is('study_program_id', null)
          .single()
        rule = data
      }
    }

    const effectiveRule: AcademicRule = rule ?? {
      id: '', university_id: profile.university_id ?? '', study_program_id: null,
      total_sks_graduation: 144, normal_semester: 8, max_semester: 14,
      min_gpa: 2.0, max_sks_per_semester: 24, min_sks_per_semester: 12,
      passing_grade: 'D',
      grade_scale: { A: 4.0, 'A-': 3.75, BA: 3.5, 'B+': 3.25, B: 3.0, 'B-': 2.75, C: 2.0, D: 1.0, E: 0.0 },
      sks_rules_by_ipk: DEFAULT_SKS_RULES_BY_IPK,
      created_at: '', updated_at: '',
    }

    const passingGradePoints = effectiveRule.grade_scale[effectiveRule.passing_grade] ?? 0

    return NextResponse.json({
      data: {
        passing_grade: effectiveRule.passing_grade,
        passing_grade_points: passingGradePoints,
        grade_scale: effectiveRule.grade_scale,
      },
      error: null,
      success: true,
    })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

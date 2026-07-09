import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateAcademicSummary, groupGradesBySemester } from '@/lib/utils/academic'
import type { ApiResponse, AcademicRule, StudentGrade } from '@/types'

// GET /api/student/summary — hitung academic summary mahasiswa yang login
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role, study_program_id, university_id, current_semester')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'student') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    // Ambil semua nilai
    const { data: grades, error: gradesError } = await supabase
      .from('student_grades')
      .select('*')
      .eq('student_id', user.id)
      .order('semester_number', { ascending: true })

    if (gradesError) return NextResponse.json<ApiResponse>({ data: null, error: gradesError.message, success: false }, { status: 500 })

    // Ambil target kelulusan
    const { data: target } = await supabase
      .from('student_targets')
      .select('target_semester, career_goal')
      .eq('student_id', user.id)
      .single()

    // Ambil academic rules (prodi spesifik dulu, fallback ke default)
    let rule: AcademicRule | null = null
    if (profile.university_id) {
      if (profile.study_program_id) {
        const { data: specificRule } = await supabase
          .from('academic_rules')
          .select('*')
          .eq('university_id', profile.university_id)
          .eq('study_program_id', profile.study_program_id)
          .single()
        rule = specificRule
      }
      if (!rule) {
        const { data: defaultRule } = await supabase
          .from('academic_rules')
          .select('*')
          .eq('university_id', profile.university_id)
          .is('study_program_id', null)
          .single()
        rule = defaultRule
      }
    }

    // Fallback rule jika tidak ada di DB
    const effectiveRule: AcademicRule = rule ?? {
      id: '',
      university_id: profile.university_id ?? '',
      study_program_id: null,
      total_sks_graduation: 144,
      normal_semester: 8,
      max_semester: 14,
      min_gpa: 2.0,
      max_sks_per_semester: 24,
      min_sks_per_semester: 12,
      passing_grade: 'D',
      grade_scale: { A: 4.0, AB: 3.5, B: 3.0, BC: 2.5, C: 2.0, D: 1.0, E: 0.0 },
      created_at: '',
      updated_at: '',
    }

    const currentSemester = profile.current_semester ?? 1
    const targetSemester = target?.target_semester ?? effectiveRule.normal_semester
    const typedGrades = (grades ?? []) as StudentGrade[]

    const summary = calculateAcademicSummary(typedGrades, currentSemester, targetSemester, effectiveRule)
    const semesterSummaries = groupGradesBySemester(typedGrades)

    return NextResponse.json({
      data: {
        summary,
        semester_summaries: semesterSummaries,
        target: target ?? null,
        rule: effectiveRule,
      },
      error: null,
      success: true,
    })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

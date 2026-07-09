import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateAcademicStatus } from '@/lib/utils/academic'
import type { ApiResponse, AcademicStatus, AcademicRule, StudentGrade, GradeValue } from '@/types'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const [{ data: students }, { data: rules }, { data: grades }] = await Promise.all([
      supabase.from('users').select('id, current_semester, study_program_id').eq('role', 'student').eq('is_active', true),
      supabase.from('academic_rules').select('*'),
      supabase.from('student_grades').select('student_id, semester_number, grade_points, credits, is_retake'),
    ])

    if (!students || students.length === 0) {
      return NextResponse.json({ data: [], error: null, success: true })
    }

    const defaultRule = (rules ?? []).find((r: AcademicRule) => !r.study_program_id) ?? (rules ?? [])[0]
    if (!defaultRule) {
      return NextResponse.json({ data: [], error: null, success: true })
    }

    const gradesByStudent = new Map<string, StudentGrade[]>()
    for (const g of grades ?? []) {
      const arr = gradesByStudent.get(g.student_id) ?? []
      arr.push(g as unknown as StudentGrade)
      gradesByStudent.set(g.student_id, arr)
    }

    const counts: Record<AcademicStatus, number> = {
      ahead: 0,
      on_track: 0,
      need_attention: 0,
      recovery_mode: 0,
      critical: 0,
    }

    for (const student of students) {
      const studentGrades = gradesByStudent.get(student.id) ?? []
      const rule = (rules ?? []).find((r: AcademicRule) => r.study_program_id === student.study_program_id) ?? defaultRule

      const passingPoints = rule.grade_scale[rule.passing_grade as GradeValue] ?? 0
      const sksLulus = studentGrades.filter((g) => g.grade_points >= passingPoints).reduce((s, g) => s + g.credits, 0)
      const totalWeighted = studentGrades.reduce((s, g) => s + g.grade_points * g.credits, 0)
      const totalCredits = studentGrades.reduce((s, g) => s + g.credits, 0)
      const ipk = totalCredits > 0 ? Math.round((totalWeighted / totalCredits) * 100) / 100 : 0
      const retakeCount = studentGrades.filter((g) => g.is_retake).length
      const currentSemester = student.current_semester ?? 1

      const status = calculateAcademicStatus(sksLulus, currentSemester, ipk, retakeCount, rule)
      counts[status]++
    }

    const data = [
      { status: 'ahead', label: 'Unggul', count: counts.ahead, color: '#16a34a' },
      { status: 'on_track', label: 'Sesuai Target', count: counts.on_track, color: '#2563eb' },
      { status: 'need_attention', label: 'Perlu Perhatian', count: counts.need_attention, color: '#ca8a04' },
      { status: 'recovery_mode', label: 'Butuh Pemulihan', count: counts.recovery_mode, color: '#ea580c' },
      { status: 'critical', label: 'Darurat Akademik', count: counts.critical, color: '#dc2626' },
    ]

    return NextResponse.json({ data, total: students.length, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

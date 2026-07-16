import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { calculateAcademicStatus, deduplicateRetakes } from '@/lib/utils/academic'
import type { ApiResponse, AcademicStatus, AcademicRule, StudentGrade, GradeValue } from '@/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Auth check — gunakan anon client agar session cookie terbaca
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role, university_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const universityId = profile.university_id ?? null

    // Semua query data pakai service client — bypass RLS agar admin bisa baca data mahasiswa lain
    const service = createServiceClient()

    const [{ data: allStudents, error: studentsError }, { data: rules, error: rulesError }] = await Promise.all([
      universityId
        ? service.from('users').select('id, current_semester, study_program_id').eq('role', 'student').neq('is_active', false).eq('university_id', universityId)
        : service.from('users').select('id, current_semester, study_program_id').eq('role', 'student').neq('is_active', false),
      universityId
        ? service.from('academic_rules').select('*').eq('university_id', universityId)
        : service.from('academic_rules').select('*'),
    ])

    if (studentsError) console.error('[student-status] studentsError:', studentsError)
    if (rulesError) console.error('[student-status] rulesError:', rulesError)

    const students = allStudents ?? []
    const studentIds = students.map((s: { id: string }) => s.id)

    const { data: grades } = studentIds.length > 0
      ? await service
          .from('student_grades')
          .select('student_id, semester_number, grade_points, credits, is_retake')
          .in('student_id', studentIds)
      : { data: [] }

    if (students.length === 0) {
      return NextResponse.json({ data: [], error: null, success: true, total: 0 })
    }

    const defaultRule: AcademicRule = (rules ?? []).find((r: AcademicRule) => !r.study_program_id) ?? (rules ?? [])[0] ?? {
      id: '',
      university_id: universityId ?? '',
      study_program_id: null,
      total_sks_graduation: 144,
      normal_semester: 8,
      max_semester: 14,
      min_gpa: 2.0,
      max_sks_per_semester: 24,
      min_sks_per_semester: 12,
      passing_grade: 'D',
      grade_scale: { A: 4.0, 'A-': 3.75, BA: 3.5, 'B+': 3.25, B: 3.0, 'B-': 2.75, C: 2.0, D: 1.0, E: 0.0 },
      sks_rules_by_ipk: {
        enabled: true,
        semester_1_2_max: 20,
        tiers: [
          { ipk_min: 3.00, ipk_max: 4.00, sks_min: 22, sks_max: 24 },
          { ipk_min: 2.50, ipk_max: 2.99, sks_min: 20, sks_max: 22 },
          { ipk_min: 2.00, ipk_max: 2.49, sks_min: 16, sks_max: 20 },
          { ipk_min: 1.50, ipk_max: 1.99, sks_min: 12, sks_max: 16 },
          { ipk_min: 0.00, ipk_max: 1.49, sks_min: 2,  sks_max: 12 },
        ],
      },
      created_at: '',
      updated_at: '',
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

      const dedupedGrades = deduplicateRetakes(studentGrades)
      const passingPoints = rule.grade_scale[rule.passing_grade as GradeValue] ?? 0
      const sksLulus = dedupedGrades.filter((g) => g.grade_points >= passingPoints).reduce((s, g) => s + g.credits, 0)
      const totalWeighted = dedupedGrades.reduce((s, g) => s + g.grade_points * g.credits, 0)
      const totalCredits = dedupedGrades.reduce((s, g) => s + g.credits, 0)
      const ipk = totalCredits > 0 ? Math.round((totalWeighted / totalCredits) * 100) / 100 : 0
      const retakeCount = studentGrades.filter((g) => g.is_retake).length
      const currentSemester = student.current_semester ?? 1

      const status = calculateAcademicStatus(sksLulus, currentSemester, ipk, retakeCount, rule)
      counts[status]++
    }

    const data = [
      { status: 'ahead',          label: 'Unggul',           count: counts.ahead,          color: '#16a34a' },
      { status: 'on_track',       label: 'Sesuai Target',    count: counts.on_track,       color: '#2563eb' },
      { status: 'need_attention', label: 'Perlu Perhatian',  count: counts.need_attention, color: '#ca8a04' },
      { status: 'recovery_mode',  label: 'Butuh Pemulihan',  count: counts.recovery_mode,  color: '#ea580c' },
      { status: 'critical',       label: 'Darurat Akademik', count: counts.critical,       color: '#dc2626' },
    ]

    return NextResponse.json({ data, total: students.length, error: null, success: true })
  } catch (err) {
    console.error('[student-status] Unexpected error:', err)
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

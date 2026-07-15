import { createClient } from '@/lib/supabase/server'
import { calculateAcademicSummary } from '@/lib/utils/academic'
import type { AcademicRule, StudentGrade } from '@/types'

const DEFAULT_RULE: AcademicRule = {
  id: '', university_id: '', study_program_id: null,
  total_sks_graduation: 144, normal_semester: 8, max_semester: 14,
  min_gpa: 2.0, max_sks_per_semester: 24, min_sks_per_semester: 12,
  passing_grade: 'D',
  grade_scale: { A: 4.0, 'A-': 3.75, BA: 3.5, 'B+': 3.25, B: 3.0, 'B-': 2.75, C: 2.0, D: 1.0, E: 0.0 },
  created_at: '', updated_at: '',
}

export interface LecturerStudentSummary {
  student: {
    id: string
    full_name: string
    nim: string | null
    avatar_url: string | null
    current_semester: number | null
    email?: string
    phone?: string | null
    study_programs: { name: string; short_name: string | null } | null
  }
  summary: ReturnType<typeof calculateAcademicSummary>
}

export async function getLecturerStudentData(
  lecturerId: string,
  options?: { includeEmail?: boolean; includePhone?: boolean; searchQuery?: string }
): Promise<{
  studentIds: string[]
  studentSummaries: LecturerStudentSummary[]
  effectiveRule: AcademicRule
}> {
  const supabase = await createClient()

  const [profileRes, advisorRes] = await Promise.all([
    supabase.from('users').select('university_id').eq('id', lecturerId).single(),
    supabase.from('advisor_students').select('student_id').eq('lecturer_id', lecturerId),
  ])

  const universityId = profileRes.data?.university_id ?? null
  const studentIds = (advisorRes.data ?? []).map((r) => r.student_id)

  let students: LecturerStudentSummary['student'][] = []

  if (studentIds.length > 0) {
    const selectFields = [
      'id, full_name, nim, avatar_url, current_semester',
      'study_programs(name, short_name)',
      options?.includeEmail ? 'email' : '',
      options?.includePhone ? 'phone' : '',
    ].filter(Boolean).join(', ')

    let query = supabase
      .from('users')
      .select(selectFields)
      .in('id', studentIds)
      .eq('is_active', true)

    if (options?.searchQuery) {
      const safe = options.searchQuery.replace(/[,.()'"%]/g, '')
      query = query.or(`full_name.ilike.%${safe}%,nim.ilike.%${safe}%`)
    }

    const { data } = await query.order('full_name')
    students = (data ?? []).map((s) => {
      const row = s as unknown as Record<string, unknown>
      return {
        ...row,
        study_programs: Array.isArray(row.study_programs) ? row.study_programs[0] : row.study_programs,
      }
    }) as LecturerStudentSummary['student'][]
  }

  let defaultRule: AcademicRule | null = null
  if (universityId) {
    const [ruleRes] = await Promise.all([
      supabase
        .from('academic_rules')
        .select('*')
        .eq('university_id', universityId)
        .is('study_program_id', null)
        .single(),
    ])
    defaultRule = ruleRes.data
  }

  const effectiveRule: AcademicRule = defaultRule ?? DEFAULT_RULE

  const gradesByStudent = new Map<string, StudentGrade[]>()
  if (studentIds.length > 0) {
    const { data: allGrades } = await supabase
      .from('student_grades')
      .select('*')
      .in('student_id', studentIds)
    for (const g of allGrades ?? []) {
      const arr = gradesByStudent.get(g.student_id) ?? []
      arr.push(g as StudentGrade)
      gradesByStudent.set(g.student_id, arr)
    }
  }

  const studentSummaries: LecturerStudentSummary[] = students.map((s) => {
    const grades = gradesByStudent.get(s.id) ?? []
    const currentSemester = s.current_semester ?? 1
    const summary = calculateAcademicSummary(grades, currentSemester, effectiveRule.normal_semester, effectiveRule)
    return { student: s, summary }
  })

  return { studentIds, studentSummaries, effectiveRule }
}

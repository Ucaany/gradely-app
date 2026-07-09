import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { calculateAcademicSummary } from '@/lib/utils/academic'
import type { AcademicRule, StudentGrade, AcademicStatus } from '@/types'
import { RiskPageClient } from '@/components/lecturer/risk-page-client'

export default async function LecturerRiskPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('university_id')
    .eq('id', user.id)
    .single()

  const { data: advisorRows } = await supabase
    .from('advisor_students')
    .select('student_id')
    .eq('lecturer_id', user.id)

  const studentIds = (advisorRows ?? []).map((r) => r.student_id)

  let students: Array<{
    id: string
    full_name: string
    nim: string | null
    avatar_url: string | null
    current_semester: number | null
    study_programs: { name: string; short_name: string | null } | null
  }> = []

  if (studentIds.length > 0) {
    const { data } = await supabase
      .from('users')
      .select('id, full_name, nim, avatar_url, current_semester, study_programs(name, short_name)')
      .in('id', studentIds)
      .eq('is_active', true)
      .order('full_name')
    students = (data ?? []).map((s: Record<string, unknown>) => ({
      ...s,
      study_programs: Array.isArray(s.study_programs) ? s.study_programs[0] : s.study_programs,
    })) as typeof students
  }

  let defaultRule: AcademicRule | null = null
  if (profile?.university_id) {
    const { data } = await supabase
      .from('academic_rules')
      .select('*')
      .eq('university_id', profile.university_id)
      .is('study_program_id', null)
      .single()
    defaultRule = data
  }

  const effectiveRule: AcademicRule = defaultRule ?? {
    id: '', university_id: '', study_program_id: null,
    total_sks_graduation: 144, normal_semester: 8, max_semester: 14,
    min_gpa: 2.0, max_sks_per_semester: 24, min_sks_per_semester: 12,
    passing_grade: 'D',
    grade_scale: { A: 4.0, AB: 3.5, B: 3.0, BC: 2.5, C: 2.0, D: 1.0, E: 0.0 },
    created_at: '', updated_at: '',
  }

  const gradesByStudent = new Map<string, StudentGrade[]>()
  if (studentIds.length > 0) {
    const { data: allGrades } = await supabase
      .from('student_grades')
      .select('*')
      .in('student_id', studentIds)
    for (const g of (allGrades ?? [])) {
      const arr = gradesByStudent.get(g.student_id) ?? []
      arr.push(g as StudentGrade)
      gradesByStudent.set(g.student_id, arr)
    }
  }

  const studentSummaries = students.map((s) => {
    const grades = gradesByStudent.get(s.id) ?? []
    const currentSemester = s.current_semester ?? 1
    const summary = calculateAcademicSummary(grades, currentSemester, effectiveRule.normal_semester, effectiveRule)
    const riskIndicators = [
      { label: 'IPK di bawah minimum', active: summary.gpa < effectiveRule.min_gpa },
      { label: 'Ada MK mengulang', active: summary.courses_retake > 0 },
      { label: 'Progress SKS rendah', active: summary.sks_percentage < 70 },
      { label: 'Risiko terlambat lulus', active: summary.predicted_graduation_semester > effectiveRule.normal_semester },
    ]
    return { student: s, summary, riskIndicators }
  })

  const atRisk = studentSummaries.filter(
    ({ summary }) => summary.academic_status === 'recovery_mode' || summary.academic_status === 'critical'
  )
  const needAttention = studentSummaries.filter(
    ({ summary }) => summary.academic_status === 'need_attention'
  )
  const safe = studentSummaries.filter(
    ({ summary }) => (summary.academic_status as AcademicStatus) === 'ahead' || (summary.academic_status as AcademicStatus) === 'on_track'
  )

  const sections = [
    {
      title: 'Darurat & Pemulihan',
      items: atRisk,
      emptyMsg: 'Tidak ada mahasiswa darurat',
      colorClass: 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20',
    },
    {
      title: 'Perlu Perhatian',
      items: needAttention,
      emptyMsg: 'Tidak ada mahasiswa perlu perhatian',
      colorClass: 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-900 dark:bg-yellow-950/20',
    },
    {
      title: 'Aman',
      items: safe,
      emptyMsg: 'Belum ada data',
      colorClass: 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20',
    },
  ]

  return (
    <RiskPageClient
      sections={sections}
      totalStudents={studentIds.length}
      atRiskCount={atRisk.length}
    />
  )
}

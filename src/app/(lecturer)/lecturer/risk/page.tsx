import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { AcademicStatus } from '@/types'
import { RiskPageClient } from '@/components/lecturer/risk-page-client'
import { getLecturerStudentData } from '@/lib/utils/lecturer-data'

export default async function LecturerRiskPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { studentIds, studentSummaries, effectiveRule } = await getLecturerStudentData(user.id)

  const studentSummariesWithRisk = studentSummaries.map(({ student, summary }) => {
    const riskIndicators = [
      { label: 'IPK di bawah minimum', active: summary.gpa < effectiveRule.min_gpa },
      { label: 'Ada MK mengulang', active: summary.courses_retake > 0 },
      { label: 'Progress SKS rendah', active: summary.sks_percentage < 70 },
      { label: 'Risiko terlambat lulus', active: summary.predicted_graduation_semester > effectiveRule.normal_semester },
    ]
    return { student, summary, riskIndicators }
  })

  const atRisk = studentSummariesWithRisk.filter(
    ({ summary }) => summary.academic_status === 'recovery_mode' || summary.academic_status === 'critical'
  )
  const needAttention = studentSummariesWithRisk.filter(
    ({ summary }) => summary.academic_status === 'need_attention'
  )
  const safe = studentSummariesWithRisk.filter(
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

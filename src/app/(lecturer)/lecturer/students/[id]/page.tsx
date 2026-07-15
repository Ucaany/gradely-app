import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, AlertTriangle, CheckCircle2, BookOpen, TrendingUp, BarChart3, MessageSquare } from 'lucide-react'
import { getInitials, formatGPA, formatDate } from '@/lib/utils'
import {
  calculateAcademicSummary,
  groupGradesBySemester,
  ACADEMIC_STATUS_CONFIG,
  autoDetectSemester,
  DEFAULT_SKS_RULES_BY_IPK,
} from '@/lib/utils/academic'
import { StudentIPKChart } from '@/components/student/student-ipk-chart'
import { SendMessageDialog } from '@/components/lecturer/send-message-dialog'
import type { AcademicRule, StudentGrade } from '@/types'

export default async function LecturerStudentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: isBound } = await supabase
    .from('advisor_students')
    .select('id')
    .eq('lecturer_id', user.id)
    .eq('student_id', params.id)
    .single()

  if (!isBound) notFound()

  const [{ data: student }, { data: gradesRaw }, { data: lecturerProfile }] = await Promise.all([
    supabase
      .from('users')
      .select('id, full_name, nim, email, phone, avatar_url, current_semester, created_at, study_programs(name, short_name), universities(name)')
      .eq('id', params.id)
      .single(),
    supabase
      .from('student_grades')
      .select('*')
      .eq('student_id', params.id)
      .order('semester_number', { ascending: true }),
    supabase
      .from('users')
      .select('university_id')
      .eq('id', user.id)
      .single(),
  ])

  if (!student) notFound()

  const grades = (gradesRaw ?? []) as StudentGrade[]

  let defaultRule: AcademicRule | null = null
  if (lecturerProfile?.university_id) {
    const { data } = await supabase
      .from('academic_rules')
      .select('*')
      .eq('university_id', lecturerProfile.university_id)
      .is('study_program_id', null)
      .single()
    defaultRule = data
  }

  const effectiveRule: AcademicRule = defaultRule ?? {
    id: '', university_id: '', study_program_id: null,
    total_sks_graduation: 144, normal_semester: 8, max_semester: 14,
    min_gpa: 2.0, max_sks_per_semester: 24, min_sks_per_semester: 12,
    passing_grade: 'D',
    grade_scale: { A: 4.0, 'A-': 3.75, BA: 3.5, 'B+': 3.25, B: 3.0, 'B-': 2.75, C: 2.0, D: 1.0, E: 0.0 },
    sks_rules_by_ipk: DEFAULT_SKS_RULES_BY_IPK,
    created_at: '', updated_at: '',
  }

  // Auto-detect semester dari data nilai (semester tertinggi yang ada)
  const currentSemester = autoDetectSemester(grades, student.current_semester ?? 1)
  const summary = calculateAcademicSummary(grades, currentSemester, effectiveRule.normal_semester, effectiveRule)
  const semesterSummaries = groupGradesBySemester(grades)
  const cfg = ACADEMIC_STATUS_CONFIG[summary.academic_status]

  const chartData = semesterSummaries.map((s, idx) => {
    const gradesUpTo = semesterSummaries.slice(0, idx + 1).flatMap((x) => x.grades)
    const ipk = gradesUpTo.length > 0
      ? Math.round((gradesUpTo.reduce((a, g) => a + g.grade_points * g.credits, 0) / gradesUpTo.reduce((a, g) => a + g.credits, 0)) * 100) / 100
      : 0
    return { semester: `Sem ${s.semester_number}`, ips: s.gpa, ipk }
  })

  const studyProgramName = (student.study_programs && typeof student.study_programs === 'object' && !Array.isArray(student.study_programs))
    ? (student.study_programs as { name: string; short_name: string | null }).name
    : null

  const riskIndicators = [
    {
      label: 'IPK di bawah minimum',
      active: summary.gpa < effectiveRule.min_gpa,
      desc: `IPK ${formatGPA(summary.gpa)} < ${effectiveRule.min_gpa}`,
    },
    {
      label: 'Ada mata kuliah mengulang',
      active: summary.courses_retake > 0,
      desc: `${summary.courses_retake} MK mengulang`,
    },
    {
      label: 'Progress SKS rendah',
      active: summary.sks_percentage < 70,
      desc: `${summary.sks_percentage}% SKS terpenuhi`,
    },
    {
      label: 'Risiko tidak lulus tepat waktu',
      active: summary.predicted_graduation_semester > effectiveRule.normal_semester,
      desc: `Prediksi lulus Sem ${summary.predicted_graduation_semester}`,
    },
  ]

  const activeRisks = riskIndicators.filter((r) => r.active)

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
          <Link href="/lecturer/students">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Detail Mahasiswa</h1>
          <p className="text-sm text-muted-foreground">Histori nilai & status akademik</p>
        </div>
        <SendMessageDialog
          studentId={params.id}
          studentName={student.full_name}
          trigger={
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Kirim Pesan WA
            </Button>
          }
        />
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 shrink-0">
                <AvatarImage src={student.avatar_url ?? ''} />
                <AvatarFallback className="text-lg">{getInitials(student.full_name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg">{student.full_name}</CardTitle>
                  <Badge variant="outline" className={`text-xs ${cfg.color} border-current`}>
                    {cfg.label}
                  </Badge>
                </div>
                <CardDescription className="mt-1">{student.email}</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'NIM', value: student.nim ?? '-' },
              { label: 'Program Studi', value: studyProgramName ?? '-' },
              { label: 'Semester', value: String(currentSemester) },
              { label: 'Terdaftar', value: formatDate(student.created_at) },
            ].map((row) => (
              <div key={row.label} className="space-y-0.5">
                <p className="text-xs text-muted-foreground">{row.label}</p>
                <p className="text-sm font-medium">{row.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IPK</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatGPA(summary.gpa)}</div>
            <p className="text-xs text-muted-foreground mt-1">IPS Terakhir: {formatGPA(summary.last_gpa)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SKS Lulus</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.total_sks_earned}</div>
            <p className="text-xs text-muted-foreground mt-1">dari {summary.total_sks_required} SKS</p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${summary.sks_percentage}%` }} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MK Mengulang</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${summary.courses_retake > 0 ? 'text-orange-600 dark:text-orange-400' : ''}`}>
              {summary.courses_retake}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{summary.courses_passed} MK lulus</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prediksi Lulus</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Sem {summary.predicted_graduation_semester}</div>
            <p className="text-xs text-muted-foreground mt-1">Normal: Semester {effectiveRule.normal_semester}</p>
          </CardContent>
        </Card>
      </div>

      {/* Indikator Risiko */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {activeRisks.length > 0 && <AlertTriangle className="h-4 w-4 text-red-500" />}
            Indikator Risiko Akademik
          </CardTitle>
          <CardDescription>
            {activeRisks.length === 0 ? 'Tidak ada indikator risiko' : `${activeRisks.length} indikator bermasalah`}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {riskIndicators.map((r) => (
            <div
              key={r.label}
              className={`flex items-start gap-3 rounded-lg border p-3 ${
                r.active
                  ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30'
                  : 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30'
              }`}
            >
              {r.active
                ? <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                : <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              }
              <div>
                <p className={`text-sm font-medium ${r.active ? 'text-red-700 dark:text-red-400' : 'text-emerald-700 dark:text-emerald-400'}`}>
                  {r.label}
                </p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Batas SKS Semester Berikutnya */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-500" />
            Batas Pengambilan SKS Semester Berikutnya
          </CardTitle>
          <CardDescription>
            Berdasarkan IPK
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 px-4 py-3">
            {currentSemester <= 2 ? (
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Semester 1–2 menggunakan <span className="font-semibold">sistem paket</span>.
                Maks <span className="font-semibold">{effectiveRule.sks_rules_by_ipk?.semester_1_2_max ?? 20} SKS</span> per semester.
              </p>
            ) : (
              <div className="space-y-1">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  IPK mahasiswa: <span className="font-semibold">{formatGPA(summary.gpa)}</span>
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Boleh mengambil{' '}
                  <span className="font-bold text-base">{summary.allowed_sks_min}–{summary.allowed_sks_max} SKS</span>{' '}
                  di semester berikutnya.
                </p>
              </div>
            )}
          </div>

          {/* Tabel tier SKS lengkap */}
          {effectiveRule.sks_rules_by_ipk?.tiers && effectiveRule.sks_rules_by_ipk.tiers.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground font-medium mb-2">Tabel aturan lengkap (Sem 3+):</p>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Rentang IPK</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">SKS yang Diizinkan</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {effectiveRule.sks_rules_by_ipk.tiers.map((tier, i) => {
                      const isActive = summary.gpa >= tier.ipk_min && summary.gpa <= tier.ipk_max && currentSemester > 2
                      return (
                        <tr key={i} className={`${i < effectiveRule.sks_rules_by_ipk.tiers.length - 1 ? 'border-b' : ''} ${isActive ? 'bg-blue-50 dark:bg-blue-950/20' : ''}`}>
                          <td className="px-3 py-2 font-medium">{tier.ipk_min.toFixed(2)} – {tier.ipk_max.toFixed(2)}</td>
                          <td className="px-3 py-2">{tier.sks_min} – {tier.sks_max} SKS</td>
                          <td className="px-3 py-2">
                            {isActive && (
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                                Berlaku
                              </Badge>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grafik IPK/IPS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Grafik IPS & IPK</CardTitle>
          <CardDescription>IPS per semester (bar) dan IPK kumulatif (line)</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
              <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Belum ada data nilai</p>
            </div>
          ) : (
            <StudentIPKChart data={chartData} />
          )}
        </CardContent>
      </Card>

      {/* Histori Nilai Per Semester */}
      {semesterSummaries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histori Nilai per Semester</CardTitle>
            <CardDescription>{grades.length} mata kuliah</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {semesterSummaries.map((sem) => (
              <div key={sem.semester_number}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold">Semester {sem.semester_number}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>IPS: <span className="font-semibold text-foreground">{formatGPA(sem.gpa)}</span></span>
                    <span>SKS: <span className="font-semibold text-foreground">{sem.total_sks}</span></span>
                  </div>
                </div>
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Mata Kuliah</th>
                        <th className="text-center px-3 py-2 text-xs font-medium text-muted-foreground w-16">SKS</th>
                        <th className="text-center px-3 py-2 text-xs font-medium text-muted-foreground w-16">Nilai</th>
                        <th className="text-center px-3 py-2 text-xs font-medium text-muted-foreground w-16">Bobot</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sem.grades.map((g, i) => (
                        <tr key={g.id} className={i < sem.grades.length - 1 ? 'border-b' : ''}>
                          <td className="px-3 py-2">
                            <span className="font-medium">{g.course_name}</span>
                            {g.is_retake && (
                              <Badge variant="outline" className="ml-2 text-xs text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-950 dark:text-orange-400 py-0">
                                Ulang
                              </Badge>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">{g.credits}</td>
                          <td className="px-3 py-2 text-center font-semibold">{g.grade}</td>
                          <td className="px-3 py-2 text-center text-muted-foreground">{g.grade_points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

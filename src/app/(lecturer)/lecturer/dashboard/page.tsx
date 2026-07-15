import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  QrCode,
  TrendingUp,
} from 'lucide-react'
import { getInitials, formatGPA } from '@/lib/utils'
import { calculateAcademicSummary, ACADEMIC_STATUS_CONFIG } from '@/lib/utils/academic'
import type { AcademicRule, StudentGrade, AcademicStatus } from '@/types'
import { LecturerStatusChart } from '@/components/lecturer/lecturer-status-chart'
import { SendMessageDialog } from '@/components/lecturer/send-message-dialog'

export default async function LecturerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, university_id, study_program_id, join_code')
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
    grade_scale: { A: 4.0, 'A-': 3.75, BA: 3.5, 'B+': 3.25, B: 3.0, 'B-': 2.75, C: 2.0, D: 1.0, E: 0.0 },
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
    return { student: s, summary }
  })

  const statusCounts: Record<AcademicStatus, number> = { ahead: 0, on_track: 0, need_attention: 0, recovery_mode: 0, critical: 0 }
  for (const { summary } of studentSummaries) {
    statusCounts[summary.academic_status]++
  }

  const atRisk = studentSummaries.filter(
    ({ summary }) => summary.academic_status === 'recovery_mode' || summary.academic_status === 'critical'
  )

  const joinCode = profile?.join_code ?? null

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Halo, {profile?.full_name?.split(' ')[0] ?? 'Dosen'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Dashboard Dosen Wali · {studentIds.length} mahasiswa bimbingan
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mahasiswa</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{studentIds.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Mahasiswa bimbingan aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aman</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
              {statusCounts.ahead + statusCounts.on_track}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Unggul + Sesuai Target</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perhatian</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {statusCounts.need_attention + statusCounts.recovery_mode}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Perlu Perhatian + Pemulihan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kritis</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 dark:text-red-400">
              {statusCounts.critical}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Darurat akademik</p>
          </CardContent>
        </Card>
      </div>

      {/* Distribusi Status — Pie Chart */}
      {studentIds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribusi Status Akademik</CardTitle>
            <CardDescription>Berdasarkan {studentIds.length} mahasiswa bimbingan</CardDescription>
          </CardHeader>
          <CardContent>
            <LecturerStatusChart counts={statusCounts} total={studentIds.length} />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Mahasiswa Berisiko */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {atRisk.length > 0 && <AlertTriangle className="h-4 w-4 text-red-500" />}
                  Mahasiswa Berisiko
                </CardTitle>
                <CardDescription>
                  {atRisk.length === 0 ? 'Tidak ada mahasiswa berisiko' : `${atRisk.length} mahasiswa butuh perhatian segera`}
                </CardDescription>
              </div>
              {atRisk.length > 0 && (
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/lecturer/risk">
                    Lihat Semua <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {atRisk.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-500/40" />
                <p className="text-sm text-muted-foreground">Semua mahasiswa dalam kondisi baik</p>
              </div>
            ) : (
              <div className="space-y-3">
                {atRisk.slice(0, 5).map(({ student, summary }) => {
                  const cfg = ACADEMIC_STATUS_CONFIG[summary.academic_status]
                  const prog = (student.study_programs && typeof student.study_programs === 'object' && !Array.isArray(student.study_programs))
                    ? (student.study_programs as { name: string; short_name: string | null }).short_name ?? (student.study_programs as { name: string }).name
                    : null
                  return (
                    <div key={student.id} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={student.avatar_url ?? ''} />
                        <AvatarFallback className="text-xs">{getInitials(student.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{student.full_name}</p>
                        <p className="text-xs text-muted-foreground">{student.nim ?? '-'} · {prog ?? 'Sem'} {student.current_semester}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className={`text-xs ${cfg.color} border-current`}>
                          {cfg.label}
                        </Badge>
                        <SendMessageDialog studentId={student.id} studentName={student.full_name} trigger={
                          <Button variant="ghost" size="sm" className="h-7 px-2" title="Kirim pesan WA">
                            <span className="text-xs">WA</span>
                          </Button>
                        } />
                        <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                          <Link href={`/lecturer/students/${student.id}`}>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Aksi Cepat + Kode Bergabung */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aksi Cepat</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {[
                { label: 'Semua Mahasiswa', href: '/lecturer/students', icon: Users, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400', desc: 'Lihat daftar bimbingan' },
                { label: 'Monitoring Risiko', href: '/lecturer/risk', icon: AlertTriangle, color: 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400', desc: 'Pantau mahasiswa berisiko' },
                { label: 'Kode Bergabung', href: '/lecturer/join-code', icon: QrCode, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400', desc: 'Generate & bagikan kode' },
                { label: 'Rekap IPK', href: '/lecturer/students', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400', desc: 'Distribusi IPK mahasiswa' },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="group flex flex-col gap-2 rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <div className="flex items-center justify-between">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-md ${action.color}`}>
                      <action.icon className="h-4 w-4" />
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div>
                    <p className="text-sm font-medium leading-tight">{action.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{action.desc}</p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {joinCode && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-violet-500" />
                  Kode Bergabung Aktif
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-muted px-4 py-3 text-center">
                  <p className="text-2xl font-mono font-bold tracking-widest">{joinCode}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Bagikan kode ini ke mahasiswa agar terhubung ke bimbingan Anda
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Daftar semua mahasiswa preview */}
      {studentSummaries.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Mahasiswa Bimbingan</CardTitle>
                <CardDescription>{studentSummaries.length} mahasiswa</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/lecturer/students">
                  Lihat Semua <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            {studentSummaries.slice(0, 5).map(({ student, summary }, i) => {
              const cfg = ACADEMIC_STATUS_CONFIG[summary.academic_status]
              const prog = (student.study_programs && typeof student.study_programs === 'object' && !Array.isArray(student.study_programs))
                ? (student.study_programs as { name: string; short_name: string | null }).short_name ?? (student.study_programs as { name: string }).name
                : null
              return (
                <div key={student.id}>
                  {i > 0 && <div className="mx-6 border-t" />}
                  <div className="flex items-center gap-3 px-6 py-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={student.avatar_url ?? ''} />
                      <AvatarFallback className="text-xs">{getInitials(student.full_name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{student.full_name}</p>
                      <p className="text-xs text-muted-foreground">{student.nim ?? '-'} · {prog} · Sem {student.current_semester}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-semibold tabular-nums">{formatGPA(summary.gpa)}</span>
                      <Badge variant="outline" className={`text-xs hidden sm:inline-flex ${cfg.color} border-current`}>
                        {cfg.label}
                      </Badge>
                      <SendMessageDialog studentId={student.id} studentName={student.full_name} trigger={
                        <Button variant="ghost" size="sm" className="h-7 px-2 hidden sm:inline-flex" title="Kirim pesan WA">
                          <span className="text-xs">WA</span>
                        </Button>
                      } />
                      <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                        <Link href={`/lecturer/students/${student.id}`}>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {studentIds.length === 0 && (
        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-8 flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-semibold">Belum ada mahasiswa bimbingan</p>
            <p className="text-xs text-muted-foreground mt-1">
              Buat kode bergabung dan bagikan ke mahasiswa agar mereka dapat terhubung ke bimbingan Anda.
            </p>
          </div>
          <Button size="sm" asChild>
            <Link href="/lecturer/join-code">Buat Kode Bergabung</Link>
          </Button>
        </div>
      )}
    </div>
  )
}

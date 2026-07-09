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
import { Progress } from '@/components/ui/progress'
import {
  BookOpen,
  Target,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  GraduationCap,
  BarChart3,
} from 'lucide-react'
import {
  calculateAcademicSummary,
  groupGradesBySemester,
  ACADEMIC_STATUS_CONFIG,
} from '@/lib/utils/academic'
import { formatGPA } from '@/lib/utils'
import type { AcademicRule, StudentGrade } from '@/types'

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, gradesRes, targetRes] = await Promise.all([
    supabase
      .from('users')
      .select('full_name, nim, current_semester, study_program_id, university_id, study_programs(name, short_name)')
      .eq('id', user.id)
      .single(),
    supabase
      .from('student_grades')
      .select('*')
      .eq('student_id', user.id)
      .order('semester_number', { ascending: true }),
    supabase
      .from('student_targets')
      .select('*')
      .eq('student_id', user.id)
      .single(),
  ])

  const profile = profileRes.data
  const grades = (gradesRes.data ?? []) as StudentGrade[]
  const target = targetRes.data

  // Ambil academic rules
  let rule: AcademicRule | null = null
  if (profile?.university_id) {
    if (profile.study_program_id) {
      const { data: specific } = await supabase
        .from('academic_rules')
        .select('*')
        .eq('university_id', profile.university_id)
        .eq('study_program_id', profile.study_program_id)
        .single()
      rule = specific
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

  const effectiveRule: AcademicRule = rule ?? {
    id: '',
    university_id: profile?.university_id ?? '',
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

  const currentSemester = profile?.current_semester ?? 1
  const targetSemester = target?.target_semester ?? effectiveRule.normal_semester
  const summary = calculateAcademicSummary(grades, currentSemester, targetSemester, effectiveRule)
  const semesterSummaries = groupGradesBySemester(grades)
  const statusConfig = ACADEMIC_STATUS_CONFIG[summary.academic_status]

  const retakeCourses = grades.filter((g) => g.is_retake)
  const studyProgramName =
    profile?.study_programs && typeof profile.study_programs === 'object' && !Array.isArray(profile.study_programs)
      ? (profile.study_programs as { name: string; short_name: string | null }).name
      : null

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Halo, {profile?.full_name?.split(' ')[0] ?? 'Mahasiswa'} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          {studyProgramName ?? 'Program Studi'} · NIM {profile?.nim ?? '-'} · Semester {currentSemester}
        </p>
      </div>

      {/* Status Akademik Banner */}
      <div className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${statusConfig.bgColor}`}>
        <span className="text-xl">{statusConfig.emoji}</span>
        <div>
          <p className={`font-semibold text-sm ${statusConfig.color}`}>Status Akademik: {statusConfig.label}</p>
          <p className="text-xs text-muted-foreground">
            {summary.academic_status === 'ahead' && 'Progres SKS kamu melebihi target. Pertahankan!'}
            {summary.academic_status === 'on_track' && 'Progres kamu sesuai target. Terus semangat!'}
            {summary.academic_status === 'need_attention' && 'Progres sedikit di bawah target. Perlu ditingkatkan.'}
            {summary.academic_status === 'recovery_mode' && 'Progres jauh di bawah target. Segera konsultasi dosen wali.'}
            {summary.academic_status === 'critical' && 'Risiko tidak lulus tepat waktu. Segera hubungi dosen wali.'}
          </p>
        </div>
      </div>

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
            <Progress value={summary.sks_percentage} className="mt-2 h-1.5" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MK Lulus</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.courses_passed}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.courses_retake > 0
                ? `${summary.courses_retake} MK mengulang`
                : 'Tidak ada MK mengulang'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prediksi Lulus</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">Sem {summary.predicted_graduation_semester}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Target: Semester {targetSemester}
              {summary.predicted_graduation_semester <= targetSemester ? ' ✅' : ' ⚠️'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress SKS + Semester */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progress SKS</CardTitle>
            <CardDescription>
              {summary.total_sks_earned} / {summary.total_sks_required} SKS ({summary.sks_percentage}%)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={summary.sks_percentage} className="h-3" />
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-muted-foreground text-xs">SKS Lulus</p>
                <p className="font-semibold text-lg">{summary.total_sks_earned}</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-muted-foreground text-xs">SKS Tersisa</p>
                <p className="font-semibold text-lg">{summary.total_sks_required - summary.total_sks_earned}</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-muted-foreground text-xs">Rata-rata SKS/Sem</p>
                <p className="font-semibold text-lg">
                  {currentSemester > 0
                    ? Math.round(summary.total_sks_earned / currentSemester)
                    : 0}
                </p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-muted-foreground text-xs">SKS Butuh/Sem</p>
                <p className="font-semibold text-lg">
                  {targetSemester > currentSemester
                    ? Math.ceil((summary.total_sks_required - summary.total_sks_earned) / (targetSemester - currentSemester))
                    : '-'}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/student/target">
                Atur Target Kelulusan
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">IPS per Semester</CardTitle>
            <CardDescription>Indeks Prestasi Semester historis</CardDescription>
          </CardHeader>
          <CardContent>
            {semesterSummaries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Belum ada data nilai</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/student/grades">Input Nilai Pertama</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {semesterSummaries.map((sem) => (
                  <div key={sem.semester_number} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-16 shrink-0">Sem {sem.semester_number}</span>
                    <div className="flex-1">
                      <Progress value={(sem.gpa / 4) * 100} className="h-2" />
                    </div>
                    <span className="text-xs font-medium w-10 text-right">{formatGPA(sem.gpa)}</span>
                    <span className="text-xs text-muted-foreground w-16 text-right">{sem.total_sks} SKS</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Aksi Cepat + MK Mengulang */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {[
              { label: 'Input Nilai Baru', href: '/student/grades', desc: 'Tambah nilai mata kuliah' },
              { label: 'Lihat Semua Nilai', href: '/student/grades', desc: 'Riwayat nilai per semester' },
              { label: 'Target Kelulusan', href: '/student/target', desc: 'Atur & pantau target lulus' },
              { label: 'Portofolio', href: '/student/portfolio', desc: 'Kelola portofolio kamu' },
            ].map((action) => (
              <Button key={action.href + action.label} variant="outline" className="h-auto w-full justify-between px-4 py-3" asChild>
                <Link href={action.href}>
                  <div className="text-left">
                    <div className="text-sm font-medium">{action.label}</div>
                    <div className="text-xs text-muted-foreground">{action.desc}</div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {retakeCourses.length > 0 && <AlertCircle className="h-4 w-4 text-orange-500" />}
              Mata Kuliah Mengulang
            </CardTitle>
            <CardDescription>
              {retakeCourses.length === 0 ? 'Tidak ada MK yang perlu diulang' : `${retakeCourses.length} MK mengulang`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {retakeCourses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                <GraduationCap className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Semua nilai sudah baik</p>
              </div>
            ) : (
              <div className="space-y-2">
                {retakeCourses.slice(0, 5).map((g) => (
                  <div key={g.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{g.course_name}</p>
                      <p className="text-xs text-muted-foreground">Semester {g.semester_number} · {g.credits} SKS</p>
                    </div>
                    <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-950 dark:text-orange-400">
                      {g.grade}
                    </Badge>
                  </div>
                ))}
                {retakeCourses.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">+{retakeCourses.length - 5} lainnya</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

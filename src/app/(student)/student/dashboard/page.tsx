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
import {
  BookOpen,
  Target,
  TrendingUp,
  ArrowRight,
  AlertCircle,
  GraduationCap,
  BarChart3,
  Plus,
  FileUp,
  CheckCircle2,
  AlertTriangle,
  Briefcase,
  ClipboardList,
  Code2,
  Sparkles,
} from 'lucide-react'
import {
  calculateAcademicSummary,
  groupGradesBySemester,
} from '@/lib/utils/academic'
import { formatGPA } from '@/lib/utils'
import type { AcademicRule, StudentGrade } from '@/types'
import { StudentIPKChart } from '@/components/student/student-ipk-chart'
import { StudentSKSChart } from '@/components/student/student-sks-chart'
import { StudentTargetChart } from '@/components/student/student-target-chart'

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, gradesRes, targetRes, latestAnalysisRes] = await Promise.all([
    supabase
      .from('users')
      .select('full_name, nim, current_semester, study_program_id, university_id, onboarding_completed, study_programs(name, short_name)')
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
    supabase
      .from('student_target_analyses')
      .select('id, target_semester, target_ipk, target_years, analysis, created_at')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const profile = profileRes.data
  const grades = (gradesRes.data ?? []) as StudentGrade[]
  const target = targetRes.data
  const latestAnalysis = latestAnalysisRes.data

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
    grade_scale: { A: 4.0, 'A-': 3.75, BA: 3.5, 'B+': 3.25, B: 3.0, 'B-': 2.75, C: 2.0, D: 1.0, E: 0.0 },
    sks_rules_by_ipk: { semester_1_2_max: 20, tiers: [{ ipk_min: 3.00, ipk_max: 4.00, sks_min: 22, sks_max: 24 }, { ipk_min: 2.50, ipk_max: 2.99, sks_min: 20, sks_max: 22 }, { ipk_min: 2.00, ipk_max: 2.49, sks_min: 16, sks_max: 20 }, { ipk_min: 1.50, ipk_max: 1.99, sks_min: 12, sks_max: 16 }, { ipk_min: 0.00, ipk_max: 1.49, sks_min: 2, sks_max: 12 }] },
    created_at: '',
    updated_at: '',
  }

  const currentSemester = profile?.current_semester ?? 1
  const targetSemester = target?.target_semester ?? effectiveRule.normal_semester
  const summary = calculateAcademicSummary(grades, currentSemester, targetSemester, effectiveRule)
  const semesterSummaries = groupGradesBySemester(grades)

  const retakeCourses = grades.filter((g) => g.is_retake)
  const studyProgramName =
    profile?.study_programs && typeof profile.study_programs === 'object' && !Array.isArray(profile.study_programs)
      ? (profile.study_programs as { name: string; short_name: string | null }).name
      : null

  const chartData = semesterSummaries.map((s, idx) => {
    const gradesUpToNow = semesterSummaries
      .slice(0, idx + 1)
      .flatMap((x) => x.grades)
    const ipk = gradesUpToNow.length > 0
      ? Math.round(
          (gradesUpToNow.reduce((sum, g) => sum + g.grade_points * g.credits, 0) /
            gradesUpToNow.reduce((sum, g) => sum + g.credits, 0)) * 100
        ) / 100
      : 0
    return {
      semester: `Sem ${s.semester_number}`,
      ips: s.gpa,
      ipk,
    }
  })

  // Build target chart data: actual semesters + projected future semesters toward target
  const sksPerSemRemaining = targetSemester > currentSemester
    ? Math.ceil((summary.total_sks_required - summary.total_sks_earned) / (targetSemester - currentSemester))
    : 0
  const targetIPSPerSem = target?.target_ipk
    ? Math.min(target.target_ipk + 0.1, 4.0)
    : null

  const targetChartData = (() => {
    const points = semesterSummaries.map((s, idx) => {
      const gradesUpTo = semesterSummaries.slice(0, idx + 1).flatMap((x) => x.grades)
      const ipk = gradesUpTo.length > 0
        ? Math.round((gradesUpTo.reduce((a, g) => a + g.grade_points * g.credits, 0) / gradesUpTo.reduce((a, g) => a + g.credits, 0)) * 100) / 100
        : 0
      return { semester: `Sem ${s.semester_number}`, ips: s.gpa, ipk, is_actual: true }
    })
    // Add projected semesters
    if (targetSemester > currentSemester) {
      const totalSksNow = summary.total_sks_earned
      const totalWtNow = grades.reduce((a, g) => a + g.grade_points * g.credits, 0)
      let runningWt = totalWtNow
      let runningCredits = totalSksNow
      for (let sem = currentSemester + 1; sem <= targetSemester; sem++) {
        const projIPS = targetIPSPerSem ?? (summary.last_gpa > 0 ? summary.last_gpa : 2.75)
        const projSKS = sksPerSemRemaining > 0 ? sksPerSemRemaining : (effectiveRule.total_sks_graduation / effectiveRule.normal_semester)
        runningWt += projIPS * projSKS
        runningCredits += projSKS
        const projIPK = Math.round((runningWt / runningCredits) * 100) / 100
        points.push({
          semester: `Sem ${sem}`,
          ips: projIPS,
          ipk: Math.min(projIPK, 4.0),
          is_actual: false,
        })
      }
    }
    return points
  })()

  const quickActions = [
    {
      label: 'Input Nilai Baru',
      href: '/student/grades',
      desc: 'Tambah nilai mata kuliah',
      icon: Plus,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      label: 'Import KHS',
      href: '/student/grades/import',
      desc: 'Upload dokumen KHS',
      icon: FileUp,
      color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400',
    },
    {
      label: 'Target Kelulusan',
      href: '/student/target',
      desc: 'Atur & pantau target lulus',
      icon: Target,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400',
    },
    {
      label: 'Lihat Semua Nilai',
      href: '/student/grades',
      desc: 'Riwayat nilai per semester',
      icon: ClipboardList,
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400',
    },
    {
      label: 'Portofolio',
      href: '/student/portfolio',
      desc: 'Kelola portofolio kamu',
      icon: Briefcase,
      color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/40 dark:text-pink-400',
    },
    {
      label: 'Nilai Akademik',
      href: '/student/grades',
      desc: 'Detail transkrip nilai',
      icon: BookOpen,
      color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40 dark:text-teal-400',
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Halo, {profile?.full_name?.split(' ')[0] ?? 'Mahasiswa'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {studyProgramName ?? 'Program Studi'} · NIM {profile?.nim ?? '-'} · Semester {currentSemester}
        </p>
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
            <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${summary.sks_percentage}%` }} />
            </div>
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
              {summary.predicted_graduation_semester <= targetSemester ? (
                <CheckCircle2 className="inline ml-1 h-3 w-3 text-emerald-500" />
              ) : (
                <AlertTriangle className="inline ml-1 h-3 w-3 text-yellow-500" />
              )}
            </p>
            {target?.target_ipk && (
              <p className="text-xs text-muted-foreground mt-0.5">Target IPK: {target.target_ipk.toFixed(2)}</p>
            )}
            {target?.target_years && (
              <p className="text-xs text-muted-foreground mt-0.5">Target: {target.target_years} tahun</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Target Progress Chart — shown when target is set */}
      {target && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Progress & Target Kelulusan</CardTitle>
                <CardDescription>
                  Target lulus Semester {target.target_semester}
                  {target.target_ipk && ` dengan IPK ${target.target_ipk.toFixed(2)}`}
                  {target.target_years && ` (${target.target_years} tahun)`}
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/student/target">
                  <Target className="h-3.5 w-3.5 mr-1.5" />
                  Ubah Target
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {targetChartData.length > 0 ? (
              <StudentTargetChart data={targetChartData} targetIPK={target.target_ipk} minGpa={effectiveRule.min_gpa} />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                <Target className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Belum ada data untuk visualisasi target</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ringkasan analisis terbaru */}
      {latestAnalysis && (() => {
        const s = latestAnalysis.analysis?.status
        const statusCfg = s === 'aman'
          ? { label: 'Aman', color: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', pct: 85 }
          : s === 'perlu_usaha'
          ? { label: 'Perlu Usaha', color: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', pct: 50 }
          : { label: 'Perlu Perhatian', color: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500', pct: 25 }

        const metrics = [
          { label: 'SKS/Sem', value: latestAnalysis.analysis?.sks_per_semester_dibutuhkan ?? '-', unit: latestAnalysis.analysis?.sks_per_semester_dibutuhkan ? 'SKS' : '' },
          { label: 'IPK Min', value: latestAnalysis.analysis?.ipk_minimal_per_semester != null ? Number(latestAnalysis.analysis.ipk_minimal_per_semester).toFixed(2) : '-', unit: '' },
          { label: 'Target IPS', value: latestAnalysis.analysis?.ips_target_semester_depan != null ? Number(latestAnalysis.analysis.ips_target_semester_depan).toFixed(2) : '-', unit: '' },
        ]

        return (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Analisis Target Kelulusan</CardTitle>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/student/target/history">
                    Detail <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status + progress */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${statusCfg.dot}`} />
                  <span className={`text-sm font-semibold ${statusCfg.color}`}>{statusCfg.label}</span>
                </div>
                <div className="flex-1">
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${statusCfg.dot}`}
                      style={{ width: `${statusCfg.pct}%` }}
                    />
                  </div>
                </div>
                <span className={`text-sm font-bold shrink-0 ${statusCfg.color}`}>{statusCfg.pct}%</span>
              </div>

              {/* 3 metrik */}
              <div className="grid grid-cols-3 gap-2">
                {metrics.map(({ label, value, unit }) => (
                  <div key={label} className="rounded-xl bg-muted/50 px-3 py-2.5 text-center">
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className="text-lg font-bold leading-none">{value}
                      <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>
                    </p>
                  </div>
                ))}
              </div>

              {/* Satu saran singkat */}
              {latestAnalysis.analysis?.rekomendasi?.[0] && (
                <div className="flex items-start gap-2.5 rounded-xl bg-primary/5 px-4 py-3">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {latestAnalysis.analysis.rekomendasi[0]}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })()}

      {/* Prompt to set target when not set */}
      {!target && (
        <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Target className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Atur Target Kelulusanmu</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Dapatkan analisis AI, rekomendasi personal, dan visualisasi progress menuju target kelulusan kamu.
            </p>
          </div>
          <Button size="sm" asChild>
            <Link href="/student/target">Atur Target</Link>
          </Button>
        </div>
      )}

      {/* Target info: skill & industri */}
      {target && (target.achievement_skills?.length || target.achievement_internship) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {target.achievement_skills && target.achievement_skills.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-primary" />
                  Skill Target
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1.5">
                  {target.achievement_skills.map((s: string) => (
                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {target.achievement_internship && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Target Pengalaman
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground">{target.achievement_internship}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Chart IPS + Progress SKS */}
      <div className="grid gap-4 lg:grid-cols-2">
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
                <Button variant="outline" size="sm" asChild>
                  <Link href="/student/grades">Input Nilai Pertama</Link>
                </Button>
              </div>
            ) : (
              <StudentIPKChart data={chartData} minGpa={effectiveRule.min_gpa} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progress SKS</CardTitle>
            <CardDescription>
              {summary.total_sks_earned} / {summary.total_sks_required} SKS ({summary.sks_percentage}%)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <StudentSKSChart
              earned={summary.total_sks_earned}
              required={summary.total_sks_required}
              percentage={summary.sks_percentage}
            />
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-muted/60 px-3 py-2.5 flex flex-col gap-0.5">
                <p className="text-muted-foreground text-xs">Rata-rata SKS/Sem</p>
                <p className="font-semibold text-base tabular-nums">
                  {currentSemester > 0 ? Math.round(summary.total_sks_earned / currentSemester) : 0}
                  <span className="text-xs font-normal text-muted-foreground ml-1">SKS</span>
                </p>
              </div>
              <div className="rounded-lg bg-muted/60 px-3 py-2.5 flex flex-col gap-0.5">
                <p className="text-muted-foreground text-xs">SKS Butuh/Sem</p>
                <p className="font-semibold text-base tabular-nums">
                  {targetSemester > currentSemester
                    ? Math.ceil((summary.total_sks_required - summary.total_sks_earned) / (targetSemester - currentSemester))
                    : '-'}
                  {targetSemester > currentSemester && <span className="text-xs font-normal text-muted-foreground ml-1">SKS</span>}
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
      </div>

      {/* Aksi Cepat + MK Mengulang */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aksi Cepat</CardTitle>
            <CardDescription>Pintasan ke fitur yang sering digunakan</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
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

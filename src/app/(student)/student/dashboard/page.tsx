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
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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
  Code2,
  Sparkles,
  Info,
  Calendar,
  Award,
} from 'lucide-react'
import {
  calculateAcademicSummary,
  groupGradesBySemester,
  autoDetectSemester,
} from '@/lib/utils/academic'
import { formatGPA } from '@/lib/utils'
import type { AcademicRule, StudentGrade } from '@/types'
import { StudentIPKChart } from '@/components/student/student-ipk-chart'
import { StudentTargetChart } from '@/components/student/student-target-chart'

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileRes, gradesRes, targetRes, latestAnalysisRes, careerRes] = await Promise.all([
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
    supabase
      .from('career_interests')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', user.id),
  ])

  const profile = profileRes.data
  const grades = (gradesRes.data ?? []) as StudentGrade[]
  const target = targetRes.data
  const latestAnalysis = latestAnalysisRes.data

  // Cek apakah mahasiswa sudah mengisi minat karier dan target industri
  const hasCareerInterests = (careerRes.count ?? 0) > 0
  const hasTargetIndustries = (target?.target_industries?.length ?? 0) > 0
  const needsOnboarding = !hasCareerInterests || !hasTargetIndustries

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
    sks_rules_by_ipk: { enabled: true, semester_1_2_max: 20, tiers: [{ ipk_min: 3.00, ipk_max: 4.00, sks_min: 22, sks_max: 24 }, { ipk_min: 2.50, ipk_max: 2.99, sks_min: 20, sks_max: 22 }, { ipk_min: 2.00, ipk_max: 2.49, sks_min: 16, sks_max: 20 }, { ipk_min: 1.50, ipk_max: 1.99, sks_min: 12, sks_max: 16 }, { ipk_min: 0.00, ipk_max: 1.49, sks_min: 2, sks_max: 12 }] },
    created_at: '',
    updated_at: '',
  }

  // Auto-detect semester dari data nilai (semester tertinggi yang ada)
  const currentSemester = autoDetectSemester(grades, profile?.current_semester ?? 1)
  const targetSemester = target?.target_semester ?? effectiveRule.normal_semester
  const summary = calculateAcademicSummary(grades, currentSemester, targetSemester, effectiveRule)
  const semesterSummaries = groupGradesBySemester(grades)

  // MK yang perlu diulang: sudah ditandai is_retake ATAU nilainya di bawah passing grade (Opsi B)
  const passingGradePoints = effectiveRule.passing_grade
    ? (effectiveRule.grade_scale?.[effectiveRule.passing_grade] ?? 1.0)
    : 1.0
  const needsRetakeDisplay = grades.filter(
    (g) => g.is_retake || g.grade_points < passingGradePoints
  )

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
      desc: 'Tambah nilai mata kuliah baru',
      icon: Plus,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400',
    },
    {
      label: 'Import KHS',
      href: '/student/grades/import',
      desc: 'Upload foto Kartu Hasil Studi',
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
      label: 'Tambah Portofolio',
      href: '/student/portfolio/new',
      desc: 'Tambah proyek ke portofolio',
      icon: Briefcase,
      color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/40 dark:text-pink-400',
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      {/* Banner onboarding belum selesai */}
      {needsOnboarding && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Profil karier belum lengkap</p>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">
              {!hasCareerInterests && !hasTargetIndustries
                ? 'Kamu belum memilih minat karier dan industri. Lengkapi untuk mendapatkan rekomendasi perusahaan mitra yang sesuai.'
                : !hasCareerInterests
                ? 'Kamu belum memilih minat karier. Lengkapi untuk rekomendasi yang lebih akurat.'
                : 'Kamu belum memilih industri yang diminati. Lengkapi untuk rekomendasi perusahaan mitra.'}
            </p>
          </div>
          <Link href="/student/onboarding">
            <Button size="sm" variant="outline" className="shrink-0 text-xs border-amber-400 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-900/40">
              Lengkapi Sekarang
            </Button>
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Halo, {profile?.full_name?.split(' ')[0] ?? 'Mahasiswa'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {studyProgramName ?? 'Program Studi'} · NIM {profile?.nim ?? '-'} · Semester {currentSemester}
        </p>
      </div>

      {/* Batas SKS semester berikutnya */}
      <div className="rounded-xl border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 px-4 py-3 flex items-start gap-3">
        <BookOpen className="h-4 w-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Batas SKS Semester Berikutnya</p>
          {currentSemester <= 2 ? (
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-0.5">
              Semester 1–2 menggunakan sistem paket. Maks <span className="font-semibold">{effectiveRule.sks_rules_by_ipk?.semester_1_2_max ?? 20} SKS</span>.
            </p>
          ) : (
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-0.5">
              IPS terakhir kamu <span className="font-semibold">{formatGPA(summary.last_gpa)}</span> — kamu boleh mengambil{' '}
              <span className="font-semibold">{summary.allowed_sks_min}–{summary.allowed_sks_max} SKS</span> di semester berikutnya.
            </p>
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <TooltipProvider>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* IPK */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-sm font-medium">IPK</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-xs">
                    <p><strong>Indeks Prestasi Kumulatif</strong> — rata-rata nilai berbobot SKS dari seluruh semester yang sudah ditempuh.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatGPA(summary.gpa)}</div>
              <div className="flex items-center gap-1 mt-1">
                <p className="text-xs text-muted-foreground">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help underline decoration-dotted">IPS</span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[220px] text-xs">
                      <p><strong>Indeks Prestasi Semester</strong> — nilai rata-rata hanya untuk semester terakhir yang ditempuh.</p>
                    </TooltipContent>
                  </Tooltip>
                  {' '}Terakhir: {formatGPA(summary.last_gpa)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Mata Kuliah Lulus */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-sm font-medium">Mata Kuliah Lulus</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[220px] text-xs">
                    <p>Jumlah mata kuliah yang sudah lulus dengan nilai memenuhi batas kelulusan yang ditetapkan.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{summary.courses_passed}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.courses_retake > 0
                  ? `${summary.courses_retake} mata kuliah perlu diulang`
                  : 'Tidak ada mata kuliah mengulang'}
              </p>
            </CardContent>
          </Card>

          {/* Prediksi Lulus */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-1.5">
                <CardTitle className="text-sm font-medium">Prediksi Lulus</CardTitle>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[240px] text-xs">
                    <p>Estimasi semester kelulusan berdasarkan rata-rata <strong>SKS</strong> (Satuan Kredit Semester) yang ditempuh per semester saat ini.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">Sem {summary.predicted_graduation_semester}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                Target: Semester {targetSemester}
                {summary.predicted_graduation_semester <= targetSemester ? (
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                )}
              </p>
              {target?.target_ipk && (
                <p className="text-xs text-muted-foreground mt-0.5">Target IPK: {target.target_ipk.toFixed(2)}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </TooltipProvider>

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

      {/* Ringkasan analisis terbaru — medium detail */}
      {latestAnalysis && (() => {
        const s = latestAnalysis.analysis?.status
        const statusCfg = s === 'aman'
          ? { label: 'Aman', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500', pct: 85 }
          : s === 'perlu_usaha'
          ? { label: 'Perlu Usaha', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800', dot: 'bg-amber-500', pct: 55 }
          : { label: 'Perlu Perhatian', color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800', dot: 'bg-orange-500', pct: 25 }

        const sisaSemester = latestAnalysis.target_semester != null && summary.current_semester != null
          ? Math.max(0, latestAnalysis.target_semester - summary.current_semester)
          : null

        return (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Prediksi & Analisis Kelulusan</CardTitle>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/student/target/history">
                    Lihat Detail <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Status badge + bar */}
              <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${statusCfg.bg} ${statusCfg.border}`}>
                <span className={`inline-block h-2.5 w-2.5 rounded-full shrink-0 ${statusCfg.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${statusCfg.color}`}>{statusCfg.label}</p>
                  {latestAnalysis.analysis?.ringkasan && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                      {latestAnalysis.analysis.ringkasan}
                    </p>
                  )}
                </div>
              </div>

              {/* Info target: semester & IPK */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-muted/50 px-4 py-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Target Lulus</p>
                  </div>
                  <p className="text-lg font-bold leading-none tabular-nums">
                    Semester {latestAnalysis.target_semester ?? '-'}
                  </p>
                  {sisaSemester !== null && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sisaSemester > 0 ? `${sisaSemester} semester lagi` : 'Semester ini'}
                    </p>
                  )}
                </div>
                <div className="rounded-xl bg-muted/50 px-4 py-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5 text-muted-foreground" />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-xs text-muted-foreground cursor-help underline decoration-dotted">Target IPK</p>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs max-w-[200px]">
                          <p><strong>Indeks Prestasi Kumulatif</strong> yang ingin dicapai saat lulus.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-lg font-bold leading-none tabular-nums">
                    {latestAnalysis.target_ipk != null ? Number(latestAnalysis.target_ipk).toFixed(2) : '-'}
                  </p>
                  {latestAnalysis.analysis?.ipk_minimal_per_semester != null && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Min/semester: {Number(latestAnalysis.analysis.ipk_minimal_per_semester).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {/* Metrik kebutuhan */}
              <div className="grid grid-cols-2 gap-3">
                {latestAnalysis.analysis?.sks_per_semester_dibutuhkan != null && (
                  <div className="rounded-xl bg-muted/50 px-4 py-3 flex flex-col gap-0.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-xs text-muted-foreground cursor-help underline decoration-dotted w-fit">SKS per Semester</p>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs max-w-[220px]">
                          <p>Jumlah <strong>Satuan Kredit Semester</strong> yang perlu diambil setiap semester agar lulus tepat waktu sesuai target.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <p className="text-lg font-bold tabular-nums">
                      {latestAnalysis.analysis.sks_per_semester_dibutuhkan}
                      <span className="text-xs font-normal text-muted-foreground ml-1">SKS</span>
                    </p>
                  </div>
                )}
                {latestAnalysis.analysis?.ips_target_semester_depan != null && (
                  <div className="rounded-xl bg-muted/50 px-4 py-3 flex flex-col gap-0.5">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="text-xs text-muted-foreground cursor-help underline decoration-dotted w-fit">Target IPS Depan</p>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs max-w-[220px]">
                          <p><strong>Indeks Prestasi Semester</strong> yang perlu dicapai di semester berikutnya untuk tetap on-track menuju target IPK.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <p className="text-lg font-bold tabular-nums">
                      {Number(latestAnalysis.analysis.ips_target_semester_depan).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              {/* Strategi kelulusan */}
              {latestAnalysis.analysis?.strategi_kelulusan && (
                <>
                  <Separator />
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-foreground">Strategi Kelulusan</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {latestAnalysis.analysis.strategi_kelulusan}
                    </p>
                  </div>
                </>
              )}

              {/* Rekomendasi utama */}
              {latestAnalysis.analysis?.rekomendasi?.[0] && (
                <div className="flex items-start gap-2.5 rounded-xl bg-primary/5 border border-primary/10 px-4 py-3">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
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
      {target && ((target.target_skills && target.target_skills.length > 0) || (target.target_industries && target.target_industries.length > 0)) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {target.target_skills && target.target_skills.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Code2 className="h-4 w-4 text-primary" />
                  Skill yang Ingin Dikuasai
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1.5">
                  {target.target_skills.map((s: string) => (
                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {target.target_industries && target.target_industries.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  Industri yang Diminati
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1.5">
                  {target.target_industries.map((ind: string) => (
                    <Badge key={ind} variant="outline" className="text-xs">{ind}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Chart IPS & IPK — full width */}
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Grafik IPS & IPK</CardTitle>
                <CardDescription>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help underline decoration-dotted">IPS</span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[220px] text-xs">
                        <p><strong>Indeks Prestasi Semester</strong> — nilai rata-rata per semester (bar).</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {' '}per semester (bar) dan{' '}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help underline decoration-dotted">IPK</span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[220px] text-xs">
                        <p><strong>Indeks Prestasi Kumulatif</strong> — akumulasi rata-rata nilai dari semua semester (garis).</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  {' '}kumulatif (garis)
                </CardDescription>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">Total SKS</p>
                <p className="text-sm font-semibold tabular-nums">
                  {summary.total_sks_earned}
                  <span className="text-xs font-normal text-muted-foreground">/{summary.total_sks_required}</span>
                </p>
              </div>
            </div>
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
      </div>

      {/* Aksi Cepat + MK Perlu Diulang */}
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

        {/* Card MK Mengulang: tampil jika ada is_retake=true ATAU nilai di bawah passing grade */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {needsRetakeDisplay.length > 0 && <AlertCircle className="h-4 w-4 text-orange-500" />}
              Mata Kuliah Perlu Diulang
            </CardTitle>
            <CardDescription>
              {needsRetakeDisplay.length === 0
                ? 'Tidak ada mata kuliah yang perlu diulang'
                : `${needsRetakeDisplay.length} mata kuliah perlu diperhatikan`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {needsRetakeDisplay.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                <GraduationCap className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Semua nilai sudah memenuhi syarat</p>
              </div>
            ) : (
              <div className="space-y-2">
                {needsRetakeDisplay.slice(0, 5).map((g) => (
                  <div key={g.id} className="flex items-center justify-between py-1.5 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{g.course_name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground">
                          Semester {g.semester_number} · {g.credits}{' '}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help underline decoration-dotted">SKS</span>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="text-xs">
                                <p>Satuan Kredit Semester — bobot beban studi mata kuliah ini.</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </p>
                        {!g.is_retake && (
                          <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400 py-0">
                            Nilai tidak lulus
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-950 dark:text-orange-400">
                      {g.grade}
                    </Badge>
                  </div>
                ))}
                {needsRetakeDisplay.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{needsRetakeDisplay.length - 5} lainnya
                  </p>
                )}
                <div className="pt-1">
                  <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                    <Link href="/student/grades">Lihat Semua Nilai</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

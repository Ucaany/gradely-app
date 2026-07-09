import type {
  AcademicRule,
  AcademicStatus,
  AcademicSummary,
  GradeValue,
  SemesterSummary,
  StudentGrade,
} from '@/types'

/**
 * Hitung grade points dari nilai huruf berdasarkan grade_scale di academic rules.
 */
export function getGradePoints(
  grade: GradeValue,
  gradeScale: AcademicRule['grade_scale']
): number {
  return gradeScale[grade] ?? 0
}

/**
 * Hitung IPS (Indeks Prestasi Semester) untuk satu semester.
 * Formula: Σ(grade_points × credits) / Σ credits
 */
export function calculateIPS(grades: StudentGrade[]): number {
  if (grades.length === 0) return 0
  const totalWeighted = grades.reduce(
    (sum, g) => sum + g.grade_points * g.credits,
    0
  )
  const totalCredits = grades.reduce((sum, g) => sum + g.credits, 0)
  if (totalCredits === 0) return 0
  return Math.round((totalWeighted / totalCredits) * 100) / 100
}

/**
 * Hitung IPK (Indeks Prestasi Kumulatif) dari semua nilai.
 * Formula: Σ(grade_points × credits) / Σ total credits
 */
export function calculateIPK(grades: StudentGrade[]): number {
  if (grades.length === 0) return 0
  const totalWeighted = grades.reduce(
    (sum, g) => sum + g.grade_points * g.credits,
    0
  )
  const totalCredits = grades.reduce((sum, g) => sum + g.credits, 0)
  if (totalCredits === 0) return 0
  return Math.round((totalWeighted / totalCredits) * 100) / 100
}

/**
 * Hitung total SKS yang sudah lulus (nilai >= passing_grade).
 */
export function calculateSKSLulus(
  grades: StudentGrade[],
  passingGrade: GradeValue,
  gradeScale: AcademicRule['grade_scale']
): number {
  const passingPoints = gradeScale[passingGrade] ?? 0
  return grades
    .filter((g) => g.grade_points >= passingPoints)
    .reduce((sum, g) => sum + g.credits, 0)
}

/**
 * Tentukan status akademik mahasiswa berdasarkan PRD doc 04.
 */
export function calculateAcademicStatus(
  sksLulus: number,
  currentSemester: number,
  ipk: number,
  retakeCount: number,
  rule: AcademicRule
): AcademicStatus {
  const targetSksPerSemester = rule.total_sks_graduation / rule.normal_semester
  const expectedSks = targetSksPerSemester * currentSemester

  if (currentSemester > rule.max_semester) return 'critical'
  if (ipk < rule.min_gpa) return 'critical'
  if (sksLulus < expectedSks * 0.7) return 'critical'

  if (sksLulus < expectedSks * 0.8 || retakeCount >= 2) return 'recovery_mode'

  if (sksLulus < expectedSks * 0.9 || ipk < rule.min_gpa + 0.3)
    return 'need_attention'

  if (sksLulus >= expectedSks * 1.1) return 'ahead'

  return 'on_track'
}

/**
 * Prediksi semester kelulusan berdasarkan rata-rata SKS per semester.
 */
export function predictGraduationSemester(
  sksLulus: number,
  currentSemester: number,
  rule: AcademicRule
): number {
  const remainingSks = rule.total_sks_graduation - sksLulus
  if (remainingSks <= 0) return currentSemester

  const normalAvg = rule.total_sks_graduation / rule.normal_semester
  const actualAvg = currentSemester > 0 && sksLulus > 0 ? sksLulus / currentSemester : 0

  // Gunakan rata-rata tertinggi antara actual vs normal agar prediksi realistis
  // Jika actual terlalu kecil (< 25% normal), fallback ke normal avg
  const avgSksPerSemester = actualAvg >= normalAvg * 0.25 ? actualAvg : normalAvg

  const semestersNeeded = Math.ceil(remainingSks / avgSksPerSemester)
  const predicted = currentSemester + semestersNeeded

  // Cap di max_semester
  return Math.min(predicted, rule.max_semester)
}

/**
 * Hitung summary akademik lengkap untuk seorang mahasiswa.
 */
export function calculateAcademicSummary(
  grades: StudentGrade[],
  currentSemester: number,
  targetSemester: number,
  rule: AcademicRule
): AcademicSummary {
  const passedGrades = grades.filter(
    (g) => g.grade_points >= (rule.grade_scale[rule.passing_grade as GradeValue] ?? 0)
  )
  const sksLulus = passedGrades.reduce((sum, g) => sum + g.credits, 0)
  const ipk = calculateIPK(grades)

  // IPS semester terakhir
  const lastSemGrades = grades.filter(
    (g) => g.semester_number === Math.max(...grades.map((x) => x.semester_number), 0)
  )
  const lastIps = calculateIPS(lastSemGrades)

  const retakeCount = grades.filter((g) => g.is_retake).length
  const status = calculateAcademicStatus(
    sksLulus,
    currentSemester,
    ipk,
    retakeCount,
    rule
  )

  const predictedSemester = predictGraduationSemester(
    sksLulus,
    currentSemester,
    rule
  )

  return {
    total_sks_earned: sksLulus,
    total_sks_required: rule.total_sks_graduation,
    sks_percentage:
      rule.total_sks_graduation > 0
        ? Math.round((sksLulus / rule.total_sks_graduation) * 1000) / 10
        : 0,
    gpa: ipk,
    last_gpa: lastIps,
    current_semester: currentSemester,
    target_semester: targetSemester,
    academic_status: status,
    predicted_graduation_semester: predictedSemester,
    courses_passed: passedGrades.length,
    courses_retake: retakeCount,
  }
}

/**
 * Group grades per semester.
 */
export function groupGradesBySemester(grades: StudentGrade[]): SemesterSummary[] {
  const map = new Map<number, StudentGrade[]>()
  for (const g of grades) {
    const existing = map.get(g.semester_number) ?? []
    existing.push(g)
    map.set(g.semester_number, existing)
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([semester_number, semGrades]) => ({
      semester_number,
      gpa: calculateIPS(semGrades),
      total_sks: semGrades.reduce((s, g) => s + g.credits, 0),
      grades: semGrades,
    }))
}

/**
 * Label & warna per status akademik.
 * icon: nama lucide-react icon yang dirender di komponen pemanggil
 */
export const ACADEMIC_STATUS_CONFIG: Record<
  AcademicStatus,
  { label: string; color: string; bgColor: string; iconColor: string; icon: string }
> = {
  ahead: {
    label: 'Unggul',
    color: 'text-green-700 dark:text-green-400',
    bgColor: 'bg-green-50 border border-green-200 dark:bg-green-950/40 dark:border-green-800',
    iconColor: 'text-green-600 dark:text-green-400',
    icon: 'TrendingUp',
  },
  on_track: {
    label: 'Sesuai Target',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-50 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800',
    iconColor: 'text-blue-600 dark:text-blue-400',
    icon: 'CheckCircle2',
  },
  need_attention: {
    label: 'Perlu Perhatian',
    color: 'text-yellow-700 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 border border-yellow-200 dark:bg-yellow-950/40 dark:border-yellow-800',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    icon: 'AlertTriangle',
  },
  recovery_mode: {
    label: 'Butuh Pemulihan',
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-50 border border-orange-200 dark:bg-orange-950/40 dark:border-orange-800',
    iconColor: 'text-orange-600 dark:text-orange-400',
    icon: 'AlertOctagon',
  },
  critical: {
    label: 'Darurat Akademik',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-800',
    iconColor: 'text-red-600 dark:text-red-400',
    icon: 'XCircle',
  },
}

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

  const avgSksPerSemester =
    currentSemester > 0 ? sksLulus / currentSemester : rule.total_sks_graduation / rule.normal_semester
  if (avgSksPerSemester <= 0) return rule.max_semester

  const semestersNeeded = Math.ceil(remainingSks / avgSksPerSemester)
  return currentSemester + semestersNeeded
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
 */
export const ACADEMIC_STATUS_CONFIG: Record<
  AcademicStatus,
  { label: string; color: string; bgColor: string; emoji: string }
> = {
  ahead: {
    label: 'Ahead',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    emoji: '🟢',
  },
  on_track: {
    label: 'On Track',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    emoji: '🔵',
  },
  need_attention: {
    label: 'Need Attention',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    emoji: '🟡',
  },
  recovery_mode: {
    label: 'Recovery Mode',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    emoji: '🟠',
  },
  critical: {
    label: 'Critical',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    emoji: '🔴',
  },
}

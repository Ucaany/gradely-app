import type {
  AcademicRule,
  AcademicStatus,
  AcademicSummary,
  GradeValue,
  SKSRulesByIPK,
  SemesterSummary,
  StudentGrade,
} from '@/types'

/**
 * Default aturan SKS berdasarkan IPK.
 * Digunakan sebagai fallback jika rule belum dikonfigurasi.
 */
export const DEFAULT_SKS_RULES_BY_IPK: SKSRulesByIPK = {
  enabled: true,
  semester_1_2_max: 20,
  tiers: [
    { ipk_min: 3.00, ipk_max: 4.00, sks_min: 22, sks_max: 24 },
    { ipk_min: 2.50, ipk_max: 2.99, sks_min: 20, sks_max: 22 },
    { ipk_min: 2.00, ipk_max: 2.49, sks_min: 16, sks_max: 20 },
    { ipk_min: 1.50, ipk_max: 1.99, sks_min: 12, sks_max: 16 },
    { ipk_min: 0.00, ipk_max: 1.49, sks_min: 2,  sks_max: 12 },
  ],
}

/**
 * Deteksi otomatis semester aktif dari data nilai.
 * Mengambil semester_number tertinggi dari semua nilai yang ada.
 * Jika belum ada nilai, fallback ke current_semester dari profil.
 */
export function autoDetectSemester(
  grades: StudentGrade[],
  fallbackSemester: number
): number {
  if (grades.length === 0) return fallbackSemester
  const maxFromGrades = Math.max(...grades.map((g) => g.semester_number))
  return maxFromGrades > 0 ? maxFromGrades : fallbackSemester
}

/**
 * Hitung batas SKS yang boleh diambil pada semester berikutnya
 * berdasarkan IPK dan semester aktif saat ini.
 *
 * Aturan:
 * - Semester 1 & 2: sistem paket, maks sesuai semester_1_2_max
 * - Semester 3+: berdasarkan IPK semester sebelumnya
 *
 * Mengembalikan { sks_min, sks_max } yang boleh diambil.
 */
export function calculateAllowedSKS(
  ipk: number,
  currentSemester: number,
  rule: AcademicRule
): { sks_min: number; sks_max: number } {
  const sksRules = rule.sks_rules_by_ipk ?? DEFAULT_SKS_RULES_BY_IPK

  // Jika fitur dinonaktifkan, gunakan batas global dari aturan akademik
  if (!sksRules.enabled) {
    return {
      sks_min: rule.min_sks_per_semester,
      sks_max: rule.max_sks_per_semester,
    }
  }

  // Semester 1 & 2: sistem paket
  if (currentSemester <= 2) {
    return { sks_min: 0, sks_max: sksRules.semester_1_2_max }
  }

  // Semester 3+: cari tier yang sesuai IPK
  const matchedTier = sksRules.tiers.find(
    (tier) => ipk >= tier.ipk_min && ipk <= tier.ipk_max
  )

  if (matchedTier) {
    return { sks_min: matchedTier.sks_min, sks_max: matchedTier.sks_max }
  }

  // Fallback ke batas global dari aturan akademik
  return {
    sks_min: rule.min_sks_per_semester,
    sks_max: rule.max_sks_per_semester,
  }
}

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
  const dedupedGrades = deduplicateRetakes(grades)
  const passedGrades = dedupedGrades.filter(
    (g) => g.grade_points >= (rule.grade_scale[rule.passing_grade as GradeValue] ?? 0)
  )
  const sksLulus = passedGrades.reduce((sum, g) => sum + g.credits, 0)
  const ipk = calculateIPK(dedupedGrades)

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

  // Hitung batas SKS yang boleh diambil semester berikutnya (berdasarkan IPS terakhir)
  const allowedSKS = calculateAllowedSKS(lastIps, currentSemester, rule)

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
    allowed_sks_min: allowedSKS.sks_min,
    allowed_sks_max: allowedSKS.sks_max,
  }
}

/**
 * Deduplikasi mata kuliah yang diulang.
 * Jika satu mata kuliah muncul lebih dari sekali, hanya nilai terbaik
 * (grade_points tertinggi) yang digunakan untuk perhitungan IPK & SKS lulus.
 * Jika grade_points sama, ambil entri dari semester terbaru.
 */
export function deduplicateRetakes(grades: StudentGrade[]): StudentGrade[] {
  const map = new Map<string, StudentGrade>()
  for (const g of grades) {
    const key = g.course_name.trim().toLowerCase()
    const existing = map.get(key)
    if (!existing) {
      map.set(key, g)
    } else if (
      g.grade_points > existing.grade_points ||
      (g.grade_points === existing.grade_points &&
        g.semester_number > existing.semester_number)
    ) {
      map.set(key, g)
    }
  }
  return Array.from(map.values())
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

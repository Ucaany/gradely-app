// ============================================================
// Gradely — TypeScript Types (sesuai Database Schema PRD)
// ============================================================

export type UserRole = 'student' | 'lecturer' | 'admin' | 'company'

export type AcademicStatus =
  | 'ahead'
  | 'on_track'
  | 'need_attention'
  | 'recovery_mode'
  | 'critical'

export type GradeValue = 'A' | 'AB' | 'B' | 'BC' | 'C' | 'D' | 'E'

export type PortfolioStatus = 'completed' | 'ongoing'

export type DegreeLevel = 'S1' | 'S2' | 'S3' | 'D3' | 'D4'

// ============================================================
// University
// ============================================================
export interface University {
  id: string
  name: string
  short_name: string | null
  city: string | null
  province: string | null
  website: string | null
  logo_url: string | null
  created_at: string
}

// ============================================================
// Study Program
// ============================================================
export interface StudyProgram {
  id: string
  university_id: string
  name: string
  short_name: string | null
  degree_level: DegreeLevel
  is_active: boolean
  created_at: string
}

export interface StudyProgramWithUniversity extends StudyProgram {
  universities: Pick<University, 'id' | 'name' | 'short_name'>
}

// ============================================================
// Academic Rules
// ============================================================
export interface GradeScale {
  A: number
  AB: number
  B: number
  BC: number
  C: number
  D: number
  E: number
}

export interface AcademicRule {
  id: string
  university_id: string
  study_program_id: string | null // null = default rule untuk semua prodi
  total_sks_graduation: number
  normal_semester: number
  max_semester: number
  min_gpa: number
  max_sks_per_semester: number
  min_sks_per_semester: number
  passing_grade: GradeValue
  grade_scale: GradeScale
  created_at: string
  updated_at: string
}

export interface AcademicRuleWithProgram extends AcademicRule {
  study_programs: Pick<StudyProgram, 'id' | 'name' | 'short_name'> | null
}

// ============================================================
// User
// ============================================================
export interface User {
  id: string
  university_id: string | null
  study_program_id: string | null
  role: UserRole
  full_name: string
  email: string
  nim: string | null
  phone: string | null
  avatar_url: string | null
  current_semester: number | null
  current_semester_type: 'ganjil' | 'genap' | null
  profile_visible: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface UserWithRelations extends User {
  universities: Pick<University, 'id' | 'name' | 'short_name'> | null
  study_programs: Pick<StudyProgram, 'id' | 'name' | 'short_name'> | null
}

// Form types untuk create/update user
export interface CreateUserPayload {
  email: string
  full_name: string
  role: UserRole
  university_id: string
  study_program_id?: string
  nim?: string
  phone?: string
  current_semester?: number
  password: string
}

export interface UpdateUserPayload {
  full_name?: string
  nim?: string
  phone?: string
  avatar_url?: string
  current_semester?: number
  study_program_id?: string
  profile_visible?: boolean
  is_active?: boolean
}

// ============================================================
// Student Semester
// ============================================================
export interface StudentSemester {
  id: string
  student_id: string
  semester_number: number
  academic_year: string  // contoh: '2023/2024'
  is_active: boolean
  created_at: string
}

// ============================================================
// Student Grades
// ============================================================
export type SemesterType = 'ganjil' | 'genap'

export interface StudentGrade {
  id: string
  student_id: string
  semester_number: number
  semester_type: SemesterType
  academic_year: string    // contoh: '2024/2025'
  course_name: string
  credits: number          // SKS
  grade: GradeValue
  grade_points: number     // bobot nilai (dihitung otomatis)
  is_retake: boolean       // apakah mengulang
  created_at: string
  updated_at: string
}

export interface CreateGradePayload {
  semester_number: number
  semester_type: SemesterType
  academic_year: string
  course_name: string
  credits: number
  grade: GradeValue
  is_retake?: boolean
}

export interface UpdateGradePayload {
  course_name?: string
  credits?: number
  grade?: GradeValue
  semester_type?: SemesterType
  academic_year?: string
  is_retake?: boolean
}

// ============================================================
// Student Targets
// ============================================================
export interface StudentTarget {
  id: string
  student_id: string
  target_semester: number
  target_ipk: number | null
  target_years: number | null
  career_goal: string | null
  notes: string | null
  achievement_title: string | null
  achievement_description: string | null
  achievement_ipk_target: number | null
  achievement_sks_target: number | null
  achievement_semester_target: number | null
  achievement_skills: string[] | null
  achievement_certificates: string[] | null
  achievement_internship: string | null
  achievement_thesis_topic: string | null
  achievement_updated_at: string | null
  created_at: string
  updated_at: string
}

// ============================================================
// Portfolio Categories
// ============================================================
export interface PortfolioCategory {
  id: string
  code: string   // 'certificate', 'internship', dst
  name: string   // 'Sertifikat', 'Magang', dst
}

// ============================================================
// Student Portfolios
// ============================================================
export interface StudentPortfolio {
  id: string
  student_id: string
  category_id: string
  title: string
  description: string | null
  skills: string[]
  start_date: string | null
  end_date: string | null      // null = ongoing
  status: PortfolioStatus
  url_gdrive: string | null
  url_github: string | null
  url_behance: string | null
  url_linkedin: string | null
  url_youtube: string | null
  url_website: string | null
  created_at: string
  updated_at: string
}

export interface StudentPortfolioWithCategory extends StudentPortfolio {
  portfolio_categories: Pick<PortfolioCategory, 'id' | 'code' | 'name'>
}

// ============================================================
// Career Interests
// ============================================================
export interface CareerInterest {
  id: string
  student_id: string
  interest: string
  created_at: string
}

// ============================================================
// Companies
// ============================================================
export interface Company {
  id: string
  user_id: string
  university_id: string | null
  company_name: string
  industry: string | null
  description: string | null
  website: string | null
  logo_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CompanyCategory {
  id: string
  company_id: string
  category: string
}

// ============================================================
// Advisor Students (Dosen <-> Mahasiswa)
// ============================================================
export interface AdvisorStudent {
  id: string
  lecturer_id: string
  student_id: string
  join_code: string | null
  created_at: string
}

export interface AdvisorStudentWithUsers extends AdvisorStudent {
  users: Pick<User, 'id' | 'full_name' | 'nim' | 'current_semester' | 'avatar_url'>
}

// ============================================================
// Notifications
// ============================================================
export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  is_read: boolean
  created_at: string
}

// ============================================================
// WhatsApp Logs
// ============================================================
export interface WhatsappLog {
  id: string
  recipient_id: string | null
  phone_number: string
  message: string
  status: 'pending' | 'sent' | 'failed'
  error_message: string | null
  sent_at: string | null
  created_at: string
}

// ============================================================
// Settings
// ============================================================
export interface Setting {
  id: string
  university_id: string
  key: string
  value: string
  created_at: string
  updated_at: string
}

// ============================================================
// Computed / Derived Types (Kalkulasi Akademik)
// ============================================================
export interface AcademicSummary {
  total_sks_earned: number    // total SKS yang sudah lulus
  total_sks_required: number  // total SKS untuk kelulusan
  sks_percentage: number      // persentase SKS lulus
  gpa: number                 // IPK
  last_gpa: number            // IPS semester terakhir
  current_semester: number
  target_semester: number
  academic_status: AcademicStatus
  predicted_graduation_semester: number
  courses_passed: number
  courses_retake: number
}

export interface SemesterSummary {
  semester_number: number
  gpa: number                 // IPS semester ini
  total_sks: number
  grades: StudentGrade[]
}

// ============================================================
// Pagination & Filter helpers
// ============================================================
export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface UserFilterParams extends PaginationParams {
  role?: UserRole
  study_program_id?: string
  search?: string
  is_active?: boolean
}

export interface StudentFilterParams extends PaginationParams {
  study_program_id?: string
  min_gpa?: number
  max_gpa?: number
  career_interest?: string
  search?: string
}

// ============================================================
// API Response wrapper
// ============================================================
export interface ApiResponse<T = unknown> {
  data: T | null
  error: string | null
  success: boolean
}

// ============================================================
// CSV Import
// ============================================================
export interface CsvUserRow {
  full_name: string
  email: string
  role: UserRole
  nim?: string
  phone?: string
  study_program_id?: string
  current_semester?: number
}

export interface ImportResult {
  success: number
  failed: number
  errors: Array<{ row: number; email: string; reason: string }>
}

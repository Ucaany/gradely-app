import { z } from 'zod'

// ============================================================
// Auth
// ============================================================
export const loginSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi').min(6, 'Password minimal 6 karakter'),
})

export const resetPasswordSchema = z.object({
  email: z.string().email('Email tidak valid'),
})

export const updatePasswordSchema = z
  .object({
    password: z.string().min(8, 'Password minimal 8 karakter'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password tidak cocok',
    path: ['confirmPassword'],
  })

// ============================================================
// User Management
// ============================================================
const phoneSchema = z
  .string()
  .refine(
    (val) => val === '' || /^(\+62|62|0)[0-9]{7,14}$/.test(val),
    'Format nomor HP tidak valid (contoh: 08123456789)'
  )
  .optional()
  .nullable()

const uuidOrEmpty = z.union([
  z.string().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/),
  z.literal(''),
  z.null(),
]).optional()

export const createUserSchema = z.object({
  full_name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  role: z.enum(['student', 'lecturer', 'admin', 'company']),
  university_id: z.string().optional().nullable(),
  study_program_id: uuidOrEmpty,
  nim: z.string().max(20).optional().nullable(),
  phone: phoneSchema,
  current_semester: z.number().int().min(1).max(14).optional().nullable(),
  current_semester_type: z.enum(['ganjil', 'genap']).optional().nullable(),
})

export const updateUserSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  nim: z.string().max(20).optional().nullable(),
  phone: phoneSchema,
  current_semester: z.number().int().min(1).max(14).optional().nullable(),
  current_semester_type: z.enum(['ganjil', 'genap']).optional().nullable(),
  study_program_id: uuidOrEmpty,
  is_active: z.boolean().optional(),
})

// ============================================================
// Study Program
// ============================================================
export const createStudyProgramSchema = z.object({
  university_id: z.string().uuid(),
  name: z.string().min(2, 'Nama program studi minimal 2 karakter').max(100),
  short_name: z.string().max(20).optional().nullable(),
  degree_level: z.enum(['S1', 'S2', 'S3', 'D3', 'D4']),
  is_active: z.boolean(),
})

export const updateStudyProgramSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  short_name: z.string().max(20).optional().nullable(),
  degree_level: z.enum(['S1', 'S2', 'S3', 'D3', 'D4']).optional(),
  is_active: z.boolean().optional(),
})

// ============================================================
// Academic Rules
// ============================================================
export const gradeScaleSchema = z.object({
  A: z.number().min(0).max(4),
  AB: z.number().min(0).max(4),
  B: z.number().min(0).max(4),
  BC: z.number().min(0).max(4),
  C: z.number().min(0).max(4),
  D: z.number().min(0).max(4),
  E: z.number().min(0).max(4),
})

export const createAcademicRuleSchema = z.object({
  university_id: z.string().uuid(),
  study_program_id: z.string().uuid().optional().nullable(),
  total_sks_graduation: z.number().int().min(100).max(200),
  normal_semester: z.number().int().min(4).max(14),
  max_semester: z.number().int().min(8).max(20),
  min_gpa: z.number().min(0).max(4),
  max_sks_per_semester: z.number().int().min(12).max(30),
  min_sks_per_semester: z.number().int().min(1).max(24),
  passing_grade: z.enum(['A', 'AB', 'B', 'BC', 'C', 'D', 'E']),
  grade_scale: gradeScaleSchema,
})

export const updateAcademicRuleSchema = z.object({
  study_program_id: z.string().uuid().optional().nullable(),
  total_sks_graduation: z.number().int().min(100).max(200).optional(),
  normal_semester: z.number().int().min(4).max(14).optional(),
  max_semester: z.number().int().min(8).max(20).optional(),
  min_gpa: z.number().min(0).max(4).optional(),
  max_sks_per_semester: z.number().int().min(12).max(30).optional(),
  min_sks_per_semester: z.number().int().min(1).max(24).optional(),
  passing_grade: z.enum(['A', 'AB', 'B', 'BC', 'C', 'D', 'E']).optional(),
  grade_scale: gradeScaleSchema.optional(),
})

// ============================================================
// Student Grades
// ============================================================
export const createGradeSchema = z.object({
  semester_number: z.number().int().min(1).max(14),
  semester_type: z.enum(['ganjil', 'genap']),
  academic_year: z.string().min(4, 'Tahun ajaran wajib diisi').max(20),
  course_name: z.string().min(2, 'Nama mata kuliah minimal 2 karakter').max(100),
  credits: z.number().int().min(1).max(6),
  grade: z.enum(['A', 'AB', 'B', 'BC', 'C', 'D', 'E']),
  is_retake: z.boolean(),
})

export const updateGradeSchema = z.object({
  semester_number: z.number().int().min(1).max(14).optional(),
  semester_type: z.enum(['ganjil', 'genap']).optional(),
  academic_year: z.string().min(4).max(20).optional(),
  course_name: z.string().min(2).max(100).optional(),
  credits: z.number().int().min(1).max(6).optional(),
  grade: z.enum(['A', 'AB', 'B', 'BC', 'C', 'D', 'E']).optional(),
  is_retake: z.boolean().optional(),
})

// ============================================================
// Student Target
// ============================================================
export const studentTargetSchema = z.object({
  target_semester: z.number().int().min(7).max(14),
  target_ipk: z.number().min(0).max(4).optional().nullable(),
  target_years: z.number().int().min(1).max(7).optional().nullable(),
  career_goal: z.string().max(200).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

export const studentAchievementSchema = z.object({
  achievement_title: z.string().max(150).optional().nullable(),
  achievement_description: z.string().max(500).optional().nullable(),
  achievement_ipk_target: z.number().min(0).max(4).optional().nullable(),
  achievement_sks_target: z.number().int().min(0).max(200).optional().nullable(),
  achievement_semester_target: z.number().int().min(1).max(14).optional().nullable(),
  achievement_skills: z.array(z.string().max(50)).max(10).optional().nullable(),
  achievement_certificates: z.array(z.string().max(150)).max(10).optional().nullable(),
  achievement_internship: z.string().max(200).optional().nullable(),
  achievement_thesis_topic: z.string().max(300).optional().nullable(),
})

export type StudentAchievementInput = z.infer<typeof studentAchievementSchema>

// ============================================================
// Portfolio
// ============================================================
export const createPortfolioSchema = z.object({
  category_id: z.string().uuid('Kategori tidak valid'),
  title: z.string().min(2, 'Judul minimal 2 karakter').max(200),
  description: z.string().max(1000).optional().nullable(),
  skills: z.array(z.string()).default([]),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  status: z.enum(['completed', 'ongoing']).default('completed'),
  url_gdrive: z.string().url('URL tidak valid').optional().nullable().or(z.literal('')),
  url_github: z.string().url('URL tidak valid').optional().nullable().or(z.literal('')),
  url_behance: z.string().url('URL tidak valid').optional().nullable().or(z.literal('')),
  url_linkedin: z.string().url('URL tidak valid').optional().nullable().or(z.literal('')),
  url_youtube: z.string().url('URL tidak valid').optional().nullable().or(z.literal('')),
  url_website: z.string().url('URL tidak valid').optional().nullable().or(z.literal('')),
})

export const updatePortfolioSchema = createPortfolioSchema.partial()

// ============================================================
// CSV Import
// ============================================================
export const csvUserRowSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['student', 'lecturer', 'admin', 'company']),
  nim: z.string().optional(),
  phone: z.string().optional(),
  study_program_id: z.string().optional(),
  current_semester: z.number().int().min(1).max(14).optional(),
})

// ============================================================
// Student Profile Update
// ============================================================
export const updateStudentProfileSchema = z.object({
  full_name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  phone: z
    .string()
    .refine(
      (val) => val === '' || /^(\+62|62|0)[0-9]{7,14}$/.test(val),
      'Format nomor HP tidak valid (contoh: 08123456789)'
    )
    .optional()
    .nullable(),
  avatar_url: z.string().url('URL tidak valid').optional().nullable().or(z.literal('')),
  current_semester: z.number().int().min(1).max(14).optional().nullable(),
  current_semester_type: z.enum(['ganjil', 'genap']).optional().nullable(),
  profile_visible: z.boolean().optional(),
})

export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>

// ============================================================
// WAHA / Settings
// ============================================================
export const wahaSettingsSchema = z.object({
  waha_url: z.string().url('WAHA URL tidak valid'),
  waha_session: z.string().min(1, 'Session name diperlukan'),
  waha_api_key: z.string().optional(),
})

// Type exports
export type LoginInput = z.infer<typeof loginSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>
export type CreateUserInput = z.infer<typeof createUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type CreateStudyProgramInput = z.infer<typeof createStudyProgramSchema>
export type UpdateStudyProgramInput = z.infer<typeof updateStudyProgramSchema>
export type CreateAcademicRuleInput = z.infer<typeof createAcademicRuleSchema>
export type UpdateAcademicRuleInput = z.infer<typeof updateAcademicRuleSchema>
export type CreateGradeInput = z.infer<typeof createGradeSchema>
export type UpdateGradeInput = z.infer<typeof updateGradeSchema>
export type StudentTargetInput = z.infer<typeof studentTargetSchema>
export type CreatePortfolioInput = z.infer<typeof createPortfolioSchema>
export type UpdatePortfolioInput = z.infer<typeof updatePortfolioSchema>
export type WahaSettingsInput = z.infer<typeof wahaSettingsSchema>

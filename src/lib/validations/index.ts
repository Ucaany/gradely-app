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
export const createUserSchema = z.object({
  full_name: z.string().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().email('Email tidak valid'),
  role: z.enum(['student', 'lecturer', 'admin', 'company']),
  university_id: z.string().uuid('University ID tidak valid'),
  study_program_id: z.string().uuid().optional().nullable(),
  nim: z
    .string()
    .max(20)
    .optional()
    .nullable(),
  phone: z
    .string()
    .regex(/^(\+62|62|0)[0-9]{8,13}$/, 'Format nomor HP tidak valid')
    .optional()
    .nullable()
    .or(z.literal('')),
  current_semester: z.number().int().min(1).max(14).optional().nullable(),
  password: z.string().min(8, 'Password minimal 8 karakter'),
})

export const updateUserSchema = z.object({
  full_name: z.string().min(2).max(100).optional(),
  nim: z.string().max(20).optional().nullable(),
  phone: z
    .string()
    .regex(/^(\+62|62|0)[0-9]{8,13}$/, 'Format nomor HP tidak valid')
    .optional()
    .nullable()
    .or(z.literal('')),
  current_semester: z.number().int().min(1).max(14).optional().nullable(),
  study_program_id: z.string().uuid().optional().nullable(),
  is_active: z.boolean().optional(),
})

// ============================================================
// Study Program
// ============================================================
export const createStudyProgramSchema = z.object({
  university_id: z.string().uuid(),
  name: z.string().min(2, 'Nama program studi minimal 2 karakter').max(100),
  short_name: z.string().max(20).optional().nullable(),
  degree_level: z.enum(['S1', 'S2', 'S3', 'D3', 'D4']).default('S1'),
  is_active: z.boolean().default(true),
})

export const updateStudyProgramSchema = createStudyProgramSchema.partial().omit({
  university_id: true,
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
  passing_grade: z.enum(['A', 'AB', 'B', 'BC', 'C', 'D', 'E']).default('D'),
  grade_scale: gradeScaleSchema,
})

export const updateAcademicRuleSchema = createAcademicRuleSchema.partial().omit({
  university_id: true,
})

// ============================================================
// Student Grades
// ============================================================
export const createGradeSchema = z.object({
  semester_number: z.number().int().min(1).max(14),
  course_name: z.string().min(2, 'Nama mata kuliah minimal 2 karakter').max(100),
  credits: z.number().int().min(1).max(6),
  grade: z.enum(['A', 'AB', 'B', 'BC', 'C', 'D', 'E']),
  is_retake: z.boolean().default(false),
})

export const updateGradeSchema = createGradeSchema.partial()

// ============================================================
// Student Target
// ============================================================
export const studentTargetSchema = z.object({
  target_semester: z.number().int().min(7).max(14),
  career_goal: z.string().max(200).optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
})

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

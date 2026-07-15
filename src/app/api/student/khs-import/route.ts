import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGradePoints } from '@/lib/utils/academic'
import type { ApiResponse } from '@/types'

interface GradeInput {
  course_name: string
  credits: number
  grade: string
  semester_number: number
  semester_type: string
  academic_year: string
}

const VALID_GRADES = new Set(['A', 'A-', 'BA', 'B+', 'B', 'B-', 'C', 'D', 'E'])

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role, study_program_id, university_id')
      .eq('id', user.id)
      .single()
    if (!profile || profile.role !== 'student') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const body = await request.json()
    const { grades } = body as { grades: GradeInput[] }
    if (!Array.isArray(grades) || grades.length === 0) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Data nilai tidak valid', success: false }, { status: 400 })
    }

    if (grades.length > 200) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Maksimal 200 mata kuliah per import', success: false }, { status: 400 })
    }

    // Ambil grade scale dari academic rules
    let gradeScale = { A: 4.0, 'A-': 3.75, BA: 3.5, 'B+': 3.25, B: 3.0, 'B-': 2.75, C: 2.0, D: 1.0, E: 0.0 }
    if (profile.study_program_id) {
      const { data: rule } = await supabase
        .from('academic_rules')
        .select('grade_scale')
        .eq('university_id', profile.university_id)
        .or(`study_program_id.eq.${profile.study_program_id},study_program_id.is.null`)
        .order('study_program_id', { ascending: false })
        .limit(1)
        .single()
      if (rule?.grade_scale) gradeScale = rule.grade_scale
    }

    // Ambil data existing untuk deteksi duplikat
    const { data: existingGrades } = await supabase
      .from('student_grades')
      .select('course_name, semester_number')
      .eq('student_id', user.id)

    const existingSet = new Set(
      (existingGrades ?? []).map((g: { course_name: string; semester_number: number }) =>
        `${g.course_name.trim().toLowerCase()}__${g.semester_number}`
      )
    )

    // Validasi dan siapkan baris yang valid
    const validRows: object[] = []
    let skipped = 0
    const errors: string[] = []

    for (const g of grades) {
      if (!g.course_name?.trim() || !VALID_GRADES.has(g.grade)) {
        skipped++
        continue
      }

      const key = `${g.course_name.trim().toLowerCase()}__${g.semester_number}`
      if (existingSet.has(key)) {
        skipped++
        errors.push(`${g.course_name}: sudah ada di semester ${g.semester_number}, dilewati`)
        continue
      }

      const grade_points = getGradePoints(g.grade as keyof typeof gradeScale, gradeScale)
      validRows.push({
        student_id: user.id,
        course_name: g.course_name.trim(),
        credits: g.credits,
        grade: g.grade,
        grade_points,
        semester_number: g.semester_number,
        semester_type: g.semester_type ?? (g.semester_number % 2 === 1 ? 'ganjil' : 'genap'),
        academic_year: g.academic_year,
        is_retake: false,
      })

      existingSet.add(key)
    }

    let imported = 0
    if (validRows.length > 0) {
      const { error: insertError } = await supabase
        .from('student_grades')
        .insert(validRows)

      if (insertError) {
        return NextResponse.json<ApiResponse>({ data: null, error: insertError.message, success: false }, { status: 500 })
      }
      imported = validRows.length
    }

    return NextResponse.json({ data: { imported, skipped, errors }, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

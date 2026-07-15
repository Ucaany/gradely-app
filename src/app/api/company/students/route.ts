import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('role, university_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'company') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)

  // Multi-value support: study_program_id=a&study_program_id=b  OR  study_program_ids=a,b
  const studyProgramIds = [
    ...searchParams.getAll('study_program_id'),
    ...(searchParams.get('study_program_ids') ?? '').split(',').filter(Boolean),
  ].filter(Boolean)

  const skills = [
    ...searchParams.getAll('skill'),
    ...(searchParams.get('skills') ?? '').split(',').filter(Boolean),
  ].filter(Boolean)

  const careerInterests = [
    ...searchParams.getAll('career_interest'),
    ...(searchParams.get('career_interests') ?? '').split(',').filter(Boolean),
  ].filter(Boolean)

  const min_gpa = searchParams.get('min_gpa')
  const search = searchParams.get('search')
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') ?? 24)))

  let query = supabase
    .from('users')
    .select(`
      id, full_name, avatar_url, profile_visible,
      study_programs(id, name, short_name, degree_level),
      universities(id, name, short_name),
      student_portfolios(id, title, skills, links, is_public, status, description),
      career_interests(interest)
    `, { count: 'exact' })
    .eq('role', 'student')
    .eq('profile_visible', true)
    .eq('is_active', true)

  if (studyProgramIds.length === 1) {
    query = query.eq('study_program_id', studyProgramIds[0])
  } else if (studyProgramIds.length > 1) {
    query = query.in('study_program_id', studyProgramIds)
  }

  if (search) query = query.ilike('full_name', `%${search}%`)

  const { data: students, error, count } = await query
    .range((page - 1) * pageSize, page * pageSize - 1)
    .order('full_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const studentIds = (students ?? []).map((s) => s.id)
  let filteredStudents: typeof students = students ?? []

  // GPA filter — kolom aktual: grade_points, credits (sesuai migration 001)
  if (min_gpa && studentIds.length > 0) {
    const minGpa = parseFloat(min_gpa)
    if (!isNaN(minGpa) && minGpa > 0) {
      const { data: grades } = await supabase
        .from('student_grades')
        .select('student_id, grade_points, credits')
        .in('student_id', studentIds)

      const gpaMap = new Map<string, number>()
      if (grades) {
        const grouped = new Map<string, { points: number; credits: number }>()
        for (const g of grades) {
          const prev = grouped.get(g.student_id) ?? { points: 0, credits: 0 }
          grouped.set(g.student_id, {
            points: prev.points + (g.grade_points ?? 0) * (g.credits ?? 0),
            credits: prev.credits + (g.credits ?? 0),
          })
        }
        grouped.forEach((val, sid) => {
          gpaMap.set(sid, val.credits > 0 ? Math.round((val.points / val.credits) * 100) / 100 : 0)
        })
      }
      filteredStudents = filteredStudents.filter((s) => (gpaMap.get(s.id) ?? 0) >= minGpa)
      filteredStudents = filteredStudents.map((s) => ({ ...s, gpa: gpaMap.get(s.id) ?? 0 }))
    }
  }

  // Skills filter — multi-value: student harus punya setidaknya salah satu skill
  if (skills.length > 0) {
    filteredStudents = filteredStudents.filter((s) =>
      skills.some((sk) =>
        (s.student_portfolios ?? []).some((p: { skills: string[] }) =>
          (p.skills ?? []).some((psk: string) =>
            psk.toLowerCase().includes(sk.toLowerCase())
          )
        )
      )
    )
  }

  // Career interests filter — multi-value: student harus punya setidaknya salah satu
  if (careerInterests.length > 0) {
    filteredStudents = filteredStudents.filter((s) =>
      careerInterests.some((ci) =>
        (s.career_interests ?? []).some((c: { interest: string }) =>
          c.interest.toLowerCase().includes(ci.toLowerCase())
        )
      )
    )
  }

  return NextResponse.json({
    success: true,
    data: filteredStudents.map((s) => ({
      ...s,
      student_portfolios: (s.student_portfolios ?? []).filter(
        (p: { is_public: boolean }) => p.is_public
      ),
    })),
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  })
}

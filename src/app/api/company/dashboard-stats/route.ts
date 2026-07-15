import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role, university_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'company') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!company) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Profil perusahaan tidak ditemukan', success: false }, { status: 404 })
    }

    const universityId = profile.university_id

    const { count: totalStudents } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'student')
      .eq('profile_visible', true)
      .eq('is_active', true)
      .eq('university_id', universityId)

    const { data: visibleStudents } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'student')
      .eq('profile_visible', true)
      .eq('is_active', true)
      .eq('university_id', universityId)

    const studentIds = (visibleStudents ?? []).map((s) => s.id)

    const { count: publicPortfoliosCount } = await supabase
      .from('student_portfolios')
      .select('id', { count: 'exact', head: true })
      .in('student_id', studentIds.length > 0 ? studentIds : [''])
      .eq('is_public', true)

    const { data: skillRows } = studentIds.length > 0
      ? await supabase
          .from('student_portfolios')
          .select('skills')
          .in('student_id', studentIds)
          .eq('is_public', true)
      : { data: [] }

    const skillMap = new Map<string, number>()
    const uniqueSkills = new Set<string>()
    for (const row of skillRows ?? []) {
      const seen = new Set<string>()
      for (const sk of (row.skills ?? []) as string[]) {
        uniqueSkills.add(sk)
        if (!seen.has(sk)) {
          seen.add(sk)
          skillMap.set(sk, (skillMap.get(sk) ?? 0) + 1)
        }
      }
    }

    const topSkills = Array.from(skillMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }))

    const { data: careerRows } = studentIds.length > 0
      ? await supabase
          .from('career_interests')
          .select('interest')
          .in('student_id', studentIds)
      : { data: [] }

    const careerMap = new Map<string, number>()
    for (const row of careerRows ?? []) {
      careerMap.set(row.interest, (careerMap.get(row.interest) ?? 0) + 1)
    }

    const topCareers = Array.from(careerMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]) => ({ name, count }))

    return NextResponse.json({
      data: {
        total_students: totalStudents ?? 0,
        public_portfolios: publicPortfoliosCount ?? 0,
        unique_skills: uniqueSkills.size,
        top_skills: topSkills,
        top_careers: topCareers,
      },
      error: null,
      success: true,
    })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

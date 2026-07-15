import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

// GET /api/admin/chart-data — rata-rata IPK & IPS per semester dari mahasiswa universitas admin
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

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const universityId = profile.university_id ?? null

    if (!universityId) {
      return NextResponse.json({ data: [], error: null, success: true })
    }

    // Ambil ID mahasiswa aktif dalam universitas admin
    const { data: students } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'student')
      .eq('university_id', universityId)
      .eq('is_active', true)

    const studentIds = (students ?? []).map((s: { id: string }) => s.id)

    if (studentIds.length === 0) {
      return NextResponse.json({ data: [], error: null, success: true })
    }

    const { data: grades, error } = await supabase
      .from('student_grades')
      .select('semester_number, grade_points, credits, student_id')
      .in('student_id', studentIds)
      .order('semester_number', { ascending: true })

    if (error) return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 500 })

    if (!grades || grades.length === 0) {
      return NextResponse.json({ data: [], error: null, success: true })
    }

    const filteredGrades = grades

    // Group by semester_number, hitung rata-rata IPS per semester dan IPK kumulatif
    const semesterMap = new Map<number, { totalWeighted: number; totalCredits: number }>()

    for (const g of filteredGrades) {
      const sem = g.semester_number
      const existing = semesterMap.get(sem) ?? { totalWeighted: 0, totalCredits: 0 }
      existing.totalWeighted += g.grade_points * g.credits
      existing.totalCredits += g.credits
      semesterMap.set(sem, existing)
    }

    const sortedSemesters = Array.from(semesterMap.entries()).sort(([a], [b]) => a - b)

    let cumulativeWeighted = 0
    let cumulativeCredits = 0

    const chartData = sortedSemesters.map(([semester_number, { totalWeighted, totalCredits }]) => {
      const ips = totalCredits > 0 ? Math.round((totalWeighted / totalCredits) * 100) / 100 : 0
      cumulativeWeighted += totalWeighted
      cumulativeCredits += totalCredits
      const ipk = cumulativeCredits > 0 ? Math.round((cumulativeWeighted / cumulativeCredits) * 100) / 100 : 0

      return {
        semester: `Sem ${semester_number}`,
        ipk,
        ips,
      }
    })

    return NextResponse.json({ data: chartData, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

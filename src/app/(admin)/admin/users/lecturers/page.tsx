import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LecturersView } from '@/components/admin/lecturers-view'

export default async function LecturersPage({
  searchParams,
}: {
  searchParams: { search?: string; page?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const page = Number(searchParams.page ?? 1)
  const pageSize = 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('users')
    .select(`id, full_name, email, phone, is_active, created_at, avatar_url, join_code, study_programs(id, name, short_name)`, { count: 'exact' })
    .eq('role', 'lecturer')
    .order('full_name')
    .range(from, to)

  if (searchParams.search) {
    query = query.or(`full_name.ilike.%${searchParams.search}%,email.ilike.%${searchParams.search}%`)
  }

  const { data: lecturers, count } = await query

  const lecturerIds = (lecturers ?? []).map((l) => l.id)
  let advisorCounts: Record<string, number> = {}
  if (lecturerIds.length > 0) {
    const { data: advisorRows } = await supabase
      .from('advisor_students')
      .select('lecturer_id')
      .in('lecturer_id', lecturerIds)
    for (const row of advisorRows ?? []) {
      advisorCounts[row.lecturer_id] = (advisorCounts[row.lecturer_id] ?? 0) + 1
    }
  }

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <LecturersView
      lecturers={lecturers ?? []}
      advisorCounts={advisorCounts}
      count={count ?? 0}
      page={page}
      totalPages={totalPages}
      search={searchParams.search}
    />
  )
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'student') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('career_interests')
    .select('id, interest, created_at')
    .eq('student_id', user.id)
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'student') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { interests } = body as { interests: string[] }

  // Allow empty array (user selected "tidak ada")
  if (!Array.isArray(interests)) {
    return NextResponse.json({ error: 'Format data tidak valid' }, { status: 400 })
  }

  if (interests.length > 20) {
    return NextResponse.json({ error: 'Maksimal 20 minat karier' }, { status: 400 })
  }

  // Validate against DB (skill_options) if interests provided
  if (interests.length > 0) {
    const { data: validSkills } = await supabase
      .from('skill_options')
      .select('name')
      .in('name', interests)
      .eq('is_active', true)

    const validNames = new Set((validSkills ?? []).map(s => s.name))
    const invalidInterests = interests.filter(i => !validNames.has(i))
    if (invalidInterests.length > 0) {
      return NextResponse.json({ error: 'Terdapat pilihan minat karier yang tidak valid' }, { status: 400 })
    }
  }

  await supabase.from('career_interests').delete().eq('student_id', user.id)

  if (interests.length > 0) {
    const rows = interests.map((interest) => ({ student_id: user.id, interest }))
    const { data, error } = await supabase
      .from('career_interests')
      .insert(rows)
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, data })
  }

  return NextResponse.json({ success: true, data: [] })
}

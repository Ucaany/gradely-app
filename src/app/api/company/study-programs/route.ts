import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
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

  if (!profile.university_id) {
    return NextResponse.json({ success: true, data: [] })
  }

  const { data, error } = await supabase
    .from('study_programs')
    .select('id, name, short_name, degree_level')
    .eq('university_id', profile.university_id)
    .eq('is_active', true)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}

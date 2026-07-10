import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  const { interests } = await request.json() as { interests: string[] }
  if (!Array.isArray(interests) || interests.length === 0) {
    return NextResponse.json({ error: 'Minimal pilih 1 minat karier' }, { status: 400 })
  }

  await supabase.from('career_interests').delete().eq('student_id', user.id)

  const rows = interests.map((interest) => ({ student_id: user.id, interest }))
  const { data, error } = await supabase
    .from('career_interests')
    .insert(rows)
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}

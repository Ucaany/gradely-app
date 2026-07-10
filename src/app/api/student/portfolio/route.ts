import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPortfolioSchema } from '@/lib/validations'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('student_portfolios')
    .select('*, portfolio_categories(id, code, name)')
    .eq('student_id', user.id)
    .order('start_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const parsed = createPortfolioSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('student_portfolios')
    .insert({ ...parsed.data, student_id: user.id })
    .select('*, portfolio_categories(id, code, name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data }, { status: 201 })
}

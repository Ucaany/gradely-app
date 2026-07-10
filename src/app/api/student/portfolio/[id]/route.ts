import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updatePortfolioSchema } from '@/lib/validations'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { data, error } = await supabase
    .from('student_portfolios')
    .select('*, portfolio_categories(id, code, name)')
    .eq('id', id)
    .eq('student_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ success: true, data })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json()
  const parsed = updatePortfolioSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('student_portfolios')
    .update(parsed.data)
    .eq('id', id)
    .eq('student_id', user.id)
    .select('*, portfolio_categories(id, code, name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, data })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { error } = await supabase
    .from('student_portfolios')
    .delete()
    .eq('id', id)
    .eq('student_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

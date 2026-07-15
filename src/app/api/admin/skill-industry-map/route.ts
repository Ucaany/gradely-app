import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, error: NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 }) }

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') {
    return { supabase, error: NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 }) }
  }
  return { supabase, error: null as null }
}

// GET — all mappings as { skill_id, industry_ids[] }
export async function GET() {
  try {
    const { supabase, error } = await requireAdmin()
    if (error) return error

    const { data, error: dbError } = await supabase
      .from('skill_industry_map')
      .select('skill_id, industry_id')

    if (dbError) return NextResponse.json<ApiResponse>({ data: null, error: dbError.message, success: false }, { status: 500 })

    const map: Record<string, string[]> = {}
    for (const row of data ?? []) {
      if (!map[row.skill_id]) map[row.skill_id] = []
      map[row.skill_id].push(row.industry_id)
    }

    return NextResponse.json({ data: map, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

// PUT — replace mappings for one skill: { skill_id, industry_ids: string[] }
export async function PUT(request: NextRequest) {
  try {
    const { supabase, error } = await requireAdmin()
    if (error) return error

    const body = await request.json()
    const skill_id = body.skill_id as string | undefined
    const industry_ids = (body.industry_ids ?? []) as string[]

    if (!skill_id) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'skill_id wajib diisi', success: false }, { status: 400 })
    }

    await supabase.from('skill_industry_map').delete().eq('skill_id', skill_id)

    if (industry_ids.length > 0) {
      const inserts = industry_ids.map((industry_id) => ({ skill_id, industry_id }))
      const { error: insertError } = await supabase.from('skill_industry_map').insert(inserts)
      if (insertError) {
        return NextResponse.json<ApiResponse>({ data: null, error: insertError.message, success: false }, { status: 500 })
      }
    }

    return NextResponse.json({ data: { skill_id, industry_ids }, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

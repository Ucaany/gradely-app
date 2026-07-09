import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data, error } = await supabase
      .from('skill_options')
      .select('id, name, is_active, created_at')
      .order('name')

    if (error) return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 500 })
    return NextResponse.json({ data, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })

    const { name } = await request.json()
    if (!name?.trim()) return NextResponse.json<ApiResponse>({ data: null, error: 'Nama skill wajib diisi', success: false }, { status: 400 })

    const { data, error } = await supabase.from('skill_options').insert({ name: name.trim() }).select().single()
    if (error) return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 400 })
    return NextResponse.json({ data, error: null, success: true }, { status: 201 })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

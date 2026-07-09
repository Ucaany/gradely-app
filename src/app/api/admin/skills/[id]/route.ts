import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })

    const body = await request.json()
    const updates: Record<string, unknown> = {}
    if (body.name !== undefined) updates.name = body.name.trim()
    if (body.is_active !== undefined) updates.is_active = body.is_active

    const { data, error } = await supabase.from('skill_options').update(updates).eq('id', params.id).select().single()
    if (error) return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 400 })
    return NextResponse.json({ data, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })

    const { error } = await supabase.from('skill_options').delete().eq('id', params.id)
    if (error) return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 400 })
    return NextResponse.json({ data: null, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// GET /api/lecturer/join-code — ambil atau buat join code dosen
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role, join_code')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'lecturer') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    if (profile.join_code) {
      return NextResponse.json({ data: { join_code: profile.join_code }, error: null, success: true })
    }

    // Generate new unique code
    let code = generateJoinCode()
    let attempts = 0
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('join_code', code)
        .single()
      if (!existing) break
      code = generateJoinCode()
      attempts++
    }

    const { error } = await supabase
      .from('users')
      .update({ join_code: code })
      .eq('id', user.id)

    if (error) return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 500 })

    return NextResponse.json({ data: { join_code: code }, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

// POST /api/lecturer/join-code — regenerate join code
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'lecturer') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    let code = generateJoinCode()
    let attempts = 0
    while (attempts < 10) {
      const { data: existing } = await supabase
        .from('users')
        .select('id')
        .eq('join_code', code)
        .single()
      if (!existing) break
      code = generateJoinCode()
      attempts++
    }

    const { error } = await supabase
      .from('users')
      .update({ join_code: code })
      .eq('id', user.id)

    if (error) return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 500 })

    return NextResponse.json({ data: { join_code: code }, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

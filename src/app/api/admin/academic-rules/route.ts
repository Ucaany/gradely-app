import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { createAcademicRuleSchema } from '@/lib/validations'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const universityId = searchParams.get('university_id')

    let query = supabase
      .from('academic_rules')
      .select('*, study_programs(id, name, short_name)')
      .order('created_at')

    if (universityId) query = query.eq('university_id', universityId)

    const { data, error } = await query
    if (error) return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 500 })

    return NextResponse.json<ApiResponse>({ data, error: null, success: true })
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

    const body = await request.json()
    const parsed = createAcademicRuleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json<ApiResponse>({ data: null, error: parsed.error.issues.map(e => e.message).join(', '), success: false }, { status: 422 })
    }

    const serviceClient = createServiceClient()
    const { data, error } = await serviceClient.from('academic_rules').insert(parsed.data).select().single()
    if (error) return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 500 })

    return NextResponse.json<ApiResponse>({ data, error: null, success: true }, { status: 201 })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

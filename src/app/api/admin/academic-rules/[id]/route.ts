import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { updateAcademicRuleSchema } from '@/lib/validations'
import type { ApiResponse } from '@/types'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })

    const body = await request.json()
    const parsed = updateAcademicRuleSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json<ApiResponse>({ data: null, error: parsed.error.issues.map((e) => e.message).join(', '), success: false }, { status: 422 })
    }

    const serviceClient = createServiceClient()
    const { data, error } = await serviceClient
      .from('academic_rules')
      .update(parsed.data)
      .eq('id', params.id)
      .select()
      .single()

    if (error) return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 500 })

    return NextResponse.json<ApiResponse>({ data, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })

    const serviceClient = createServiceClient()
    const { error } = await serviceClient.from('academic_rules').delete().eq('id', params.id)
    if (error) return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 500 })

    return NextResponse.json<ApiResponse>({ data: { id: params.id }, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'company') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const { data: company, error } = await supabase
      .from('companies')
      .select('id, company_name, industry, description, website, logo_url, address, postal_code')
      .eq('user_id', user.id)
      .single()

    if (error) return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 500 })

    return NextResponse.json<ApiResponse>({ data: company, error: null, success: true })
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
    if (!profile || profile.role !== 'company') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const body = await request.json()
    const { company_name, industry, description, website, logo_url, address, postal_code } = body

    if (!company_name?.trim()) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Nama perusahaan wajib diisi', success: false }, { status: 400 })
    }

    const { data: updated, error: updateError } = await supabase
      .from('companies')
      .update({
        company_name: company_name.trim(),
        industry: industry?.trim() || null,
        description: description?.trim() || null,
        website: website?.trim() || null,
        logo_url: logo_url?.trim() || null,
        address: address?.trim() || null,
        postal_code: postal_code?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select('id')
      .single()

    if (updateError || !updated) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Data perusahaan tidak ditemukan', success: false }, { status: 404 })
    }

    const { error: onboardingError } = await supabase
      .from('users')
      .update({ onboarding_completed: true })
      .eq('id', user.id)

    if (onboardingError) return NextResponse.json<ApiResponse>({ data: null, error: onboardingError.message, success: false }, { status: 500 })

    return NextResponse.json<ApiResponse>({ data: null, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}
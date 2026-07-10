import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

// GET /api/admin/companies/[id]
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const { data, error } = await supabase
      .from('companies')
      .select('*, users(id, full_name, email, phone, is_active), company_categories(id, category)')
      .eq('id', params.id)
      .single()

    if (error) return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 500 })
    return NextResponse.json<ApiResponse>({ data, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

// PATCH /api/admin/companies/[id]
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const body = await request.json()
    const serviceClient = createServiceClient()

    const ALLOWED_COMPANY_FIELDS = [
      'company_name', 'industry', 'description', 'website', 'logo_url',
      'is_active', 'address', 'postal_code', 'is_verified',
    ]

    // Jika body mengandung categories, update company_categories
    if ('categories' in body) {
      const categories: string[] = body.categories ?? []

      // Replace semua kategori
      await serviceClient.from('company_categories').delete().eq('company_id', params.id)
      if (categories.length > 0) {
        await serviceClient.from('company_categories').insert(
          categories.map((c) => ({ company_id: params.id, category: c }))
        )
      }
    }

    // Update kolom companies hanya field yang diizinkan
    const updateData: Record<string, unknown> = {}
    for (const field of ALLOWED_COMPANY_FIELDS) {
      if (field in body) updateData[field] = body[field]
    }

    if (Object.keys(updateData).length > 0) {
      const { data, error } = await serviceClient
        .from('companies')
        .update(updateData)
        .eq('id', params.id)
        .select()
        .single()

      if (error) return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 500 })
      return NextResponse.json<ApiResponse>({ data, error: null, success: true })
    }

    return NextResponse.json<ApiResponse>({ data: null, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

// DELETE /api/admin/companies/[id]
export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const serviceClient = createServiceClient()
    const { error } = await serviceClient.from('companies').delete().eq('id', params.id)
    if (error) return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 500 })

    return NextResponse.json<ApiResponse>({ data: null, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

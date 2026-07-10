import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const page = Math.max(1, Number(searchParams.get('page') ?? 1))
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') ?? 20)))
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    let query = supabase
      .from('companies')
      .select(`
        id, company_name, industry, description, website, logo_url, is_active, created_at, updated_at,
        users(id, full_name, email, is_active),
        company_categories(id, category)
      `, { count: 'exact' })
      .order('company_name')
      .range(from, to)

    if (search) {
      const safeSearch = search.replace(/[%_\\,.()\[\]]/g, '')
      if (safeSearch.length > 0) {
        query = query.ilike('company_name', `%${safeSearch}%`)
      }
    }

    const { data, count, error } = await query

    if (error) return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 500 })

    return NextResponse.json({
      data,
      total: count ?? 0,
      page,
      pageSize,
      totalPages: Math.ceil((count ?? 0) / pageSize),
      error: null,
      success: true,
    })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

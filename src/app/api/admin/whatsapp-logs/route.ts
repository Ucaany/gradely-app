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
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') ?? '10', 10)))
    const period = searchParams.get('period') ?? 'all' // '24h' | '1w' | 'all'

    let query = supabase
      .from('whatsapp_logs')
      .select('id, phone_number, message, status, error_message, sent_at, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (period !== 'all') {
      const now = new Date()
      const ms = period === '24h' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
      query = query.gte('created_at', new Date(now.getTime() - ms).toISOString())
    }

    const { data, count, error } = await query.range((page - 1) * pageSize, page * pageSize - 1)

    if (error) throw error

    return NextResponse.json<ApiResponse>({
      data: {
        logs: data ?? [],
        total: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      },
      error: null,
      success: true,
    })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const body = await request.json()
    const { university_id, settings } = body

    if (!university_id || !settings) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Data tidak valid', success: false }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Upsert setiap setting key
    const upserts = Object.entries(settings as Record<string, string>).map(
      ([key, value]) => ({
        university_id,
        key,
        value: value ?? '',
      })
    )

    const { error } = await serviceClient
      .from('settings')
      .upsert(upserts, { onConflict: 'university_id,key' })

    if (error) {
      return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 500 })
    }

    return NextResponse.json<ApiResponse>({ data: { saved: upserts.length }, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

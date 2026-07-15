import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

const ALLOWED_SETTING_KEYS = new Set([
  'ai_api_key',
  'ai_base_url',
  'ai_model',
  'ai_vision_api_key',
  'ai_vision_base_url',
  'ai_vision_model',
  'gemini_api_key',
  'fonnte_token',
  'notification_enabled',
])

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role, university_id')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const university_id = profile.university_id ?? null
    if (!university_id) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'University tidak ditemukan untuk akun admin ini', success: false }, { status: 400 })
    }

    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Data tidak valid', success: false }, { status: 400 })
    }

    const serviceClient = createServiceClient()

    // Hanya upsert key yang ada dalam allowlist
    const upserts = Object.entries(settings as Record<string, string>)
      .filter(([key]) => ALLOWED_SETTING_KEYS.has(key))
      .map(([key, value]) => ({
        university_id,
        key,
        value: value ?? '',
      }))

    if (upserts.length === 0) {
      return NextResponse.json<ApiResponse>({ data: { saved: 0 }, error: null, success: true })
    }

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

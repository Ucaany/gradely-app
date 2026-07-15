import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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
    const { fonnte_token } = body

    if (!fonnte_token) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Token Fonnte diperlukan', success: false }, { status: 400 })
    }

    const res = await fetch('https://api.fonnte.com/device', {
      method: 'POST',
      headers: { Authorization: fonnte_token },
      signal: AbortSignal.timeout(8000),
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok || json.status === false) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: json.reason ?? json.message ?? 'Token tidak valid', success: false },
        { status: 400 }
      )
    }

    return NextResponse.json<ApiResponse>({ data: { connected: true, device: json.device ?? null, name: json.name ?? null, status: json.device_status ?? null }, error: null, success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Koneksi ke Fonnte gagal'
    return NextResponse.json<ApiResponse>({ data: null, error: msg, success: false }, { status: 400 })
  }
}

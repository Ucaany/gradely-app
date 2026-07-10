import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

function isValidPublicHttpsUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'https:') return false
    const h = parsed.hostname
    if (
      h === 'localhost' ||
      /^127\./.test(h) ||
      /^10\./.test(h) ||
      /^192\.168\./.test(h) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
      h === '169.254.169.254' ||
      h.endsWith('.internal') ||
      h.endsWith('.local')
    ) return false
    return true
  } catch {
    return false
  }
}

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
    const { waha_url, waha_session, waha_api_key } = body

    if (!waha_url || !waha_session) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'WAHA URL dan Session diperlukan', success: false }, { status: 400 })
    }

    if (!isValidPublicHttpsUrl(waha_url)) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: 'WAHA URL tidak valid. Gunakan HTTPS dan pastikan bukan alamat jaringan lokal.', success: false },
        { status: 400 }
      )
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (waha_api_key) {
      headers['X-Api-Key'] = waha_api_key
    }

    // Test WAHA connection
    const res = await fetch(`${waha_url}/api/sessions/${waha_session}`, {
      headers,
      signal: AbortSignal.timeout(5000),
    })

    if (!res.ok) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: `WAHA merespons dengan status ${res.status}`, success: false },
        { status: 400 }
      )
    }

    return NextResponse.json<ApiResponse>({ data: { connected: true }, error: null, success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Koneksi ke WAHA gagal'
    return NextResponse.json<ApiResponse>({ data: null, error: msg, success: false }, { status: 400 })
  }
}

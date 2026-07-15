import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role, university_id').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const checks = await Promise.allSettled([
      supabase.from('users').select('id', { count: 'exact', head: true }).limit(1),
      supabase.from('settings').select('key').eq('university_id', profile.university_id).in('key', ['waha_url', 'waha_session']).limit(2),
    ])

    const dbOk = checks[0].status === 'fulfilled' && !('error' in checks[0].value && checks[0].value.error)

    const wahaConfigured = checks[1].status === 'fulfilled' &&
      !(checks[1].value.error) &&
      ((checks[1].value.data?.length ?? 0) >= 2)

    let wahaOk = false
    if (wahaConfigured && checks[1].status === 'fulfilled') {
      try {
        const wahaMap = Object.fromEntries(
          (checks[1].value.data ?? []).map((s: { key: string; value?: string }) => [s.key, s.value ?? ''])
        )
        const wahaUrl = wahaMap['waha_url']
        if (wahaUrl) {
          const pingRes = await fetch(`${wahaUrl}/api/version`, {
            signal: AbortSignal.timeout(5000),
          })
          wahaOk = pingRes.ok
        }
      } catch {
        wahaOk = false
      }
    }

    const data = [
      { label: 'Database', status: dbOk ? 'Aktif' : 'Error', ok: dbOk },
      { label: 'Autentikasi', status: 'Aktif', ok: true },
      { label: 'Notifikasi WhatsApp', status: wahaConfigured ? (wahaOk ? 'Aktif' : 'Tidak Terjangkau') : 'Belum Dikonfigurasi', ok: wahaOk },
    ]

    return NextResponse.json<ApiResponse>({ data, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

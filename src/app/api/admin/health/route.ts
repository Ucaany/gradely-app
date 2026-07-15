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
      supabase.from('settings').select('key, value').eq('university_id', profile.university_id).eq('key', 'fonnte_token').limit(1),
    ])

    const dbOk = checks[0].status === 'fulfilled' && !('error' in checks[0].value && checks[0].value.error)

    // Fonnte: cek apakah fonnte_token sudah tersimpan di settings
    const fonnteRow = checks[1].status === 'fulfilled' ? (checks[1].value.data ?? []) : []
    const fonnteToken = fonnteRow.length > 0 ? (fonnteRow[0] as { key: string; value?: string }).value ?? '' : ''
    const fonnteConfigured = fonnteToken.trim().length > 0

    // Verifikasi token Fonnte dengan hit /device endpoint
    let fonnteOk = false
    if (fonnteConfigured) {
      try {
        const pingRes = await fetch('https://api.fonnte.com/device', {
          method: 'GET',
          headers: { Authorization: fonnteToken },
          signal: AbortSignal.timeout(6000),
        })
        if (pingRes.ok) {
          const json = await pingRes.json()
          // Fonnte returns status true when device is connected
          fonnteOk = json?.status === true
        }
      } catch {
        fonnteOk = false
      }
    }

    const data = [
      { label: 'Database', status: dbOk ? 'Aktif' : 'Error', ok: dbOk },
      { label: 'Autentikasi', status: 'Aktif', ok: true },
      { label: 'Notifikasi WhatsApp', status: fonnteConfigured ? (fonnteOk ? 'Aktif' : 'Perangkat Tidak Terhubung') : 'Belum Dikonfigurasi', ok: fonnteOk },
    ]

    return NextResponse.json<ApiResponse>({ data, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

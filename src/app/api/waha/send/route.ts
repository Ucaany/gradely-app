import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendAndLog } from '@/lib/fonnte'
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
    const { university_id, phone, message, recipient_id } = body

    if (!university_id || !phone || !message) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: 'university_id, phone, dan message wajib diisi', success: false },
        { status: 400 }
      )
    }

    const result = await sendAndLog(university_id, {
      phone,
      message,
      recipientId: recipient_id ?? undefined,
    })

    if (!result.success) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: result.error ?? 'Gagal mengirim pesan', success: false },
        { status: 400 }
      )
    }

    return NextResponse.json<ApiResponse>({ data: { sent: true }, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

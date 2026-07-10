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
    const { api_key, base_url, model } = body as { api_key: string; base_url: string; model: string }

    if (!api_key?.trim()) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'API key diperlukan', success: false }, { status: 400 })
    }

    const rawUrl = (base_url || 'https://9prxy.sribuai.my.id/v1').replace(/\/$/, '')
    try {
      const parsed = new URL(rawUrl)
      if (parsed.protocol !== 'https:') throw new Error('non-https')
      const hostname = parsed.hostname
      if (
        hostname === 'localhost' ||
        /^127\./.test(hostname) ||
        /^10\./.test(hostname) ||
        /^192\.168\./.test(hostname) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
        hostname === '169.254.169.254' ||
        hostname.endsWith('.internal') ||
        hostname.endsWith('.local')
      ) {
        throw new Error('private-host')
      }
    } catch {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Base URL tidak valid. Gunakan HTTPS dengan domain publik.', success: false }, { status: 400 })
    }

    const url = `${rawUrl}/chat/completions`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${api_key.trim()}`,
      },
      body: JSON.stringify({
        model: model?.trim() || 'kr/auto',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      }),
    })

    if (!res.ok) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'API tidak dapat dijangkau', success: false }, { status: 502 })
    }

    return NextResponse.json<ApiResponse>({ data: { ok: true }, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

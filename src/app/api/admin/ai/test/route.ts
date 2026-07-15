import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role, university_id').eq('id', user.id).single()
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const body = await request.json()
    const { api_key, base_url, model, config_type } = body as {
      api_key: string | null
      base_url: string
      model: string
      config_type?: 'text' | 'vision'
    }

    const keyPrefix = config_type === 'vision' ? 'ai_vision_' : 'ai_'

    let resolvedApiKey = api_key?.trim() ?? ''

    if (!resolvedApiKey && profile.university_id) {
      const { data: settingRows } = await supabase
        .from('settings')
        .select('key, value')
        .eq('university_id', profile.university_id)
        .in('key', [`${keyPrefix}api_key`])
      const settingsMap = Object.fromEntries((settingRows ?? []).map(r => [r.key, r.value]))
      resolvedApiKey = settingsMap[`${keyPrefix}api_key`] ?? process.env.AI_API_KEY ?? ''
    }

    if (!resolvedApiKey) {
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
        Authorization: `Bearer ${resolvedApiKey}`,
      },
      body: JSON.stringify({
        model: model?.trim() || 'kr/auto',
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      let userMsg = 'API tidak dapat dijangkau'
      if (res.status === 401) userMsg = 'API key tidak valid atau tidak memiliki akses.'
      else if (res.status === 403) userMsg = 'API key tidak memiliki izin untuk model ini.'
      else if (res.status === 404) userMsg = `Model "${model}" tidak ditemukan di endpoint ini.`
      else if (res.status === 429) userMsg = 'Rate limit tercapai. Coba lagi beberapa saat.'
      else if (res.status >= 500) userMsg = `Server AI error ${res.status}.`
      void errBody
      return NextResponse.json<ApiResponse>({ data: null, error: userMsg, success: false }, { status: 502 })
    }

    return NextResponse.json<ApiResponse>({ data: { ok: true }, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

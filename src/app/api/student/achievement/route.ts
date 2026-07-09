import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'
import { z } from 'zod'

const achievementSchema = z.object({
  achievement_title: z.string().min(2, 'Judul minimal 2 karakter').max(200).optional().nullable(),
  achievement_description: z.string().max(1000).optional().nullable(),
  achievement_ipk_target: z.number().min(0).max(4).optional().nullable(),
  achievement_sks_target: z.number().int().min(0).max(300).optional().nullable(),
  achievement_semester_target: z.number().int().min(1).max(14).optional().nullable(),
  achievement_skills: z.array(z.string().max(100)).max(20).optional().nullable(),
  achievement_certificates: z.array(z.string().max(200)).max(20).optional().nullable(),
  achievement_internship: z.string().max(300).optional().nullable(),
  achievement_thesis_topic: z.string().max(300).optional().nullable(),
})

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data, error } = await supabase
      .from('student_targets')
      .select('achievement_title, achievement_description, achievement_ipk_target, achievement_sks_target, achievement_semester_target, achievement_skills, achievement_certificates, achievement_internship, achievement_thesis_topic, achievement_updated_at')
      .eq('student_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 500 })
    }

    return NextResponse.json({ data: data ?? null, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'student') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const body = await request.json()
    const parsed = achievementSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: parsed.error.issues.map((e) => e.message).join(', '), success: false },
        { status: 422 }
      )
    }

    const { data: existing } = await supabase
      .from('student_targets')
      .select('id')
      .eq('student_id', user.id)
      .single()

    if (!existing) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: 'Atur target kelulusan terlebih dahulu sebelum mengisi capaian.', success: false },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('student_targets')
      .update({
        ...parsed.data,
        achievement_updated_at: new Date().toISOString(),
      })
      .eq('student_id', user.id)
      .select()
      .single()

    if (error) return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 500 })

    return NextResponse.json({ data, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { studentTargetSchema } from '@/lib/validations'
import type { ApiResponse } from '@/types'

// GET /api/student/target
export async function GET() {
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

    const { data, error } = await supabase
      .from('student_targets')
      .select('*')
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

// POST /api/student/target — upsert target kelulusan beserta skill & industri
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
    const parsed = studentTargetSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        { data: null, error: parsed.error.issues.map((e) => e.message).join(', '), success: false },
        { status: 422 }
      )
    }

    const { data, error } = await supabase
      .from('student_targets')
      .upsert(
        {
          student_id: user.id,
          target_semester: parsed.data.target_semester,
          target_ipk: parsed.data.target_ipk ?? null,
          target_years: parsed.data.target_years ?? null,
          career_goal: parsed.data.career_goal ?? null,
          notes: parsed.data.notes ?? null,
          target_skills: parsed.data.target_skills ?? [],
          target_industries: parsed.data.target_industries ?? [],
        },
        { onConflict: 'student_id' }
      )
      .select()
      .single()

    if (error) return NextResponse.json<ApiResponse>({ data: null, error: error.message, success: false }, { status: 500 })

    return NextResponse.json({ data, error: null, success: true }, { status: 201 })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

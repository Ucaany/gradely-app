import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

// GET /api/student/onboarding/companies?skills=A,B,C
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const skillsParam = new URL(request.url).searchParams.get('skills') ?? ''
    const skills = skillsParam.split(',').map(s => s.trim()).filter(Boolean)

    const relevantIndustries = new Set<string>()

    if (skills.length > 0) {
      // Look up skill IDs from DB
      const { data: skillRows } = await supabase
        .from('skill_options')
        .select('id, name')
        .in('name', skills)
        .eq('is_active', true)

      if (skillRows && skillRows.length > 0) {
        const skillIds = skillRows.map(s => s.id)
        // Fetch mapped industries
        const { data: mapRows } = await supabase
          .from('skill_industry_map')
          .select('industry_options(name)')
          .in('skill_id', skillIds)

        for (const row of mapRows ?? []) {
          const ind = (Array.isArray(row.industry_options) ? row.industry_options[0] : row.industry_options) as { name: string } | null
          if (ind?.name) relevantIndustries.add(ind.name)
        }
      }
    }

    let query = supabase
      .from('companies')
      .select('id, company_name, industry, description, website, logo_url, company_categories(category)')
      .eq('is_active', true)
      .limit(12)

    if (relevantIndustries.size > 0) {
      query = query.in('industry', Array.from(relevantIndustries))
    }

    const { data: companies } = await query

    return NextResponse.json({
      data: { companies: companies ?? [], industries: Array.from(relevantIndustries) },
      error: null,
      success: true,
    })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

// POST /api/student/onboarding/companies — complete onboarding
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase
      .from('users')
      .select('role, onboarding_completed')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'student') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    if (profile.onboarding_completed) {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Onboarding sudah selesai', success: false }, { status: 409 })
    }

    const body = await request.json()
    const { skills, interested_company_ids, skill_not_found } = body as {
      skills: string[]
      interested_company_ids: string[]
      skill_not_found?: boolean
    }

    // Save career interests (skills)
    await supabase.from('career_interests').delete().eq('student_id', user.id)
    if (!skill_not_found && skills?.length) {
      const inserts = skills.map((s: string) => ({ student_id: user.id, interest: s }))
      await supabase.from('career_interests').insert(inserts)
    }

    // Save interested companies
    await supabase.from('student_company_interests').delete().eq('student_id', user.id)
    if (interested_company_ids?.length) {
      const companyInserts = interested_company_ids.map((company_id: string) => ({
        student_id: user.id,
        company_id,
      }))
      await supabase.from('student_company_interests').insert(companyInserts)
    }

    // Mark onboarding complete
    await supabase
      .from('users')
      .update({ onboarding_completed: true })
      .eq('id', user.id)

    return NextResponse.json({ data: { completed: true }, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

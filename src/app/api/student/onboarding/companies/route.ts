import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

// GET /api/student/onboarding/companies?skills=A,B&industries=X,Y
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const params = new URL(request.url).searchParams
    const skills = (params.get('skills') ?? '').split(',').map(s => s.trim()).filter(Boolean)
    const industriesParam = (params.get('industries') ?? '').split(',').map(s => s.trim()).filter(Boolean)

    const relevantIndustries = new Set<string>(industriesParam)

    if (skills.length > 0) {
      const { data: skillRows } = await supabase
        .from('skill_options')
        .select('id, name')
        .in('name', skills)
        .eq('is_active', true)

      if (skillRows && skillRows.length > 0) {
        const skillIds = skillRows.map(s => s.id)
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

    const selectFields = 'id, company_name, industry, description, website, logo_url, company_categories(category)'

    let query = supabase
      .from('companies')
      .select(selectFields)
      .eq('is_active', true)
      .order('company_name')
      .limit(24)

    if (relevantIndustries.size > 0) {
      query = query.in('industry', Array.from(relevantIndustries))
    }

    const { data: companies } = await query

    let finalCompanies = companies ?? []
    if (finalCompanies.length === 0 && relevantIndustries.size > 0) {
      const { data: allCompanies } = await supabase
        .from('companies')
        .select(selectFields)
        .eq('is_active', true)
        .order('company_name')
        .limit(24)
      finalCompanies = allCompanies ?? []
    }

    return NextResponse.json({
      data: { companies: finalCompanies, industries: Array.from(relevantIndustries) },
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
    const {
      selected_careers,
      selected_industries,
      profile_visible,
    } = body as {
      selected_careers?: string[]
      selected_industries?: string[]
      profile_visible?: boolean
    }

    const finalIndustries = (selected_industries ?? []).filter(Boolean)

    // Save career interests from CAREER_OPTIONS selection
    await supabase.from('career_interests').delete().eq('student_id', user.id)
    if (selected_careers?.length) {
      const inserts = selected_careers.map((interest: string) => ({ student_id: user.id, interest }))
      await supabase.from('career_interests').insert(inserts)
    }

    // Persist industries to student_targets (seed if none yet)
    const { data: existingTarget } = await supabase
      .from('student_targets')
      .select('id, target_semester')
      .eq('student_id', user.id)
      .maybeSingle()

    if (existingTarget) {
      await supabase
        .from('student_targets')
        .update({
          target_industries: finalIndustries,
        })
        .eq('student_id', user.id)
    } else {
      await supabase
        .from('student_targets')
        .insert({
          student_id: user.id,
          target_semester: 8,
          target_skills: [],
          target_industries: finalIndustries,
        })
    }

    // Mark onboarding complete + set profile visibility
    await supabase
      .from('users')
      .update({ onboarding_completed: true, profile_visible: profile_visible ?? false })
      .eq('id', user.id)

    return NextResponse.json({ data: { completed: true }, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

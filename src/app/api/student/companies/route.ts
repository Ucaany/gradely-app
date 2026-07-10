import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'student') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const { data: careerInterests } = await supabase
      .from('career_interests')
      .select('interest')
      .eq('student_id', user.id)

    const interests = (careerInterests ?? []).map(c => c.interest)

    const { data: interestedCompanies } = await supabase
      .from('student_company_interests')
      .select('company_id')
      .eq('student_id', user.id)

    const interestedIds = (interestedCompanies ?? []).map(c => c.company_id)

    let relevantIndustries: string[] = []

    if (interests.length > 0) {
      const { data: skillRows } = await supabase
        .from('skill_options')
        .select('id')
        .in('name', interests)
        .eq('is_active', true)

      if (skillRows && skillRows.length > 0) {
        const skillIds = skillRows.map(s => s.id)
        const { data: mapRows } = await supabase
          .from('skill_industry_map')
          .select('industry_options(name)')
          .in('skill_id', skillIds)

        const industriesSet = new Set<string>()
        for (const row of mapRows ?? []) {
          const ind = (Array.isArray(row.industry_options) ? row.industry_options[0] : row.industry_options) as { name: string } | null
          if (ind?.name) industriesSet.add(ind.name)
        }
        relevantIndustries = Array.from(industriesSet)
      }
    }

    let companiesQuery = supabase
      .from('companies')
      .select('id, company_name, industry, description, website, logo_url, company_categories(category)')
      .eq('is_active', true)

    if (relevantIndustries.length > 0) {
      companiesQuery = companiesQuery.in('industry', relevantIndustries)
    }

    const { data: companies } = await companiesQuery.limit(20)

    const result = (companies ?? []).map(c => ({
      ...c,
      is_interested: interestedIds.includes(c.id),
    }))

    return NextResponse.json<ApiResponse>({
      data: { companies: result, interests, relevant_industries: relevantIndustries },
      error: null,
      success: true,
    })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (!profile || profile.role !== 'student') {
      return NextResponse.json<ApiResponse>({ data: null, error: 'Forbidden', success: false }, { status: 403 })
    }

    const { company_id, interested } = await request.json()
    if (!company_id) return NextResponse.json<ApiResponse>({ data: null, error: 'company_id wajib diisi', success: false }, { status: 400 })

    if (interested) {
      await supabase.from('student_company_interests').upsert({ student_id: user.id, company_id }, { onConflict: 'student_id,company_id' })
    } else {
      await supabase.from('student_company_interests').delete().eq('student_id', user.id).eq('company_id', company_id)
    }

    return NextResponse.json<ApiResponse>({ data: null, error: null, success: true })
  } catch {
    return NextResponse.json<ApiResponse>({ data: null, error: 'Internal server error', success: false }, { status: 500 })
  }
}

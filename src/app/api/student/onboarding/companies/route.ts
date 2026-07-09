import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

const SKILL_INDUSTRY_MAP: Record<string, string[]> = {
  'Desain Grafis': ['Kreatif & Desain', 'Periklanan', 'Media'],
  'UI/UX Design': ['Teknologi', 'Kreatif & Desain', 'Startup'],
  'Ilustrasi': ['Kreatif & Desain', 'Penerbitan', 'Media'],
  'Fotografi': ['Media', 'Periklanan', 'Kreatif & Desain'],
  'Videografi': ['Media', 'Periklanan', 'Entertainment'],
  'Animasi': ['Media', 'Entertainment', 'Teknologi'],
  'Musik': ['Entertainment', 'Media', 'Kreatif & Desain'],
  'Seni Pertunjukan': ['Entertainment', 'Kreatif & Desain'],
  'Kriya & Kerajinan': ['Kreatif & Desain', 'Ritel'],
  'Arsitektur': ['Konstruksi', 'Properti', 'Kreatif & Desain'],
  'Fashion Design': ['Fashion', 'Ritel', 'Kreatif & Desain'],
  'Branding': ['Periklanan', 'Kreatif & Desain', 'Startup'],
  'Social Media': ['Periklanan', 'Media', 'Startup'],
  'Copywriting': ['Periklanan', 'Media', 'Startup'],
  'Web Development': ['Teknologi', 'Startup'],
  'Mobile Development': ['Teknologi', 'Startup'],
}

// GET /api/student/onboarding/companies?skills=A,B,C
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json<ApiResponse>({ data: null, error: 'Unauthorized', success: false }, { status: 401 })

    const skillsParam = new URL(request.url).searchParams.get('skills') ?? ''
    const skills = skillsParam.split(',').map(s => s.trim()).filter(Boolean)

    const relevantIndustries = new Set<string>()
    for (const skill of skills) {
      const industries = SKILL_INDUSTRY_MAP[skill] ?? []
      industries.forEach(i => relevantIndustries.add(i))
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
    const { skills, interested_company_ids } = body as { skills: string[]; interested_company_ids: string[] }

    // Save career interests (skills)
    if (skills?.length) {
      await supabase.from('career_interests').delete().eq('student_id', user.id)
      const inserts = skills.map((s: string) => ({ student_id: user.id, interest: s }))
      await supabase.from('career_interests').insert(inserts)
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

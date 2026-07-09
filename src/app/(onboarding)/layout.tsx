import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role, onboarding_completed')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'student') redirect('/login')
  if (profile.onboarding_completed) redirect('/student/dashboard')

  return <>{children}</>
}

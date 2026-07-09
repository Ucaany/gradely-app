import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function CompanyDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Dashboard Perusahaan</h1>
      <p className="text-muted-foreground mt-2">Fitur ini akan tersedia di Phase 4.</p>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Dashboard Mahasiswa</h1>
      <p className="text-muted-foreground mt-2">Fitur ini akan tersedia di Phase 2.</p>
    </div>
  )
}

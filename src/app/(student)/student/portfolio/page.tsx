import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Briefcase } from 'lucide-react'

export default async function StudentPortfolioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Portofolio</h1>
        <p className="text-sm text-muted-foreground">Kelola portofolio dan karya kamu</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <Briefcase className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">Fitur portofolio akan tersedia di Phase 4.</p>
        </CardContent>
      </Card>
    </div>
  )
}

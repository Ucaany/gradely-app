import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Heart } from 'lucide-react'

export default async function StudentCareerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Minat Karier</h1>
        <p className="text-sm text-muted-foreground">Atur minat karier dan lihat perusahaan yang relevan</p>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
          <Heart className="h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">Fitur minat karier akan tersedia di Phase 4.</p>
        </CardContent>
      </Card>
    </div>
  )
}

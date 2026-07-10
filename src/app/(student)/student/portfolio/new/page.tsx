import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PortfolioForm } from '@/components/student/portfolio-form'
import type { PortfolioCategory } from '@/types'

async function getCategories(): Promise<PortfolioCategory[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('portfolio_categories')
    .select('id, code, name')
    .order('name')
  return data ?? []
}

export default async function NewPortfolioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const categories = await getCategories()

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <PortfolioForm categories={categories} />
    </div>
  )
}

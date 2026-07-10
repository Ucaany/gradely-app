import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { PortfolioForm } from '@/components/student/portfolio-form'
import type { PortfolioCategory, StudentPortfolioWithCategory } from '@/types'

async function getCategories(): Promise<PortfolioCategory[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('portfolio_categories')
    .select('id, code, name')
    .order('name')
  return data ?? []
}

export default async function EditPortfolioPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { id } = await params

  const { data: item } = await supabase
    .from('student_portfolios')
    .select('*, portfolio_categories(id, code, name)')
    .eq('id', id)
    .eq('student_id', user.id)
    .single()

  if (!item) notFound()

  const categories = await getCategories()

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <PortfolioForm categories={categories} editItem={item as StudentPortfolioWithCategory} />
    </div>
  )
}

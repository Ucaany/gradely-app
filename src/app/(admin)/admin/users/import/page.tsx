import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ImportCsvForm } from '@/components/admin/import-csv-form'

export default async function ImportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: university } = await supabase
    .from('universities')
    .select('id')
    .limit(1)
    .single()

  return <ImportCsvForm universityId={university?.id ?? ''} />
}

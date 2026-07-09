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

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Import CSV</h1>
          <p className="text-sm text-muted-foreground">Import data mahasiswa atau dosen dari file CSV</p>
        </div>
        
        <ImportCsvForm universityId={university?.id ?? ''} />
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateUserForm } from '@/components/shared/create-user-form'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default async function NewCompanyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: universities } = await supabase
    .from('universities')
    .select('id, name')
    .limit(1)
    .single()

  const universityId = universities?.id ?? ''

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold tracking-tight">Tambah Perusahaan</h1>
        <p className="text-sm text-muted-foreground">Buat akun baru untuk perusahaan mitra</p>
      </div>
      {!universityId && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Data Universitas Belum Ada</AlertTitle>
          <AlertDescription>
            Jalankan migration seed <code className="font-mono text-xs">002_seed_isi_yogyakarta.sql</code> di Supabase SQL Editor terlebih dahulu, lalu refresh halaman ini.
          </AlertDescription>
        </Alert>
      )}
      <CreateUserForm
        studyPrograms={[]}
        universityId={universityId}
        defaultRole="company"
        redirectTo="/admin/users/companies"
      />
    </div>
  )
}

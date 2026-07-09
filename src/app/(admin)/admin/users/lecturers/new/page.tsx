import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateUserForm } from '@/components/shared/create-user-form'

export default async function NewLecturerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: universities } = await supabase
    .from('universities')
    .select('id')
    .limit(1)
    .single()

  const { data: studyPrograms } = await supabase
    .from('study_programs')
    .select('id, name, short_name, degree_level, university_id, is_active, created_at')
    .eq('is_active', true)
    .order('name')

  const universityId = universities?.id ?? ''

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold tracking-tight">Tambah Dosen Wali</h1>
        <p className="text-sm text-muted-foreground">Buat akun baru untuk dosen wali</p>
      </div>
      <CreateUserForm
        studyPrograms={studyPrograms ?? []}
        universityId={universityId}
        defaultRole="lecturer"
        redirectTo="/admin/users/lecturers"
      />
    </div>
  )
}

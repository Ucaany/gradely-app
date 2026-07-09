import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateUserForm } from '@/components/shared/create-user-form'

export default async function NewStudentPage() {
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
    <div className="flex flex-1 flex-col items-center gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Tambah Mahasiswa</h1>
          <p className="text-sm text-muted-foreground">Buat akun baru untuk mahasiswa</p>
        </div>
        
        <CreateUserForm
          studyPrograms={studyPrograms ?? []}
          universityId={universityId}
          defaultRole="student"
          redirectTo="/admin/users/students"
        />
      </div>
    </div>
  )
}

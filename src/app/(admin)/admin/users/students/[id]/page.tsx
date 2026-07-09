import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatDate, getInitials } from '@/lib/utils'
import { UserDetailActions } from '@/components/admin/user-detail-actions'

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: student }, { data: studyPrograms }] = await Promise.all([
    supabase.from('users').select('*, study_programs(id, name, short_name), universities(id, name, short_name)').eq('id', params.id).eq('role', 'student').single(),
    supabase.from('study_programs').select('id, name, short_name, degree_level, university_id, is_active, created_at').eq('is_active', true).order('name'),
  ])

  if (!student) notFound()

  const studyProgram = ((Array.isArray(student.study_programs) ? student.study_programs[0] : student.study_programs) as { name: string } | null)?.name ?? '-'
  const university = ((Array.isArray(student.universities) ? student.universities[0] : student.universities) as { name: string } | null)?.name ?? '-'

  const infoRows = [
    { label: 'NIM', value: student.nim ?? '-' },
    { label: 'No. HP', value: student.phone ?? '-' },
    { label: 'Program Studi', value: studyProgram },
    { label: 'Semester Aktif', value: student.current_semester ? `Semester ${student.current_semester}` : '-' },
    { label: 'Universitas', value: university },
    { label: 'Terdaftar', value: formatDate(student.created_at) },
    { label: 'Profil ke Perusahaan', value: student.profile_visible ? 'Terlihat' : 'Tersembunyi' },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold tracking-tight">Detail Mahasiswa</h1>
        <p className="text-sm text-muted-foreground">Informasi lengkap akun mahasiswa</p>
      </div>

      <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 shrink-0">
                  <AvatarImage src={student.avatar_url ?? ''} />
                  <AvatarFallback className="text-lg">{getInitials(student.full_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg">{student.full_name}</CardTitle>
                    <Badge variant="outline" className={`shrink-0 text-xs ${student.is_active ? 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800' : 'text-muted-foreground'}`}>
                      {student.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                  <CardDescription className="mt-1 text-sm">{student.email}</CardDescription>
                </div>
              </div>
              <div className="shrink-0 self-start">
                <UserDetailActions userId={student.id} userData={student} studyPrograms={studyPrograms ?? []} />
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {infoRows.map((row) => (
                <div key={row.label} className="space-y-0.5">
                  <p className="text-xs text-muted-foreground">{row.label}</p>
                  <p className="text-sm font-medium">{row.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
      </Card>
    </div>
  )
}

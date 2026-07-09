import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatDate, getInitials } from '@/lib/utils'
import { UserDetailActions } from '@/components/admin/user-detail-actions'

export default async function LecturerDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: lecturer }, { data: advisees }, { data: studyPrograms }] = await Promise.all([
    supabase.from('users').select('*, study_programs(id, name, short_name), universities(id, name, short_name)').eq('id', params.id).eq('role', 'lecturer').single(),
    supabase.from('advisor_students').select('id, student_id, users!advisor_students_student_id_fkey(full_name, nim, current_semester)').eq('lecturer_id', params.id),
    supabase.from('study_programs').select('id, name, short_name, degree_level, university_id, is_active, created_at').eq('is_active', true).order('name'),
  ])

  if (!lecturer) notFound()

  const studyProgram = ((Array.isArray(lecturer.study_programs) ? lecturer.study_programs[0] : lecturer.study_programs) as { name: string } | null)?.name ?? '-'
  const infoRows = [
    { label: 'No. HP', value: lecturer.phone ?? '-' },
    { label: 'Program Studi', value: studyProgram },
    { label: 'Terdaftar', value: formatDate(lecturer.created_at) },
    { label: 'Mahasiswa Bimbingan', value: `${advisees?.length ?? 0} mahasiswa` },
  ]

  return (
    <div className="flex flex-1 flex-col items-center gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-4">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Detail Dosen Wali</h1>
          <p className="text-sm text-muted-foreground">Informasi lengkap akun dosen wali</p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 shrink-0">
                  <AvatarImage src={lecturer.avatar_url ?? ''} />
                  <AvatarFallback className="text-lg">{getInitials(lecturer.full_name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-lg">{lecturer.full_name}</CardTitle>
                    <Badge variant="outline" className={`shrink-0 text-xs ${lecturer.is_active ? 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800' : 'text-muted-foreground'}`}>
                      {lecturer.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                  <CardDescription className="mt-1 text-sm">{lecturer.email}</CardDescription>
                </div>
              </div>
              <div className="shrink-0 self-start">
                <UserDetailActions userId={lecturer.id} userData={lecturer} studyPrograms={studyPrograms ?? []} />
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

        {advisees && advisees.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Mahasiswa Bimbingan</CardTitle>
              <CardDescription>{advisees.length} mahasiswa</CardDescription>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <div className="w-full overflow-x-auto">
                {advisees.map((a, i) => {
                  const s = (Array.isArray(a.users) ? a.users[0] : a.users) as { full_name: string; nim: string | null; current_semester: number | null } | null
                  return (
                    <div key={a.id}>
                      <div className="flex items-center justify-between px-6 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{s?.full_name ?? '-'}</p>
                          <p className="text-xs text-muted-foreground">{s?.nim ?? '-'} · Semester {s?.current_semester ?? '-'}</p>
                        </div>
                        <Button asChild variant="ghost" size="sm" className="shrink-0 ml-2">
                          <Link href={`/admin/users/students/${a.student_id}`}>Detail</Link>
                        </Button>
                      </div>
                      {i < advisees.length - 1 && <Separator />}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { getInitials, formatDate } from '@/lib/utils'

export default async function LecturerProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email, phone, avatar_url, employee_id, is_active, created_at, study_programs(name, short_name), universities(name, short_name)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const studyProgram = (profile.study_programs && typeof profile.study_programs === 'object' && !Array.isArray(profile.study_programs))
    ? (profile.study_programs as { name: string; short_name: string | null }).name
    : '-'

  const university = (profile.universities && typeof profile.universities === 'object' && !Array.isArray(profile.universities))
    ? (profile.universities as { name: string; short_name: string | null }).name
    : '-'

  const { count: totalStudents } = await supabase
    .from('advisor_students')
    .select('id', { count: 'exact', head: true })
    .eq('lecturer_id', user.id)

  const infoRows = [
    { label: 'Email', value: profile.email },
    { label: 'No. HP', value: profile.phone ?? '-' },
    { label: 'NIP / ID Pegawai', value: profile.employee_id ?? '-' },
    { label: 'Program Studi', value: studyProgram },
    { label: 'Universitas', value: university },
    { label: 'Terdaftar', value: formatDate(profile.created_at) },
    { label: 'Mahasiswa Bimbingan', value: `${totalStudents ?? 0} mahasiswa` },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profil Saya</h1>
        <p className="text-sm text-muted-foreground">Informasi akun dosen wali</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarImage src={profile.avatar_url ?? ''} />
              <AvatarFallback className="text-lg">{getInitials(profile.full_name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-lg">{profile.full_name}</CardTitle>
                <Badge
                  variant="outline"
                  className={profile.is_active
                    ? 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                    : 'text-muted-foreground'}
                >
                  {profile.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>
              <CardDescription className="mt-1">Dosen Wali</CardDescription>
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

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { ArrowRight, Search } from 'lucide-react'
import { getInitials, formatGPA } from '@/lib/utils'
import { ACADEMIC_STATUS_CONFIG } from '@/lib/utils/academic'
import { getLecturerStudentData } from '@/lib/utils/lecturer-data'

export default async function LecturerStudentsPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { studentSummaries } = await getLecturerStudentData(user.id, {
    includeEmail: true,
    includePhone: true,
    searchQuery: searchParams.q,
  })

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mahasiswa Bimbingan</h1>
          <p className="text-sm text-muted-foreground">{studentSummaries.length} mahasiswa</p>
        </div>
        <form method="get" className="w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              name="q"
              placeholder="Cari nama atau NIM..."
              defaultValue={searchParams.q}
              className="pl-8 w-full sm:w-[300px]"
            />
          </div>
        </form>
      </div>

      {studentSummaries.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <p className="text-sm text-muted-foreground">
              {searchParams.q ? 'Tidak ada mahasiswa yang cocok dengan pencarian' : 'Belum ada mahasiswa bimbingan'}
            </p>
            {searchParams.q && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/lecturer/students">Reset Pencarian</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {studentSummaries.map(({ student, summary }) => {
          const cfg = ACADEMIC_STATUS_CONFIG[summary.academic_status]
          const prog = (student.study_programs && typeof student.study_programs === 'object' && !Array.isArray(student.study_programs))
            ? (student.study_programs as { name: string; short_name: string | null }).short_name ?? (student.study_programs as { name: string }).name
            : null

          return (
            <Card key={student.id} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 shrink-0">
                    <AvatarImage src={student.avatar_url ?? ''} />
                    <AvatarFallback>{getInitials(student.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{student.full_name}</CardTitle>
                    <CardDescription className="text-xs truncate">{student.nim ?? '-'}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Program Studi</p>
                    <p className="font-medium truncate">{prog ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Semester</p>
                    <p className="font-medium">{student.current_semester ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">IPK</p>
                    <p className="font-semibold tabular-nums">{formatGPA(summary.gpa)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">SKS</p>
                    <p className="font-medium">{summary.total_sks_earned}/{summary.total_sks_required}</p>
                  </div>
                </div>

                <Badge variant="outline" className={`${cfg.color} border-current w-full justify-center py-1`}>
                  {cfg.label}
                </Badge>

                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/lecturer/students/${student.id}`}>
                    Lihat Detail <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate, getInitials } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StudentsSearchForm } from '@/components/admin/students-search-form'

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: { search?: string; program?: string; page?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const page = Number(searchParams.page ?? 1)
  const pageSize = 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const [studentsQuery, programsRes] = await Promise.all([
    (() => {
      let q = supabase
        .from('users')
        .select('id, full_name, email, nim, current_semester, is_active, created_at, avatar_url, study_programs(id, name, short_name)', { count: 'exact' })
        .eq('role', 'student')
        .order('full_name')
        .range(from, to)
      if (searchParams.search) {
        q = q.or(`full_name.ilike.%${searchParams.search}%,email.ilike.%${searchParams.search}%,nim.ilike.%${searchParams.search}%`)
      }
      if (searchParams.program) {
        q = q.eq('study_program_id', searchParams.program)
      }
      return q
    })(),
    supabase.from('study_programs').select('id, name, short_name').eq('is_active', true).order('name'),
  ])

  const { data: students, count, error } = studentsQuery
  const programs = programsRes.data ?? []
  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mahasiswa</h1>
          <p className="text-sm text-muted-foreground">{count ?? 0} mahasiswa terdaftar</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/users/import">
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/users/students/new">
              <UserPlus className="h-4 w-4 mr-2" />
              Tambah
            </Link>
          </Button>
        </div>
      </div>

      <StudentsSearchForm
        programs={programs}
        defaultSearch={searchParams.search}
        defaultProgram={searchParams.program}
      />

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Gagal memuat data: {error.message}
        </div>
      )}

      <Card className="overflow-hidden">
        <CardHeader className="px-4 py-3 sm:px-6 border-b">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Menampilkan {students?.length ?? 0} dari {count ?? 0} mahasiswa
            {searchParams.program && programs.find(p => p.id === searchParams.program) && (
              <span className="ml-1">· {programs.find(p => p.id === searchParams.program)?.name}</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 sm:pl-6 min-w-[200px]">Mahasiswa</TableHead>
                  <TableHead className="min-w-[120px]">NIM</TableHead>
                  <TableHead className="min-w-[130px]">Program Studi</TableHead>
                  <TableHead className="min-w-[90px]">Semester</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="min-w-[110px]">Terdaftar</TableHead>
                  <TableHead className="pr-4 sm:pr-6 text-right min-w-[70px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students && students.length > 0 ? (
                  students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="pl-4 sm:pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={student.avatar_url ?? ''} />
                            <AvatarFallback className="text-xs">{getInitials(student.full_name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate max-w-[160px]">{student.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[160px]">{student.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono">{student.nim ?? '-'}</TableCell>
                      <TableCell className="text-sm">
                        {((Array.isArray(student.study_programs) ? student.study_programs[0] : student.study_programs) as { short_name: string | null } | null)?.short_name ?? '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {student.current_semester ? `Sem ${student.current_semester}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`whitespace-nowrap text-xs ${student.is_active ? 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800' : 'text-muted-foreground'}`}>
                          {student.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(student.created_at)}</TableCell>
                      <TableCell className="pr-4 sm:pr-6 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/users/students/${student.id}`}>Detail</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                      {searchParams.search || searchParams.program ? 'Tidak ada mahasiswa yang cocok.' : 'Belum ada mahasiswa terdaftar.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pb-2">
          {page > 1 && (
            <Button asChild variant="outline" size="sm">
              <Link href={`?page=${page - 1}${searchParams.search ? `&search=${searchParams.search}` : ''}${searchParams.program ? `&program=${searchParams.program}` : ''}`}>
                Sebelumnya
              </Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground">Halaman {page} dari {totalPages}</span>
          {page < totalPages && (
            <Button asChild variant="outline" size="sm">
              <Link href={`?page=${page + 1}${searchParams.search ? `&search=${searchParams.search}` : ''}${searchParams.program ? `&program=${searchParams.program}` : ''}`}>
                Berikutnya
              </Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

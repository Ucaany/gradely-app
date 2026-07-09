import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, Users } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import { formatDate, getInitials } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default async function LecturersPage({
  searchParams,
}: {
  searchParams: { search?: string; page?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const page = Number(searchParams.page ?? 1)
  const pageSize = 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('users')
    .select(`id, full_name, email, phone, is_active, created_at, avatar_url, join_code, study_programs(id, name, short_name)`, { count: 'exact' })
    .eq('role', 'lecturer')
    .order('full_name')
    .range(from, to)

  if (searchParams.search) {
    query = query.or(`full_name.ilike.%${searchParams.search}%,email.ilike.%${searchParams.search}%`)
  }

  const { data: lecturers, count } = await query

  // Ambil jumlah mahasiswa per dosen
  const lecturerIds = (lecturers ?? []).map((l) => l.id)
  let advisorCounts: Record<string, number> = {}
  if (lecturerIds.length > 0) {
    const { data: advisorRows } = await supabase
      .from('advisor_students')
      .select('lecturer_id')
      .in('lecturer_id', lecturerIds)
    for (const row of advisorRows ?? []) {
      advisorCounts[row.lecturer_id] = (advisorCounts[row.lecturer_id] ?? 0) + 1
    }
  }

  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dosen Wali</h1>
          <p className="text-sm text-muted-foreground">{count ?? 0} dosen terdaftar</p>
        </div>
        <Button asChild size="sm" className="shrink-0 self-start sm:self-auto">
          <Link href="/admin/users/lecturers/new">
            <UserPlus className="h-4 w-4 mr-2" />
            Tambah Dosen
          </Link>
        </Button>
      </div>

      <form method="GET" className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input name="search" defaultValue={searchParams.search} placeholder="Cari nama atau email..." className="w-full sm:max-w-sm" />
        <div className="flex gap-2">
          <Button type="submit" size="sm">Cari</Button>
          {searchParams.search && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/users/lecturers">Reset</Link>
            </Button>
          )}
        </div>
      </form>

      <Card className="overflow-hidden">
        <CardHeader className="px-4 py-3 sm:px-6 border-b">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Menampilkan {lecturers?.length ?? 0} dari {count ?? 0} dosen
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 sm:pl-6 min-w-[200px]">Dosen</TableHead>
                  <TableHead className="min-w-[130px]">Program Studi</TableHead>
                  <TableHead className="min-w-[130px]">No. HP</TableHead>
                  <TableHead className="min-w-[100px]">Mahasiswa</TableHead>
                  <TableHead className="min-w-[110px]">Kode Join</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="min-w-[110px]">Terdaftar</TableHead>
                  <TableHead className="pr-4 sm:pr-6 text-right min-w-[70px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lecturers && lecturers.length > 0 ? (
                  lecturers.map((lecturer) => {
                    const studentCount = advisorCounts[lecturer.id] ?? 0
                    return (
                      <TableRow key={lecturer.id}>
                        <TableCell className="pl-4 sm:pl-6">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarImage src={lecturer.avatar_url ?? ''} />
                              <AvatarFallback className="text-xs">{getInitials(lecturer.full_name)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate max-w-[160px]">{lecturer.full_name}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[160px]">{lecturer.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {((Array.isArray(lecturer.study_programs) ? lecturer.study_programs[0] : lecturer.study_programs) as { short_name: string | null } | null)?.short_name ?? '-'}
                        </TableCell>
                        <TableCell className="text-sm">{lecturer.phone ?? '-'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="text-sm font-medium">{studentCount}</span>
                            <span className="text-xs text-muted-foreground">mahasiswa</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {lecturer.join_code ? (
                            <Badge variant="outline" className="font-mono text-xs tracking-widest text-violet-600 border-violet-300 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400">
                              {lecturer.join_code}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">Belum dibuat</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`whitespace-nowrap text-xs ${lecturer.is_active ? 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800' : 'text-muted-foreground'}`}>
                            {lecturer.is_active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(lecturer.created_at)}</TableCell>
                        <TableCell className="pr-4 sm:pr-6 text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link href={`/admin/users/lecturers/${lecturer.id}`}>Detail</Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                      {searchParams.search ? 'Tidak ada dosen yang cocok.' : 'Belum ada dosen terdaftar.'}
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
              <Link href={`?page=${page - 1}${searchParams.search ? `&search=${searchParams.search}` : ''}`}>Sebelumnya</Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground">Halaman {page} dari {totalPages}</span>
          {page < totalPages && (
            <Button asChild variant="outline" size="sm">
              <Link href={`?page=${page + 1}${searchParams.search ? `&search=${searchParams.search}` : ''}`}>Berikutnya</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

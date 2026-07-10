import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'
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
import { formatDate } from '@/lib/utils'

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { search, page: pageParam } = await searchParams
  const page = Number(pageParam ?? 1)
  const pageSize = 20
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('companies')
    .select('*, users(id, full_name, email)', { count: 'exact' })
    .order('company_name')
    .range(from, to)

  if (search) {
    query = query.ilike('company_name', `%${search}%`)
  }

  const { data: companies, count } = await query
  const totalPages = Math.ceil((count ?? 0) / pageSize)

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Perusahaan Mitra</h1>
          <p className="text-sm text-muted-foreground">{count ?? 0} perusahaan terdaftar</p>
        </div>
        <Button asChild size="sm" className="shrink-0 self-start sm:self-auto">
          <Link href="/admin/users/companies/new">
            <UserPlus className="h-4 w-4 mr-2" />
            Tambah Perusahaan
          </Link>
        </Button>
      </div>

      <form method="GET" className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input name="search" defaultValue={search} placeholder="Cari nama perusahaan..." className="w-full sm:max-w-sm" />
        <div className="flex gap-2">
          <Button type="submit" size="sm">Cari</Button>
          {search && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/users/companies">Reset</Link>
            </Button>
          )}
        </div>
      </form>

      <Card className="overflow-hidden">
        <CardHeader className="px-4 py-3 sm:px-6 border-b">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Menampilkan {companies?.length ?? 0} dari {count ?? 0} perusahaan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 sm:pl-6 min-w-[200px]">Perusahaan</TableHead>
                  <TableHead className="min-w-[120px]">Industri</TableHead>
                  <TableHead className="min-w-[180px]">Akun</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="min-w-[110px]">Terdaftar</TableHead>
                  <TableHead className="pr-4 sm:pr-6 text-right min-w-[70px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies && companies.length > 0 ? (
                  companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="pl-4 sm:pl-6">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate max-w-[180px]">{company.company_name}</p>
                          {company.website && (
                            <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate block max-w-[180px]">
                              {company.website}
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{company.industry ?? '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground truncate max-w-[180px]">
                        {(company.users as { email: string } | null)?.email ?? '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`whitespace-nowrap text-xs ${company.is_active ? 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800' : 'text-muted-foreground'}`}>
                          {company.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(company.created_at)}</TableCell>
                      <TableCell className="pr-4 sm:pr-6 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/users/companies/${company.id}`}>Detail</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-muted-foreground">
                      {search ? 'Tidak ada perusahaan yang cocok.' : 'Belum ada perusahaan terdaftar.'}
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
              <Link href={`?page=${page - 1}${search ? `&search=${search}` : ''}`}>Sebelumnya</Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground">Halaman {page} dari {totalPages}</span>
          {page < totalPages && (
            <Button asChild variant="outline" size="sm">
              <Link href={`?page=${page + 1}${search ? `&search=${search}` : ''}`}>Berikutnya</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

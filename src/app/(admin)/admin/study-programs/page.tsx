import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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
import { StudyProgramActions } from '@/components/admin/study-program-actions'

export default async function StudyProgramsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: programs }, { data: university }] = await Promise.all([
    supabase.from('study_programs').select('*, universities(id, name, short_name)').order('name'),
    supabase.from('universities').select('id').limit(1).single(),
  ])

  const universityId = university?.id ?? ''

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Program Studi</h1>
          <p className="text-sm text-muted-foreground">{programs?.length ?? 0} program studi terdaftar</p>
        </div>
        <div className="shrink-0 self-start sm:self-auto">
          <StudyProgramActions mode="create" universityId={universityId} />
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="px-4 py-3 sm:px-6 border-b">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {programs?.length ?? 0} program studi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 sm:pl-6 min-w-[220px]">Nama Program Studi</TableHead>
                  <TableHead className="min-w-[100px]">Singkatan</TableHead>
                  <TableHead className="min-w-[90px]">Jenjang</TableHead>
                  <TableHead className="min-w-[80px]">Status</TableHead>
                  <TableHead className="pr-4 sm:pr-6 text-right min-w-[80px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs && programs.length > 0 ? (
                  programs.map((program) => (
                    <TableRow key={program.id}>
                      <TableCell className="pl-4 sm:pl-6 font-medium">{program.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{program.short_name ?? '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{program.degree_level}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`whitespace-nowrap text-xs ${program.is_active ? 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800' : 'text-muted-foreground'}`}>
                          {program.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-4 sm:pr-6 text-right">
                        <StudyProgramActions mode="edit" program={program} />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">
                      Belum ada program studi terdaftar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

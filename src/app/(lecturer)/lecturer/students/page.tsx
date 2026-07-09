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
import { calculateAcademicSummary, ACADEMIC_STATUS_CONFIG } from '@/lib/utils/academic'
import type { AcademicRule, StudentGrade } from '@/types'

export default async function LecturerStudentsPage({
  searchParams,
}: {
  searchParams: { q?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('university_id')
    .eq('id', user.id)
    .single()

  const { data: advisorRows } = await supabase
    .from('advisor_students')
    .select('student_id')
    .eq('lecturer_id', user.id)

  const studentIds = (advisorRows ?? []).map((r) => r.student_id)

  let students: Array<{
    id: string
    full_name: string
    nim: string | null
    avatar_url: string | null
    current_semester: number | null
    email: string
    phone: string | null
    study_programs: { name: string; short_name: string | null } | null
  }> = []

  if (studentIds.length > 0) {
    let query = supabase
      .from('users')
      .select('id, full_name, nim, avatar_url, current_semester, email, phone, study_programs(name, short_name)')
      .in('id', studentIds)
      .eq('is_active', true)

    if (searchParams.q) {
      query = query.or(`full_name.ilike.%${searchParams.q}%,nim.ilike.%${searchParams.q}%`)
    }

    const { data } = await query.order('full_name')
    students = (data ?? []).map((s: Record<string, unknown>) => ({
      ...s,
      study_programs: Array.isArray(s.study_programs) ? s.study_programs[0] : s.study_programs
    })) as typeof students
  }

  let defaultRule: AcademicRule | null = null
  if (profile?.university_id) {
    const { data } = await supabase
      .from('academic_rules')
      .select('*')
      .eq('university_id', profile.university_id)
      .is('study_program_id', null)
      .single()
    defaultRule = data
  }

  const effectiveRule: AcademicRule = defaultRule ?? {
    id: '', university_id: '', study_program_id: null,
    total_sks_graduation: 144, normal_semester: 8, max_semester: 14,
    min_gpa: 2.0, max_sks_per_semester: 24, min_sks_per_semester: 12,
    passing_grade: 'D',
    grade_scale: { A: 4.0, AB: 3.5, B: 3.0, BC: 2.5, C: 2.0, D: 1.0, E: 0.0 },
    created_at: '', updated_at: '',
  }

  const gradesByStudent = new Map<string, StudentGrade[]>()
  if (studentIds.length > 0) {
    const { data: allGrades } = await supabase
      .from('student_grades')
      .select('*')
      .in('student_id', studentIds)
    for (const g of (allGrades ?? [])) {
      const arr = gradesByStudent.get(g.student_id) ?? []
      arr.push(g as StudentGrade)
      gradesByStudent.set(g.student_id, arr)
    }
  }

  const studentSummaries = students.map((s) => {
    const grades = gradesByStudent.get(s.id) ?? []
    const currentSemester = s.current_semester ?? 1
    const summary = calculateAcademicSummary(grades, currentSemester, effectiveRule.normal_semester, effectiveRule)
    return { student: s, summary }
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

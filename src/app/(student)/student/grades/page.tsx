'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Plus,
  LayoutGrid,
  List,
  FileUp,
  BookOpen,
  GraduationCap,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import { GradeFormDialog, GradeActions, GRADE_COLORS } from '@/components/student/grade-form-dialog'
import { formatGPA } from '@/lib/utils'
import { calculateIPS } from '@/lib/utils/academic'
import type { StudentGrade } from '@/types'

interface SemesterGroup {
  semester_number: number
  semester_type: string
  academic_year: string
  grades: StudentGrade[]
  ips: number
  total_sks: number
}

export default function StudentGradesPage() {
  const [grades, setGrades] = useState<StudentGrade[]>([])
  const [semesterGroups, setSemesterGroups] = useState<SemesterGroup[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editGrade, setEditGrade] = useState<StudentGrade | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')

  const fetchGrades = useCallback(async () => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const res = await fetch('/api/student/grades')
      const result = await res.json()
      if (result.success) {
        const data: StudentGrade[] = result.data ?? []
        setGrades(data)
        const map = new Map<string, StudentGrade[]>()
        for (const g of data) {
          const key = `${g.semester_number}||${g.semester_type ?? 'ganjil'}||${g.academic_year ?? ''}`
          const existing = map.get(key) ?? []
          existing.push(g)
          map.set(key, existing)
        }
        const groups: SemesterGroup[] = Array.from(map.entries())
          .sort(([a], [b]) => Number(a.split('||')[0]) - Number(b.split('||')[0]))
          .map(([key, semGrades]) => {
            const [semNum, semType, academicYear] = key.split('||')
            return {
              semester_number: Number(semNum),
              semester_type: semType,
              academic_year: academicYear,
              grades: semGrades,
              ips: calculateIPS(semGrades),
              total_sks: semGrades.reduce((s, g) => s + g.credits, 0),
            }
          })
        setSemesterGroups(groups)
      } else {
        setFetchError(result.error ?? 'Gagal memuat data nilai.')
      }
    } catch {
      setFetchError('Gagal memuat data. Periksa koneksi internet Anda.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchGrades() }, [fetchGrades])

  function handleEdit(grade: StudentGrade) { setEditGrade(grade); setDialogOpen(true) }
  function handleAdd() { setEditGrade(null); setDialogOpen(true) }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/student/grades/${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (!res.ok) { toast.error(result.error ?? 'Gagal menghapus nilai'); return }
      toast.success('Nilai berhasil dihapus')
      fetchGrades()
    } finally {
      setDeletingId(null)
    }
  }

  const totalSks = grades.reduce((s, g) => s + g.credits, 0)
  const ipk = grades.length > 0
    ? Math.round(grades.reduce((s, g) => s + g.grade_points * g.credits, 0) / (totalSks || 1) * 100) / 100
    : 0

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nilai Akademik</h1>
          <p className="text-sm text-muted-foreground">
            {grades.length} mata kuliah · {totalSks} SKS · IPK {formatGPA(ipk)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border p-0.5 gap-0.5">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('list')}
            >
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/student/grades/import">
              <FileUp className="h-4 w-4 mr-1.5" />
              Import KHS
            </Link>
          </Button>
          <Button size="sm" onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-1.5" />
            Tambah Nilai
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : fetchError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm text-destructive">{fetchError}</p>
            <Button variant="outline" size="sm" onClick={fetchGrades}>Coba Lagi</Button>
          </CardContent>
        </Card>
      ) : semesterGroups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <BookOpen className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">Belum ada data nilai.</p>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Input Nilai Pertama
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'list' ? (
        /* ── LIST MODE ── */
        <div className="flex flex-col gap-6">
          {semesterGroups.map((group) => (
            <Card key={`${group.semester_number}-${group.semester_type}-${group.academic_year}`} className="overflow-hidden">
              <CardHeader className="pb-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base">Semester {group.semester_number}</CardTitle>
                      <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                        group.semester_type === 'ganjil'
                          ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400'
                          : 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400'
                      }`}>
                        {group.semester_type === 'ganjil' ? 'Ganjil' : 'Genap'}
                      </span>
                      {group.academic_year && (
                        <span className="text-xs text-muted-foreground">TA {group.academic_year}</span>
                      )}
                    </div>
                    <CardDescription className="mt-1">{group.grades.length} mata kuliah · {group.total_sks} SKS</CardDescription>
                  </div>
                  <span className="inline-flex items-center rounded-lg px-3 py-1 text-sm font-semibold bg-muted text-foreground">
                    IPS {formatGPA(group.ips)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-0 mt-3">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4 sm:pl-6">Mata Kuliah</TableHead>
                      <TableHead className="w-16 text-center">SKS</TableHead>
                      <TableHead className="w-16 text-center">Nilai</TableHead>
                      <TableHead className="w-20 text-center">Bobot</TableHead>
                      <TableHead className="w-20 pr-4 sm:pr-6" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.grades.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell className="pl-4 sm:pl-6">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{g.course_name}</span>
                            {g.is_retake && (
                              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-orange-600 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400">
                                Mengulang
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm">{g.credits}</TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${GRADE_COLORS[g.grade] ?? ''}`}>
                            {g.grade}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {Number(g.grade_points).toFixed(1)}
                        </TableCell>
                        <TableCell className="pr-4 sm:pr-6">
                          <GradeActions grade={g} onEdit={handleEdit} onDelete={handleDelete} isDeleting={deletingId === g.id} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* ── GRID MODE ── */
        <div className="flex flex-col gap-8">
          {semesterGroups.map((group) => (
            <div key={`${group.semester_number}-${group.semester_type}-${group.academic_year}`}>
              {/* Semester header */}
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-semibold">Semester {group.semester_number}</h2>
                  <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${
                    group.semester_type === 'ganjil'
                      ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400'
                      : 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400'
                  }`}>
                    {group.semester_type === 'ganjil' ? 'Ganjil' : 'Genap'}
                  </span>
                  {group.academic_year && (
                    <span className="text-xs text-muted-foreground">TA {group.academic_year}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{group.grades.length} MK · {group.total_sks} SKS</span>
                  <span className="flex items-center gap-1 font-semibold text-foreground"><TrendingUp className="h-3.5 w-3.5 text-primary" />IPS {formatGPA(group.ips)}</span>
                </div>
              </div>
              {/* Grid cards */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.grades.map((g) => (
                  <Card key={g.id} className="relative overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <p className="text-sm font-medium leading-snug flex-1 min-w-0">{g.course_name}</p>
                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold shrink-0 ${GRADE_COLORS[g.grade] ?? ''}`}>
                          {g.grade}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />
                            {g.credits} SKS
                          </span>
                          <span>{Number(g.grade_points).toFixed(1)}</span>
                        </div>
                        {g.is_retake && (
                          <span className="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium text-orange-600 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400">
                            Mengulang
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-0 right-0 opacity-0 hover:opacity-100 transition-opacity bg-card border-t border-l rounded-tl-lg flex">
                        <GradeActions grade={g} onEdit={handleEdit} onDelete={handleDelete} isDeleting={deletingId === g.id} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <GradeFormDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditGrade(null) }}
        editGrade={editGrade}
        onSuccess={fetchGrades}
      />
    </div>
  )
}

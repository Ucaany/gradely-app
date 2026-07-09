'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editGrade, setEditGrade] = useState<StudentGrade | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchGrades = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/student/grades')
      const result = await res.json()
      if (result.success) {
        const data: StudentGrade[] = result.data ?? []
        setGrades(data)

        // Group by semester_number + semester_type + academic_year
        const map = new Map<string, StudentGrade[]>()
        for (const g of data) {
          const key = `${g.semester_number}||${g.semester_type ?? 'ganjil'}||${g.academic_year ?? ''}`
          const existing = map.get(key) ?? []
          existing.push(g)
          map.set(key, existing)
        }

        const groups: SemesterGroup[] = Array.from(map.entries())
          .sort(([a], [b]) => {
            const [aSem] = a.split('||')
            const [bSem] = b.split('||')
            return Number(aSem) - Number(bSem)
          })
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
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchGrades() }, [fetchGrades])

  function handleEdit(grade: StudentGrade) {
    setEditGrade(grade)
    setDialogOpen(true)
  }

  function handleAdd() {
    setEditGrade(null)
    setDialogOpen(true)
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/student/grades/${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error ?? 'Gagal menghapus nilai')
        return
      }
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nilai Akademik</h1>
          <p className="text-sm text-muted-foreground">
            {grades.length} mata kuliah · {totalSks} SKS · IPK {formatGPA(ipk)}
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Nilai
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : semesterGroups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-muted-foreground text-sm">Belum ada data nilai.</p>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Input Nilai Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {semesterGroups.map((group) => (
            <Card
              key={`${group.semester_number}-${group.semester_type}-${group.academic_year}`}
              className="overflow-hidden"
            >
              <CardHeader className="pb-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base">
                        Semester {group.semester_number}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={`text-xs font-medium ${
                          group.semester_type === 'ganjil'
                            ? 'text-blue-700 border-blue-300 bg-blue-50 dark:bg-blue-950 dark:text-blue-400'
                            : 'text-purple-700 border-purple-300 bg-purple-50 dark:bg-purple-950 dark:text-purple-400'
                        }`}
                      >
                        {group.semester_type === 'ganjil' ? 'Ganjil' : 'Genap'}
                      </Badge>
                      {group.academic_year && (
                        <span className="text-xs text-muted-foreground">
                          TA {group.academic_year}
                        </span>
                      )}
                    </div>
                    <CardDescription className="mt-1">
                      {group.grades.length} mata kuliah · {group.total_sks} SKS
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-sm font-semibold px-3 py-1 shrink-0">
                    IPS {formatGPA(group.ips)}
                  </Badge>
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
                      <TableHead className="w-20 pr-4 sm:pr-6"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.grades.map((g) => (
                      <TableRow key={g.id}>
                        <TableCell className="pl-4 sm:pl-6">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{g.course_name}</span>
                            {g.is_retake && (
                              <Badge variant="outline" className="text-xs text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-950">
                                Mengulang
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center text-sm">{g.credits}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={`text-xs font-semibold ${GRADE_COLORS[g.grade] ?? ''}`}>
                            {g.grade}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm text-muted-foreground">
                          {Number(g.grade_points).toFixed(1)}
                        </TableCell>
                        <TableCell className="pr-4 sm:pr-6">
                          <GradeActions
                            grade={g}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            isDeleting={deletingId === g.id}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <GradeFormDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v)
          if (!v) setEditGrade(null)
        }}
        editGrade={editGrade}
        onSuccess={fetchGrades}
      />
    </div>
  )
}

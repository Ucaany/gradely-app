'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Pencil, Trash2 } from 'lucide-react'
import { createGradeSchema, type CreateGradeInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Checkbox } from '@/components/ui/checkbox'
import type { StudentGrade } from '@/types'

interface GradeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editGrade?: StudentGrade | null
  onSuccess: () => void
}

const GRADE_OPTIONS = ['A', 'AB', 'B', 'BC', 'C', 'D', 'E'] as const

export const GRADE_COLORS: Record<string, string> = {
  A: 'text-green-700 border-green-300 bg-green-50 dark:bg-green-950 dark:text-green-400',
  AB: 'text-emerald-700 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400',
  B: 'text-blue-700 border-blue-300 bg-blue-50 dark:bg-blue-950 dark:text-blue-400',
  BC: 'text-sky-700 border-sky-300 bg-sky-50 dark:bg-sky-950 dark:text-sky-400',
  C: 'text-yellow-700 border-yellow-300 bg-yellow-50 dark:bg-yellow-950 dark:text-yellow-400',
  D: 'text-orange-700 border-orange-300 bg-orange-50 dark:bg-orange-950 dark:text-orange-400',
  E: 'text-red-700 border-red-300 bg-red-50 dark:bg-red-950 dark:text-red-400',
}

// Generate daftar tahun ajaran (5 tahun ke belakang s/d sekarang)
function generateAcademicYears(): string[] {
  const currentYear = new Date().getFullYear()
  const years: string[] = []
  for (let i = 0; i <= 5; i++) {
    const start = currentYear - i
    years.push(`${start}/${start + 1}`)
  }
  return years
}

const ACADEMIC_YEARS = generateAcademicYears()

// Auto-detect semester_type dari semester_number
function getSemesterType(semesterNumber: number): 'ganjil' | 'genap' {
  return semesterNumber % 2 === 1 ? 'ganjil' : 'genap'
}

export function GradeFormDialog({ open, onOpenChange, editGrade, onSuccess }: GradeFormDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const isEdit = !!editGrade

  const form = useForm<CreateGradeInput>({
    resolver: zodResolver(createGradeSchema),
    defaultValues: {
      semester_number: editGrade?.semester_number ?? 1,
      semester_type: editGrade?.semester_type ?? 'ganjil',
      academic_year: editGrade?.academic_year ?? ACADEMIC_YEARS[0],
      course_name: editGrade?.course_name ?? '',
      credits: editGrade?.credits ?? 2,
      grade: editGrade?.grade ?? 'A',
      is_retake: editGrade?.is_retake ?? false,
    },
  })

  const handleOpenChange = (val: boolean) => {
    if (!val) form.reset()
    onOpenChange(val)
  }

  // Reset form setiap kali editGrade berubah atau dialog dibuka
  useEffect(() => {
    if (open) {
      form.reset({
        semester_number: editGrade?.semester_number ?? 1,
        semester_type: editGrade?.semester_type ?? getSemesterType(1),
        academic_year: editGrade?.academic_year ?? ACADEMIC_YEARS[0],
        course_name: editGrade?.course_name ?? '',
        credits: editGrade?.credits ?? 2,
        grade: editGrade?.grade ?? 'A',
        is_retake: editGrade?.is_retake ?? false,
      })
    }
  }, [open, editGrade, form])

  // Auto-update semester_type saat semester_number berubah
  function handleSemesterChange(value: number) {
    form.setValue('semester_number', value)
    form.setValue('semester_type', getSemesterType(value))
  }

  async function onSubmit(data: CreateGradeInput) {
    setIsLoading(true)
    try {
      const url = isEdit ? `/api/student/grades/${editGrade!.id}` : '/api/student/grades'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error ?? 'Gagal menyimpan nilai')
        return
      }
      toast.success(isEdit ? 'Nilai berhasil diperbarui' : 'Nilai berhasil ditambahkan')
      form.reset()
      onOpenChange(false)
      onSuccess()
    } finally {
      setIsLoading(false)
    }
  }

  const watchSemester = form.watch('semester_number')
  const watchSemesterType = form.watch('semester_type')

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Nilai' : 'Tambah Nilai'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Perbarui data nilai mata kuliah.' : 'Input nilai mata kuliah baru.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="course_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Mata Kuliah <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Misal: Desain Komunikasi Visual" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Semester + Ganjil/Genap + Tahun Ajaran */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="semester_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semester <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={14}
                        placeholder="1–14"
                        disabled={isLoading}
                        {...field}
                        onChange={(e) => handleSemesterChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="semester_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jenis Semester <span className="text-destructive">*</span></FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ganjil">Ganjil</SelectItem>
                        <SelectItem value="genap">Genap</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Auto-hint */}
            <p className="text-xs text-muted-foreground -mt-2">
              Semester {watchSemester} otomatis terdeteksi sebagai semester{' '}
              <span className="font-medium">{watchSemesterType}</span>. Bisa diubah manual jika perlu.
            </p>

            <FormField
              control={form.control}
              name="academic_year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tahun Ajaran <span className="text-destructive">*</span></FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih tahun ajaran" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ACADEMIC_YEARS.map((y) => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* SKS + Nilai */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="credits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKS <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={6}
                        placeholder="1–6"
                        disabled={isLoading}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nilai <span className="text-destructive">*</span></FormLabel>
                    <Select defaultValue={field.value} onValueChange={field.onChange} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Nilai" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GRADE_OPTIONS.map((g) => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_retake"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                  </FormControl>
                  <FormLabel className="font-normal cursor-pointer">Mata kuliah mengulang</FormLabel>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
                Batal
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Menyimpan...' : isEdit ? 'Simpan' : 'Tambah'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

interface GradeActionsProps {
  grade: StudentGrade
  onEdit: (grade: StudentGrade) => void
  onDelete: (id: string) => void
  isDeleting: boolean
}

export function GradeActions({ grade, onEdit, onDelete, isDeleting }: GradeActionsProps) {
  return (
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(grade)}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive hover:text-destructive"
        onClick={() => onDelete(grade.id)}
        disabled={isDeleting}
      >
        {isDeleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </Button>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'

import { createAcademicRuleSchema, type CreateAcademicRuleInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { AcademicRule, StudyProgram } from '@/types'

interface Props {
  mode: 'create' | 'edit'
  rule?: AcademicRule
  studyPrograms: Pick<StudyProgram, 'id' | 'name' | 'short_name'>[]
  universityId: string
}

const PASSING_GRADES = ['A', 'AB', 'B', 'BC', 'C', 'D', 'E'] as const

function AcademicRuleForm({
  mode,
  rule,
  studyPrograms,
  universityId,
  onClose,
}: {
  mode: 'create' | 'edit'
  rule?: AcademicRule
  studyPrograms: Pick<StudyProgram, 'id' | 'name' | 'short_name'>[]
  universityId: string
  onClose: () => void
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const defaultValues: Partial<CreateAcademicRuleInput> = rule
    ? {
        university_id: rule.university_id,
        study_program_id: rule.study_program_id ?? undefined,
        total_sks_graduation: rule.total_sks_graduation,
        normal_semester: rule.normal_semester,
        max_semester: rule.max_semester,
        min_gpa: rule.min_gpa,
        max_sks_per_semester: rule.max_sks_per_semester,
        min_sks_per_semester: rule.min_sks_per_semester,
        passing_grade: rule.passing_grade,
        grade_scale: rule.grade_scale,
      }
    : {
        university_id: universityId,
        total_sks_graduation: 144,
        normal_semester: 8,
        max_semester: 14,
        min_gpa: 2.0,
        max_sks_per_semester: 24,
        min_sks_per_semester: 12,
        passing_grade: 'D',
        grade_scale: { A: 4.0, AB: 3.5, B: 3.0, BC: 2.5, C: 2.0, D: 1.0, E: 0.0 },
      }

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CreateAcademicRuleInput>({
    resolver: zodResolver(createAcademicRuleSchema),
    defaultValues: defaultValues as CreateAcademicRuleInput,
  })

  const passingGrade = watch('passing_grade')

  async function onSubmit(data: CreateAcademicRuleInput) {
    setIsLoading(true)
    try {
      const url = mode === 'create' ? '/api/admin/academic-rules' : `/api/admin/academic-rules/${rule!.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const result = await res.json()
      if (!res.ok) { toast.error(result.error ?? 'Gagal menyimpan aturan akademik'); return }
      toast.success(mode === 'create' ? 'Aturan akademik berhasil ditambahkan' : 'Aturan akademik berhasil diperbarui')
      onClose()
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {mode === 'create' && (
        <div className="space-y-2">
          <Label>Program Studi</Label>
          <Select onValueChange={(v) => setValue('study_program_id', v === 'default' ? undefined : v as string)}>
            <SelectTrigger>
              <SelectValue placeholder="Aturan default (semua prodi)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Aturan default (semua prodi)</SelectItem>
              {studyPrograms.map((sp) => (
                <SelectItem key={sp.id} value={sp.id}>{sp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Kosongkan untuk aturan default kampus</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="total_sks">Total SKS Kelulusan <span className="text-destructive">*</span></Label>
          <Input id="total_sks" type="number" {...register('total_sks_graduation', { valueAsNumber: true })} disabled={isLoading} />
          {errors.total_sks_graduation && <p className="text-xs text-destructive">{errors.total_sks_graduation.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="min_gpa">IPK Minimum <span className="text-destructive">*</span></Label>
          <Input id="min_gpa" type="number" step="0.01" {...register('min_gpa', { valueAsNumber: true })} disabled={isLoading} />
          {errors.min_gpa && <p className="text-xs text-destructive">{errors.min_gpa.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="normal_semester">Semester Normal <span className="text-destructive">*</span></Label>
          <Input id="normal_semester" type="number" {...register('normal_semester', { valueAsNumber: true })} disabled={isLoading} />
          {errors.normal_semester && <p className="text-xs text-destructive">{errors.normal_semester.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_semester">Semester Maksimal <span className="text-destructive">*</span></Label>
          <Input id="max_semester" type="number" {...register('max_semester', { valueAsNumber: true })} disabled={isLoading} />
          {errors.max_semester && <p className="text-xs text-destructive">{errors.max_semester.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="min_sks">SKS Min/Semester <span className="text-destructive">*</span></Label>
          <Input id="min_sks" type="number" {...register('min_sks_per_semester', { valueAsNumber: true })} disabled={isLoading} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_sks">SKS Maks/Semester <span className="text-destructive">*</span></Label>
          <Input id="max_sks" type="number" {...register('max_sks_per_semester', { valueAsNumber: true })} disabled={isLoading} />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Nilai Lulus Minimum <span className="text-destructive">*</span></Label>
        <RadioGroup
          value={passingGrade}
          onValueChange={(v) => setValue('passing_grade', v as typeof PASSING_GRADES[number])}
          className="flex flex-wrap gap-x-4 gap-y-2"
          disabled={isLoading}
        >
          {PASSING_GRADES.map((g) => (
            <div key={g} className="flex items-center gap-2">
              <RadioGroupItem value={g} id={`grade-${g}`} />
              <Label htmlFor={`grade-${g}`} className="cursor-pointer font-normal">{g}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Batal</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Tambah' : 'Simpan'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function AcademicRuleActions({ mode, rule, studyPrograms, universityId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleDelete() {
    if (!rule) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/academic-rules/${rule.id}`, { method: 'DELETE' })
      const result = await res.json()
      if (!res.ok) { toast.error(result.error ?? 'Gagal menghapus'); return }
      toast.success('Aturan akademik berhasil dihapus')
      setDeleteConfirm(false)
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  if (mode === 'edit' && rule) {
    return (
      <div className="flex gap-1">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Pencil className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Aturan Akademik</DialogTitle>
              <DialogDescription>Perbarui konfigurasi aturan akademik</DialogDescription>
            </DialogHeader>
            <AcademicRuleForm mode="edit" rule={rule} studyPrograms={studyPrograms} universityId={universityId} onClose={() => setOpen(false)} />
          </DialogContent>
        </Dialog>

        {rule.study_program_id && (
          <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Hapus Aturan Akademik</DialogTitle>
                <DialogDescription>Yakin ingin menghapus aturan ini? Program studi akan menggunakan aturan default.</DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setDeleteConfirm(false)}>Batal</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Hapus
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Aturan
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Aturan Akademik</DialogTitle>
          <DialogDescription>Tambahkan aturan akademik baru</DialogDescription>
        </DialogHeader>
        <AcademicRuleForm mode="create" studyPrograms={studyPrograms} universityId={universityId} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

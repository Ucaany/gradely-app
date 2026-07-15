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
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
import type { AcademicRule, StudyProgram } from '@/types'

interface Props {
  mode: 'create' | 'edit'
  rule?: AcademicRule
  studyPrograms: Pick<StudyProgram, 'id' | 'name' | 'short_name'>[]
  universityId: string
}

const PASSING_GRADES = ['A', 'A-', 'BA', 'B+', 'B', 'B-', 'C', 'D', 'E'] as const
const GRADE_KEYS = ['A', 'A-', 'BA', 'B+', 'B', 'B-', 'C', 'D', 'E'] as const

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

  const form = useForm<CreateAcademicRuleInput>({
    resolver: zodResolver(createAcademicRuleSchema),
    defaultValues: rule
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
          grade_scale: { A: 4.0, 'A-': 3.75, BA: 3.5, 'B+': 3.25, B: 3.0, 'B-': 2.75, C: 2.0, D: 1.0, E: 0.0 },
        },
  })

  async function onSubmit(data: CreateAcademicRuleInput) {
    setIsLoading(true)
    try {
      const url = mode === 'create' ? '/api/admin/academic-rules' : `/api/admin/academic-rules/${rule!.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data), credentials: 'include' })
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
        <div className="flex flex-col gap-5 px-6 py-4 max-h-[65vh] overflow-y-auto">

          {mode === 'create' && (
            <FormField
              control={form.control}
              name="study_program_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Program Studi</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === 'default' ? undefined : v)}
                    defaultValue={field.value ?? 'default'}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Aturan default (semua prodi)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="default">Aturan default (semua prodi)</SelectItem>
                      {studyPrograms.map((sp) => (
                        <SelectItem key={sp.id} value={sp.id}>{sp.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">SKS & Semester</p>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="total_sks_graduation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total SKS Kelulusan <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="number" disabled={isLoading} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="min_gpa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IPK Minimum <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" disabled={isLoading} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="normal_semester"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semester Normal <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="number" disabled={isLoading} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="max_semester"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semester Maksimal <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="number" disabled={isLoading} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="min_sks_per_semester"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKS Min/Semester <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="number" disabled={isLoading} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="max_sks_per_semester"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKS Maks/Semester <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="number" disabled={isLoading} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          <FormField
            control={form.control}
            name="passing_grade"
            render={({ field }) => (
              <FormItem>
                <div className="mb-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Nilai Lulus Minimum</p>
                  <p className="text-xs text-muted-foreground">Nilai terendah yang dianggap lulus untuk suatu mata kuliah</p>
                </div>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex flex-wrap gap-2"
                    disabled={isLoading}
                  >
                    {PASSING_GRADES.map((g) => (
                      <div key={g} className="flex items-center">
                        <RadioGroupItem value={g} id={`grade-${g}`} className="sr-only" />
                        <FormLabel
                          htmlFor={`grade-${g}`}
                          className={`cursor-pointer px-3 py-1.5 rounded-md border text-sm font-medium transition-colors ${
                            field.value === g
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-background border-input hover:bg-muted'
                          }`}
                        >
                          {g}
                        </FormLabel>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Skala Nilai (Bobot)</p>
            <p className="text-xs text-muted-foreground mb-3">Nilai bobot (0–4) untuk setiap grade huruf</p>
            <div className="grid grid-cols-4 gap-2">
              {GRADE_KEYS.map((g) => (
                <FormField
                  key={g}
                  control={form.control}
                  name={`grade_scale.${g}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-semibold">{g}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min={0}
                          max={4}
                          disabled={isLoading}
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          className="h-8 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <Separator />
        <div className="flex justify-end gap-2 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Batal</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Tambah' : 'Simpan'}
          </Button>
        </div>
      </form>
    </Form>
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
      const res = await fetch(`/api/admin/academic-rules/${rule.id}`, { method: 'DELETE', credentials: 'include' })
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
          <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle>Edit Aturan Akademik</DialogTitle>
              <DialogDescription>Perbarui konfigurasi aturan akademik</DialogDescription>
            </DialogHeader>
            <Separator />
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
              <Separator />
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDeleteConfirm(false)} disabled={isLoading}>Batal</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Hapus
                </Button>
              </div>
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
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Tambah Aturan Akademik</DialogTitle>
          <DialogDescription>Tambahkan aturan akademik baru</DialogDescription>
        </DialogHeader>
        <Separator />
        <AcademicRuleForm mode="create" studyPrograms={studyPrograms} universityId={universityId} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

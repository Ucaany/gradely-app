'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'

import { createStudyProgramSchema, type CreateStudyProgramInput } from '@/lib/validations'
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
import { Switch } from '@/components/ui/switch'
import type { StudyProgram } from '@/types'

interface Props {
  mode: 'create' | 'edit'
  program?: StudyProgram
  universityId?: string
}

const DEGREE_LEVELS = ['D3', 'D4', 'S1', 'S2', 'S3'] as const

function StudyProgramForm({
  mode,
  program,
  universityId,
  onClose,
}: {
  mode: 'create' | 'edit'
  program?: StudyProgram
  universityId?: string
  onClose: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<CreateStudyProgramInput>({
      resolver: zodResolver(createStudyProgramSchema),
      defaultValues: program
        ? {
            name: program.name,
            short_name: program.short_name ?? '',
            degree_level: program.degree_level,
            is_active: program.is_active,
            university_id: program.university_id,
          }
        : {
            degree_level: 'S1',
            is_active: true,
            university_id: universityId ?? '',
          },
    })

  const isActive = watch('is_active')
  const degreeLevel = watch('degree_level')

  async function onSubmit(data: CreateStudyProgramInput) {
    setLoading(true)
    try {
      const url = mode === 'create' ? '/api/admin/study-programs' : `/api/admin/study-programs/${program!.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
      const result = await res.json()
      if (!res.ok) { toast.error(result.error ?? 'Gagal menyimpan'); return }
      toast.success(mode === 'create' ? 'Program studi berhasil ditambahkan' : 'Program studi berhasil diperbarui')
      onClose()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="name">Nama Program Studi <span className="text-destructive">*</span></Label>
        <Input id="name" placeholder="contoh: Desain Komunikasi Visual" {...register('name')} disabled={loading} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="short_name">Singkatan</Label>
        <Input id="short_name" placeholder="DKV" {...register('short_name')} disabled={loading} className="max-w-[160px]" />
      </div>

      <div className="space-y-3">
        <Label>Jenjang <span className="text-destructive">*</span></Label>
        <RadioGroup
          value={degreeLevel}
          onValueChange={(v) => setValue('degree_level', v as typeof DEGREE_LEVELS[number])}
          className="flex flex-wrap gap-x-6 gap-y-2"
          disabled={loading}
        >
          {DEGREE_LEVELS.map((d) => (
            <div key={d} className="flex items-center gap-2">
              <RadioGroupItem value={d} id={`degree-${d}`} />
              <Label htmlFor={`degree-${d}`} className="cursor-pointer font-normal">{d}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="flex items-center justify-between rounded-lg border px-4 py-3">
        <div>
          <p className="text-sm font-medium">Status Aktif</p>
          <p className="text-xs text-muted-foreground">Program studi aktif dan dapat digunakan</p>
        </div>
        <Switch
          checked={isActive}
          onCheckedChange={(v) => setValue('is_active', v)}
          disabled={loading}
        />
      </div>

      <DialogFooter className="gap-2 sm:gap-0">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Batal</Button>
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === 'create' ? 'Tambah' : 'Simpan'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function StudyProgramActions({ mode, program, universityId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleDelete() {
    if (!program) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/study-programs/${program.id}`, { method: 'DELETE' })
      const result = await res.json()
      if (!res.ok) { toast.error(result.error ?? 'Gagal menghapus'); return }
      toast.success('Program studi berhasil dihapus')
      setDeleteConfirm(false)
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  if (mode === 'edit' && program) {
    return (
      <div className="flex gap-1">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Pencil className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Program Studi</DialogTitle>
              <DialogDescription>Perbarui data program studi</DialogDescription>
            </DialogHeader>
            <StudyProgramForm mode="edit" program={program} onClose={() => setOpen(false)} />
          </DialogContent>
        </Dialog>

        <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Hapus Program Studi</DialogTitle>
              <DialogDescription>
                Yakin ingin menghapus <strong>{program.name}</strong>? Tindakan ini tidak bisa dibatalkan.
              </DialogDescription>
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
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Program Studi
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Program Studi</DialogTitle>
          <DialogDescription>Tambahkan program studi baru ke sistem</DialogDescription>
        </DialogHeader>
        <StudyProgramForm mode="create" universityId={universityId} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

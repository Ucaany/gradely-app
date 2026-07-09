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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
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

  const form = useForm<CreateStudyProgramInput>({
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
        <div className="flex flex-col gap-4 px-6 py-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Program Studi <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <Input placeholder="contoh: Desain Komunikasi Visual" disabled={loading} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="short_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Singkatan</FormLabel>
                <FormControl>
                  <Input placeholder="DKV" disabled={loading} className="max-w-[160px]" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="degree_level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jenjang <span className="text-destructive">*</span></FormLabel>
                <FormControl>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex flex-wrap gap-x-6 gap-y-2"
                    disabled={loading}
                  >
                    {DEGREE_LEVELS.map((d) => (
                      <div key={d} className="flex items-center gap-2">
                        <RadioGroupItem value={d} id={`degree-${d}`} />
                        <FormLabel htmlFor={`degree-${d}`} className="cursor-pointer font-normal">{d}</FormLabel>
                      </div>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_active"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Status Aktif</p>
                    <p className="text-xs text-muted-foreground">Program studi aktif dan dapat digunakan</p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={loading}
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />
        <div className="flex justify-end gap-2 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Batal</Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'create' ? 'Tambah' : 'Simpan'}
          </Button>
        </div>
      </form>
    </Form>
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
          <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4">
              <DialogTitle>Edit Program Studi</DialogTitle>
              <DialogDescription>Perbarui data program studi</DialogDescription>
            </DialogHeader>
            <Separator />
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
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle>Tambah Program Studi</DialogTitle>
          <DialogDescription>Tambahkan program studi baru ke sistem</DialogDescription>
        </DialogHeader>
        <Separator />
        <StudyProgramForm mode="create" universityId={universityId} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}

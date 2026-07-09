'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Pencil, Trash2 } from 'lucide-react'

import { updateUserSchema, type UpdateUserInput } from '@/lib/validations'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { StudyProgram, User } from '@/types'

interface Props {
  userId: string
  userData: User
  studyPrograms: Pick<StudyProgram, 'id' | 'name' | 'short_name' | 'degree_level' | 'university_id' | 'is_active' | 'created_at'>[]
}

export function UserDetailActions({ userId, userData, studyPrograms }: Props) {
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors } } =
    useForm<UpdateUserInput>({
      resolver: zodResolver(updateUserSchema),
      defaultValues: {
        full_name: userData.full_name,
        nim: userData.nim ?? '',
        phone: userData.phone ?? '',
        current_semester: userData.current_semester ?? undefined,
        study_program_id: userData.study_program_id ?? undefined,
        is_active: userData.is_active,
      },
    })

  async function onSubmit(data: UpdateUserInput) {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error ?? 'Gagal memperbarui data')
        return
      }
      toast.success('Data berhasil diperbarui')
      setEditOpen(false)
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error ?? 'Gagal menghapus akun')
        return
      }
      toast.success('Akun berhasil dihapus')
      router.back()
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Data Pengguna</DialogTitle>
            <DialogDescription>Perbarui data pengguna</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Lengkap</Label>
              <Input {...register('full_name')} disabled={isLoading} />
              {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
            </div>
            {userData.role === 'student' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>NIM</Label>
                  <Input {...register('nim')} disabled={isLoading} />
                </div>
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Input type="number" min={1} max={14} {...register('current_semester', { valueAsNumber: true })} disabled={isLoading} />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>No. HP</Label>
              <Input {...register('phone')} disabled={isLoading} />
            </div>
            <div className="space-y-2">
              <Label>Program Studi</Label>
              <Select
                defaultValue={userData.study_program_id ?? ''}
                onValueChange={(v) => setValue('study_program_id', v)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih program studi" />
                </SelectTrigger>
                <SelectContent>
                  {studyPrograms.map((sp) => (
                    <SelectItem key={sp.id} value={sp.id}>{sp.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                defaultValue={userData.is_active ? 'true' : 'false'}
                onValueChange={(v) => setValue('is_active', v === 'true')}
                disabled={isLoading}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Aktif</SelectItem>
                  <SelectItem value="false">Nonaktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Hapus
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Akun</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus akun <strong>{userData.full_name}</strong>? Semua data terkait akan ikut terhapus. Tindakan ini tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus Akun
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

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
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
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

  const form = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      full_name: userData.full_name,
      nim: userData.nim ?? '',
      phone: userData.phone ?? '',
      current_semester: userData.current_semester ?? undefined,
      current_semester_type: userData.current_semester_type ?? 'ganjil',
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
        credentials: 'include',
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
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE', credentials: 'include' })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error ?? 'Gagal menghapus akun')
        return
      }
      toast.success('Akun berhasil dihapus')
      router.back()
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
        <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Edit Data Pengguna</DialogTitle>
            <DialogDescription>Perbarui data pengguna</DialogDescription>
          </DialogHeader>
          <Separator />
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col">
              <div className="flex flex-col gap-4 px-6 py-4 max-h-[60vh] overflow-y-auto">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl>
                        <Input disabled={isLoading} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {userData.role === 'student' && (
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nim"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>NIM</FormLabel>
                          <FormControl>
                            <Input disabled={isLoading} {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="current_semester"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Semester</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={14}
                              disabled={isLoading}
                              {...field}
                              onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="current_semester_type"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Jenis Semester Aktif</FormLabel>
                          <Select
                            value={field.value ?? 'ganjil'}
                            onValueChange={field.onChange}
                            disabled={isLoading}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Pilih jenis semester" />
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
                )}

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. HP</FormLabel>
                      <FormControl>
                        <Input disabled={isLoading} {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="study_program_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program Studi</FormLabel>
                      <Select
                        value={field.value ?? ''}
                        onValueChange={field.onChange}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih program studi" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {studyPrograms.map((sp) => (
                            <SelectItem key={sp.id} value={sp.id}>{sp.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        value={field.value ? 'true' : 'false'}
                        onValueChange={(v) => field.onChange(v === 'true')}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Aktif</SelectItem>
                          <SelectItem value="false">Nonaktif</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Sticky footer */}
              <Separator />
              <div className="flex justify-end gap-2 px-6 py-4">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={isLoading}>
                  Batal
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Simpan
                </Button>
              </div>
            </form>
          </Form>
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
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Akun</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus akun <strong>{userData.full_name}</strong>? Semua data terkait akan ikut terhapus. Tindakan ini tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isLoading}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus Akun
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

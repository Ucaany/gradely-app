'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { createUserSchema, type CreateUserInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { StudyProgram, UserRole } from '@/types'

interface CreateUserFormProps {
  studyPrograms: StudyProgram[]
  universityId: string
  defaultRole?: UserRole
  redirectTo?: string
}

export function CreateUserForm({
  studyPrograms,
  universityId,
  defaultRole = 'student',
  redirectTo,
}: CreateUserFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: defaultRole,
      university_id: universityId,
    },
  })

  const selectedRole = watch('role')

  async function onSubmit(data: CreateUserInput) {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error ?? 'Gagal membuat akun')
        return
      }

      toast.success('Akun berhasil dibuat!')
      router.push(redirectTo ?? `/admin/users/${data.role === 'student' ? 'students' : 'lecturers'}`)
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informasi Akun</CardTitle>
          <CardDescription>Data login pengguna</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nama Lengkap *</Label>
              <Input
                id="full_name"
                placeholder="Nama lengkap"
                disabled={isLoading}
                {...register('full_name')}
              />
              {errors.full_name && (
                <p className="text-sm text-destructive">{errors.full_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@isi.ac.id"
                disabled={isLoading}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 karakter"
                disabled={isLoading}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">No. HP</Label>
              <Input
                id="phone"
                placeholder="08xxxxxxxxxx"
                disabled={isLoading}
                {...register('phone')}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Akademik</CardTitle>
          <CardDescription>Data akademik dan peran pengguna</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select
                defaultValue={defaultRole}
                onValueChange={(v) => setValue('role', v as UserRole)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Mahasiswa</SelectItem>
                  <SelectItem value="lecturer">Dosen Wali</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="company">Perusahaan</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-sm text-destructive">{errors.role.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Program Studi</Label>
              <Select
                onValueChange={(v) => setValue('study_program_id', v as string)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih program studi" />
                </SelectTrigger>
                <SelectContent>
                  {studyPrograms.map((sp) => (
                    <SelectItem key={sp.id} value={sp.id}>
                      {sp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedRole === 'student' && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nim">NIM</Label>
                <Input
                  id="nim"
                  placeholder="Nomor Induk Mahasiswa"
                  disabled={isLoading}
                  {...register('nim')}
                />
                {errors.nim && (
                  <p className="text-sm text-destructive">{errors.nim.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_semester">Semester Aktif</Label>
                <Input
                  id="current_semester"
                  type="number"
                  min={1}
                  max={14}
                  placeholder="1–14"
                  disabled={isLoading}
                  {...register('current_semester', { valueAsNumber: true })}
                />
                {errors.current_semester && (
                  <p className="text-sm text-destructive">
                    {errors.current_semester.message}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Batal
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Menyimpan...' : 'Buat Akun'}
        </Button>
      </div>
    </form>
  )
}

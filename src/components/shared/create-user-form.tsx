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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'
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

  const form = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      role: defaultRole,
      university_id: universityId,
      full_name: '',
      email: '',
      password: '',
      phone: '',
      nim: '',
      study_program_id: '',
      current_semester_type: 'ganjil',
    },
  })

  const selectedRole = form.watch('role')

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
      router.refresh()
      router.push(redirectTo ?? `/admin/users/${data.role === 'student' ? 'students' : data.role === 'lecturer' ? 'lecturers' : 'companies'}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Informasi Akun */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Akun</CardTitle>
            <CardDescription>Data login pengguna</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Nama lengkap" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@isi.ac.id" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Min. 8 karakter" disabled={isLoading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No. HP</FormLabel>
                  <FormControl>
                    <Input placeholder="08xxxxxxxxxx" disabled={isLoading} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Informasi Akademik */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Akademik</CardTitle>
            <CardDescription>Data akademik dan peran pengguna</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role <span className="text-destructive">*</span></FormLabel>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="student">Mahasiswa</SelectItem>
                      <SelectItem value="lecturer">Dosen Wali</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="company">Perusahaan</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {studyPrograms.length > 0 && (
              <FormField
                control={form.control}
                name="study_program_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Program Studi</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value ?? ''}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Pilih program studi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {studyPrograms.map((sp) => (
                          <SelectItem key={sp.id} value={sp.id}>
                            {sp.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedRole === 'student' && (
              <>
                <Separator className="col-span-full" />
                <FormField
                  control={form.control}
                  name="nim"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NIM</FormLabel>
                      <FormControl>
                        <Input placeholder="Nomor Induk Mahasiswa" disabled={isLoading} {...field} value={field.value ?? ''} />
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
                      <FormLabel>Semester Aktif</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={14}
                          placeholder="1–14"
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
                    <FormItem>
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
              </>
            )}
          </CardContent>
        </Card>

        {/* Sticky footer */}
        <div className="flex justify-end gap-3 pt-2">
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
    </Form>
  )
}

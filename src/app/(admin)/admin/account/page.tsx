'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  Lock,
  Eye,
  EyeOff,
  Save,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'Password saat ini wajib diisi'),
  new_password: z.string().min(8, 'Password baru minimal 8 karakter'),
  confirm_password: z.string().min(1, 'Konfirmasi password wajib diisi'),
}).refine((d) => d.new_password === d.confirm_password, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirm_password'],
})

type ChangePasswordInput = z.infer<typeof changePasswordSchema>

function PasswordInput({ field, placeholder, disabled }: { field: object; placeholder: string; disabled: boolean }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        disabled={disabled}
        className="pr-10"
        {...(field as React.InputHTMLAttributes<HTMLInputElement>)}
      />
      <button
        type="button"
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setShow((v) => !v)}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

export default function AdminAccountPage() {
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  })

  async function onSubmit(data: ChangePasswordInput) {
    setIsSaving(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error ?? 'Gagal mengubah password')
        return
      }
      toast.success('Password berhasil diubah')
      form.reset()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Akun Saya</h1>
        <p className="text-sm text-muted-foreground">Kelola keamanan dan akses akun admin</p>
      </div>

      <div className="grid gap-4 max-w-2xl">
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Ubah Password</CardTitle>
              <CardDescription>Perbarui password akun admin kamu secara berkala</CardDescription>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="current_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password Saat Ini</FormLabel>
                      <FormControl>
                        <PasswordInput field={field} placeholder="Masukkan password saat ini" disabled={isSaving} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="new_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password Baru</FormLabel>
                      <FormControl>
                        <PasswordInput field={field} placeholder="Minimal 8 karakter" disabled={isSaving} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Konfirmasi Password Baru</FormLabel>
                      <FormControl>
                        <PasswordInput field={field} placeholder="Ulangi password baru" disabled={isSaving} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isSaving} className="w-full sm:w-auto">
                  {isSaving
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>
                    : <><Save className="mr-2 h-4 w-4" />Simpan Password</>
                  }
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Tips Keamanan Akun</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Gunakan password minimal 8 karakter dengan kombinasi huruf dan angka</li>
                  <li>Jangan bagikan password kamu ke siapapun</li>
                  <li>Ganti password secara berkala setiap 3 bulan sekali</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

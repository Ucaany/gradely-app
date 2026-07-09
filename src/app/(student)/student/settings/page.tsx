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
  UserCircle,
  ArrowRight,
  ShieldCheck,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import {
  Card,
  CardContent,
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

const quickLinks = [
  {
    label: 'Profil Saya',
    desc: 'Ubah nama, foto, nomor HP, dan semester aktif',
    href: '/student/profile',
    icon: UserCircle,
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400',
  },
  {
    label: 'Invite Token',
    desc: 'Hubungkan akun ke dosen wali menggunakan kode undangan',
    href: '/student/settings/invite',
    icon: Users,
    color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400',
  },
]

export default function StudentSettingsPage() {
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { current_password: '', new_password: '', confirm_password: '' },
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
      if (!res.ok) { toast.error(result.error ?? 'Gagal mengubah password'); return }
      toast.success('Password berhasil diubah')
      form.reset()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-6 md:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">Kelola akun dan keamanan kamu</p>
      </div>

      {/* ── Akses Cepat ── */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold">Menu Utama</h2>
          <p className="text-sm text-muted-foreground">Akses fitur pengaturan dengan cepat</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${item.color}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Separator />

      {/* ── Ubah Password ── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-base font-semibold">Ubah Password</h2>
            <p className="text-sm text-muted-foreground">Perbarui password akun kamu secara berkala untuk keamanan</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
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
                <div className="grid gap-4 sm:grid-cols-2">
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
                        <FormLabel>Konfirmasi Password</FormLabel>
                        <FormControl>
                          <PasswordInput field={field} placeholder="Ulangi password baru" disabled={isSaving} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" disabled={isSaving} size="sm">
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
              <div>
                <p className="text-xs font-medium">Tips Keamanan</p>
                <ul className="text-xs text-muted-foreground mt-1 space-y-0.5 list-disc list-inside">
                  <li>Gunakan password minimal 8 karakter</li>
                  <li>Jangan bagikan password ke siapapun</li>
                  <li>Ganti password setiap 3 bulan sekali</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

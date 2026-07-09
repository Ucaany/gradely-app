'use client'

import * as React from 'react'
import { Suspense, useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, GraduationCap, Building2, Users, Briefcase, User, Eye, EyeOff } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { loginSchema, type LoginInput } from '@/lib/validations'
import type { UserRole } from '@/types'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FloatingPaths } from '@/components/floating-paths'
import { cn } from '@/lib/utils'

const ROLE_HOME: Record<UserRole, string> = {
  student: '/student/dashboard',
  lecturer: '/lecturer/dashboard',
  admin: '/admin/dashboard',
  company: '/company/dashboard',
}

const ROLE_TABS = [
  { value: 'student', label: 'Mahasiswa', icon: Users },
  { value: 'lecturer', label: 'Dosen Wali', icon: User },
  { value: 'admin', label: 'Admin', icon: Building2 },
  { value: 'company', label: 'Industri', icon: Briefcase },
] as const

const QUOTES = [
  '"Dari ruang kelas menuju karier — semua perjalanan akademikmu tercatat dengan baik."',
  '"Setiap nilai adalah langkah menuju masa depan yang kamu impikan."',
  '"Kesuksesan dimulai dari fondasi akademik yang kuat dan terarah."',
  '"Dosen, mahasiswa, dan industri — terhubung dalam satu ekosistem."',
]

function LoginFormInner({ className }: { className?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo')
  const errorParam = searchParams.get('error')

  const [isLoading, setIsLoading] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>('student')
  const [showPassword, setShowPassword] = useState(false)
  const [quoteIdx, setQuoteIdx] = useState(0)
  const [fadeIn, setFadeIn] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeIn(false)
      setTimeout(() => {
        setQuoteIdx((prev) => (prev + 1) % QUOTES.length)
        setFadeIn(true)
      }, 400)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onSubmit',
  })

  async function onSubmit(data: LoginInput) {
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) {
        toast.error(
          error.message === 'Invalid login credentials'
            ? 'Email atau password salah'
            : error.message
        )
        return
      }

      const { data: { user: authUser } } = await supabase.auth.getUser()
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role, is_active')
        .eq('id', authUser!.id)
        .single()

      if (profileError || !profile) {
        toast.error('Gagal memuat profil pengguna')
        await supabase.auth.signOut()
        return
      }

      if (!profile.is_active) {
        toast.error('Akun Anda tidak aktif. Hubungi Admin.')
        await supabase.auth.signOut()
        return
      }

      toast.success('Login berhasil!')
      const destination = redirectTo || ROLE_HOME[profile.role as UserRole] || '/login'
      router.push(destination)
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className={cn('relative md:h-screen md:overflow-hidden lg:grid lg:grid-cols-2', className)}>
      {/* Left — FloatingPaths + rotating quote */}
      <div className="relative hidden h-full flex-col border-r bg-secondary p-10 lg:flex dark:bg-secondary/20">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="z-10 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-[family-name:var(--font-montserrat)] font-bold text-lg tracking-tight">
            Gradely
          </span>
        </div>
        <div className="z-10 mt-auto">
          <blockquote
            className={cn(
              'space-y-2 transition-opacity duration-500',
              fadeIn ? 'opacity-100' : 'opacity-0'
            )}
          >
            <p className="font-[family-name:var(--font-montserrat)] text-xl font-medium leading-relaxed">
              {QUOTES[quoteIdx]}
            </p>
            <footer className="font-mono text-sm text-muted-foreground">
              ~ Tim Gradely
            </footer>
          </blockquote>
        </div>
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
      </div>

      {/* Right — Form */}
      <div className="relative flex min-h-screen flex-col justify-center px-8 py-12">
        <div aria-hidden className="absolute inset-0 isolate -z-10 opacity-60 contain-strict">
          <div className="absolute top-0 right-0 h-[320px] w-[560px] -translate-y-[350px] rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,rgba(0,0,0,0.06)_0,rgba(140,140,140,0.02)_50%,rgba(0,0,0,0.01)_80%)]" />
          <div className="absolute top-0 right-0 h-[320px] w-[240px] rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(0,0,0,0.04)_0,rgba(0,0,0,0.01)_80%,transparent_100%)] translate-x-[5%] -translate-y-[50%]" />
        </div>

        <div className="mx-auto w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-[family-name:var(--font-montserrat)] font-bold text-lg tracking-tight">
              Gradely
            </span>
          </div>

          {/* Static heading */}
          <div className="space-y-1">
            <h1 className="font-[family-name:var(--font-montserrat)] font-bold text-2xl tracking-tight">
              Selamat Datang
            </h1>
            <p className="text-muted-foreground text-sm">
              Masuk ke akun Anda untuk melanjutkan
            </p>
          </div>

          {errorParam === 'account_inactive' && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              Akun Anda tidak aktif. Hubungi Admin.
            </div>
          )}

          {/* Form fields */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="nama@email.com"
                autoComplete="email"
                disabled={isLoading}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="login-password">Password</Label>
                <Link
                  href="/reset-password"
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={isLoading}
                  {...register('password')}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full font-[family-name:var(--font-montserrat)] font-semibold"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Masuk...' : 'Masuk'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-background px-3 text-muted-foreground">Login sebagai</span>
            </div>
          </div>

          {/* Role buttons — clean, 2x2 grid */}
          <div className="grid grid-cols-2 gap-2">
            {ROLE_TABS.map((role) => {
              const Icon = role.icon
              const isActive = selectedRole === role.value
              return (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setSelectedRole(role.value)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all',
                    isActive
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {role.label}
                </button>
              )
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Belum punya akun?{' '}
            <span className="font-medium text-foreground">Hubungi Admin</span>
          </p>
        </div>
      </div>
    </main>
  )
}

export function LoginForm({ className }: { className?: string }) {
  return (
    <Suspense fallback={<div className="h-screen w-full animate-pulse bg-muted" />}>
      <LoginFormInner className={className} />
    </Suspense>
  )
}

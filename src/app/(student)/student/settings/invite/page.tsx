'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
  Users,
  Hash,
  CheckCircle2,
  GraduationCap,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getInitials } from '@/lib/utils'

interface AdvisorData {
  id: string
  created_at: string
  join_code: string | null
  users: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
  } | null
}

export default function InviteTokenPage() {
  const [joinCode, setJoinCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [advisors, setAdvisors] = useState<AdvisorData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  async function fetchAdvisors() {
    setIsLoading(true)
    try {
      const res = await fetch('/api/student/join-advisor')
      const result = await res.json()
      if (result.success) setAdvisors(result.data ?? [])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchAdvisors() }, [])

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase()
    if (!code) { toast.error('Masukkan kode terlebih dahulu'); return }
    setIsJoining(true)
    try {
      const res = await fetch('/api/student/join-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ join_code: code }),
      })
      const result = await res.json()
      if (!res.ok) { toast.error(result.error ?? 'Gagal bergabung'); return }
      toast.success(`Berhasil bergabung dengan dosen wali ${result.data.lecturer_name}`)
      setJoinCode('')
      fetchAdvisors()
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-6 md:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Invite Token</h1>
        <p className="text-sm text-muted-foreground">Hubungkan akun kamu ke dosen wali menggunakan kode undangan</p>
      </div>

      {/* ── Aksi ── */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-base font-semibold">Bergabung ke Dosen Wali</h2>
          <p className="text-sm text-muted-foreground">Masukkan kode unik dari dosen wali untuk mulai proses bimbingan akademik</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {/* Input card */}
          <Card className="sm:col-span-2">
            <CardContent className="pt-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
                  <Hash className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Masukkan Kode Undangan</p>
                  <p className="text-xs text-muted-foreground">Kode terdiri dari 8 karakter huruf dan angka</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Contoh: AB3K9P2X"
                    className="pl-9 font-mono tracking-widest uppercase"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                    disabled={isJoining}
                    maxLength={12}
                  />
                </div>
                <Button onClick={handleJoin} disabled={isJoining || !joinCode.trim()} size="sm">
                  {isJoining
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <><CheckCircle2 className="h-4 w-4 mr-1.5" />Bergabung</>
                  }
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info card */}
          <Card className="border-dashed">
            <CardContent className="py-5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-medium">Cara mendapatkan kode</p>
                  <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                    <li>Hubungi dosen wali kamu</li>
                    <li>Minta kode invite dari portal dosen</li>
                    <li>Masukkan kode di form ini</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      {/* ── Dosen Terhubung ── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
              Dosen Wali Terhubung
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {advisors.length === 0 ? 'Belum ada dosen wali yang terhubung' : `${advisors.length} dosen wali aktif`}
            </p>
          </div>
          {advisors.length > 0 && (
            <span className="inline-flex items-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-medium px-2.5 py-1">
              {advisors.length} aktif
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : advisors.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <Users className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <div>
                <p className="text-sm font-medium">Belum terhubung ke dosen wali</p>
                <p className="text-xs text-muted-foreground mt-1">Masukkan kode undangan dari dosen wali di atas</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {advisors.map((a) => (
              <Card key={a.id}>
                <CardContent className="pt-5">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={a.users?.avatar_url ?? ''} />
                      <AvatarFallback className="text-sm">{getInitials(a.users?.full_name ?? '?')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.users?.full_name ?? '-'}</p>
                      <p className="text-xs text-muted-foreground truncate">{a.users?.email ?? '-'}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Bergabung {new Date(a.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Aktif
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

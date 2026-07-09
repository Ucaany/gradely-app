"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Bell, CheckCircle2, AlertTriangle, AlertOctagon, XCircle, TrendingUp } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

interface AcademicInfo {
  academic_status: string
  status_label: string
  status_color: string
  status_bg: string
  onboarding_completed: boolean
  current_semester: number
  gpa: number
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType; dot: string }> = {
  ahead: { label: 'Unggul', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/40', icon: TrendingUp, dot: 'bg-green-500' },
  on_track: { label: 'Sesuai Target', color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40', icon: CheckCircle2, dot: 'bg-blue-500' },
  need_attention: { label: 'Perlu Perhatian', color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950/40', icon: AlertTriangle, dot: 'bg-yellow-500' },
  recovery_mode: { label: 'Butuh Pemulihan', color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/40', icon: AlertOctagon, dot: 'bg-orange-500' },
  critical: { label: 'Darurat Akademik', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/40', icon: XCircle, dot: 'bg-red-500' },
}

const STATUS_DESC: Record<string, string> = {
  ahead: 'Progres SKS kamu melebihi target. Pertahankan!',
  on_track: 'Progres kamu sesuai target. Terus semangat!',
  need_attention: 'Progres sedikit di bawah target. Perlu ditingkatkan.',
  recovery_mode: 'Progres jauh di bawah target. Segera konsultasi dosen wali.',
  critical: 'Nilai & SKS berisiko gagal tepat waktu. Hubungi dosen wali sekarang.',
}

export function NotificationBell() {
  const [info, setInfo] = useState<AcademicInfo | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    async function fetchInfo() {
      try {
        const [summaryRes, profileRes] = await Promise.all([
          fetch('/api/student/summary'),
          fetch('/api/student/profile'),
        ])
        const summaryResult = await summaryRes.json()
        const profileResult = await profileRes.json()
        if (summaryResult.success && profileResult.success) {
          const summary = summaryResult.data.summary
          const profile = profileResult.data
          const cfg = STATUS_CONFIG[summary.academic_status]
          setInfo({
            academic_status: summary.academic_status,
            status_label: cfg?.label ?? summary.academic_status,
            status_color: cfg?.color ?? '',
            status_bg: cfg?.bg ?? '',
            onboarding_completed: profile?.onboarding_completed ?? true,
            current_semester: summary.current_semester,
            gpa: summary.gpa,
          })
        }
      } catch {}
    }
    fetchInfo()
  }, [])

  const notifCount = info ? (!info.onboarding_completed ? 1 : 0) + (['need_attention', 'recovery_mode', 'critical'].includes(info.academic_status) ? 1 : 0) : 0

  const cfg = info ? STATUS_CONFIG[info.academic_status] : null
  const StatusIcon = cfg?.icon

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
        aria-label="Notifikasi"
      >
        <Bell className="h-4 w-4" />
        {notifCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {notifCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <p className="text-sm font-semibold">Notifikasi</p>
          {notifCount > 0 && (
            <span className="text-xs text-muted-foreground">{notifCount} baru</span>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {!info ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : notifCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center px-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Semua beres!</p>
              <p className="text-xs text-muted-foreground">Tidak ada notifikasi saat ini.</p>
            </div>
          ) : (
            <div className="divide-y">
              {!info.onboarding_completed && (
                <div className="px-4 py-3 flex items-start gap-3 bg-yellow-50/50 dark:bg-yellow-950/20">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 mt-0.5">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Onboarding belum selesai</p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5 leading-relaxed">Lengkapi profil dan pilih minat kariermu agar pengalaman Gradely lebih personal.</p>
                    <Link
                      href="/student/onboarding"
                      className="inline-block mt-2 text-xs font-medium text-yellow-800 dark:text-yellow-300 underline underline-offset-2"
                      onClick={() => setOpen(false)}
                    >
                      Lanjutkan sekarang →
                    </Link>
                  </div>
                </div>
              )}

              {cfg && StatusIcon && ['need_attention', 'recovery_mode', 'critical'].includes(info.academic_status) && (
                <div className={cn('px-4 py-3 flex items-start gap-3', info.status_bg)}>
                  <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/60 dark:bg-black/20 mt-0.5', cfg.color)}>
                    <StatusIcon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-semibold', cfg.color)}>Status: {info.status_label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{STATUS_DESC[info.academic_status]}</p>
                    <Link
                      href="/student/target"
                      className="inline-block mt-2 text-xs font-medium underline underline-offset-2 text-muted-foreground"
                      onClick={() => setOpen(false)}
                    >
                      Lihat target kelulusan →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {info && notifCount > 0 && (
          <>
            <Separator />
            <div className="px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {cfg && (
                  <span className={cn('inline-block h-2 w-2 rounded-full', cfg.dot)} />
                )}
                <span className="text-xs text-muted-foreground">
                  Status: <span className={cn('font-medium', cfg?.color)}>{info.status_label}</span>
                </span>
              </div>
              <span className="text-xs text-muted-foreground">Sem {info.current_semester} · IPK {info.gpa.toFixed(2)}</span>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

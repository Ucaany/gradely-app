'use client'

/**
 * UserSettingsMascot — Komponen #5: Header personal di halaman Settings/Account
 *
 * UX Note:
 * Halaman pengaturan akun biasanya terasa dingin dan transaksional.
 * Menambahkan maskot yang merespons konteks (nama user, waktu hari,
 * dan progress kelengkapan profil) mengubah pengalaman menjadi
 * percakapan yang personal. Ini adalah teknik "personalization cue"
 * yang terbukti meningkatkan engagement dan mengurangi churn pada
 * halaman yang biasanya diabaikan pengguna.
 *
 * Maskot yang digunakan:
 *   pagi   → mascot-cycling         (energik, semangat pagi)
 *   siang  → mascot-idea-clipboard  (produktif, fokus siang)
 *   malam  → mascot-sitting-reading (santai, istirahat malam)
 *   profil tidak lengkap → mascot-crawling (butuh bantuan!)
 */

import * as React from 'react'
import { useMemo } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { MascotDecorator, type MascotAssetId } from '@/components/mascot/mascot-decorator'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserSettingsMascotProps {
  /** Nama lengkap pengguna */
  userName: string
  /** Role pengguna untuk konteks sapaan */
  userRole?: 'student' | 'lecturer' | 'admin' | 'company'
  /**
   * Persentase kelengkapan profil (0–100).
   * Di bawah 60% memunculkan maskot "perlu bantuan".
   */
  profileCompletion?: number
  /** Avatar URL opsional */
  avatarUrl?: string
  className?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type TimeOfDay = 'morning' | 'afternoon' | 'evening'

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours()
  if (hour >= 5  && hour < 12) return 'morning'
  if (hour >= 12 && hour < 18) return 'afternoon'
  return 'evening'
}

const TIME_CONFIG: Record<
  TimeOfDay,
  { greeting: string; mascotId: MascotAssetId; animate: 'float' | 'bounce' | 'none' }
> = {
  morning:   { greeting: 'Selamat pagi',  mascotId: 'mascot-cycling',         animate: 'bounce' },
  afternoon: { greeting: 'Selamat siang', mascotId: 'mascot-idea-clipboard',  animate: 'float' },
  evening:   { greeting: 'Selamat malam', mascotId: 'mascot-sitting-reading', animate: 'float' },
}

const ROLE_LABEL: Record<string, string> = {
  student:  'Mahasiswa',
  lecturer: 'Dosen Wali',
  admin:    'Administrator',
  company:  'Mitra Industri',
}

function getCompletionLabel(pct: number): { label: string; color: string } {
  if (pct >= 90) return { label: 'Profil Lengkap',   color: 'text-green-600 dark:text-green-400' }
  if (pct >= 60) return { label: 'Hampir Lengkap',   color: 'text-yellow-600 dark:text-yellow-400' }
  return            { label: 'Perlu Dilengkapi',  color: 'text-destructive' }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function UserSettingsMascot({
  userName,
  userRole = 'student',
  profileCompletion = 100,
  className,
}: UserSettingsMascotProps) {
  const timeOfDay = useMemo(() => getTimeOfDay(), [])
  const timeConfig = TIME_CONFIG[timeOfDay]

  // Jika profil tidak lengkap, override maskot
  const mascotId: MascotAssetId =
    profileCompletion < 60 ? 'mascot-crawling' : timeConfig.mascotId
  const mascotAnimate =
    profileCompletion < 60 ? 'none' : timeConfig.animate

  const { label: completionLabel, color: completionColor } =
    getCompletionLabel(profileCompletion)

  const firstName = userName.split(' ')[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden rounded-xl',
        'border border-border/50',
        'bg-gradient-to-br from-card to-muted/30',
        'backdrop-blur-sm',
        'px-6 py-5',
        className
      )}
    >
      {/* Background dekoratif subtle */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(circle at 80% 50%, hsl(var(--primary)) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />

      <div className="relative flex items-center gap-5">
        {/* Maskot */}
        <MascotDecorator
          assetId={mascotId}
          size="lg"
          state={profileCompletion < 60 ? 'warning' : 'idle'}
          animate={mascotAnimate}
          priority
          aria-hidden
        />

        {/* Konten teks */}
        <div className="flex flex-col gap-2 min-w-0">
          {/* Sapaan */}
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-foreground truncate">
              {timeConfig.greeting},{' '}
              <span className="text-primary">{firstName}</span>
            </h2>
            {userRole && (
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                {ROLE_LABEL[userRole] ?? userRole}
              </Badge>
            )}
          </div>

          {/* Progress profil */}
          {profileCompletion < 100 && (
            <div className="flex flex-col gap-1 max-w-xs">
              <div className="flex items-center justify-between gap-2">
                <span className={cn('text-xs font-medium', completionColor)}>
                  {completionLabel}
                </span>
                <span className="text-xs text-muted-foreground">
                  {profileCompletion}%
                </span>
              </div>
              <Progress
                value={profileCompletion}
                className="h-1.5"
                aria-label={`Kelengkapan profil ${profileCompletion}%`}
              />
              {profileCompletion < 60 && (
                <p className="text-xs text-muted-foreground">
                  Lengkapi profil untuk pengalaman terbaik.
                </p>
              )}
            </div>
          )}

          {profileCompletion >= 100 && (
            <p className="text-xs text-muted-foreground">
              Kelola preferensi dan informasi akun kamu di sini.
            </p>
          )}
        </div>
      </div>
    </motion.div>
  )
}

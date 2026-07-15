'use client'

/**
 * FormSuccessBanner — Komponen #3: Perayaan setelah form berhasil dikirim
 *
 * UX Note:
 * Pengiriman form adalah titik puncak effort pengguna. Memberikan feedback
 * perayaan dengan maskot "mascot-running-document" yang berlari kegirangan
 * mengaktifkan dopamine reward loop — membuat pengguna merasa prestasinya
 * dihargai. Konfeti ringan (tanpa library berat) menambah kesan meriah
 * tanpa mengganggu desain glassmorphism. Banner ini auto-dismiss setelah
 * durasi yang bisa dikonfigurasi, sehingga tidak menghalangi flow berikutnya.
 *
 * Maskot yang digunakan:
 *   mascot-running-document → berlari membawa dokumen (misi selesai!)
 */

import * as React from 'react'
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CheckCircle2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MascotDecorator } from '@/components/mascot/mascot-decorator'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormSuccessBannerProps {
  /** Kontrol visibilitas dari parent */
  visible: boolean
  /** Judul pesan sukses */
  title?: string
  /** Deskripsi tambahan */
  description?: string
  /** Auto-dismiss setelah N ms (default: 6000). Set 0 untuk nonaktifkan. */
  autoDismissMs?: number
  /** Callback saat banner ditutup */
  onDismiss?: () => void
  className?: string
}

// ---------------------------------------------------------------------------
// Konfeti mini — partikel CSS murni tanpa library eksternal
// ---------------------------------------------------------------------------

const CONFETTI_COLORS = [
  'bg-green-400', 'bg-blue-400', 'bg-yellow-400',
  'bg-pink-400', 'bg-indigo-400', 'bg-orange-400',
]

function ConfettiParticles() {
  // 12 partikel dengan posisi dan delay acak namun deterministik
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    left: `${8 + i * 7.5}%`,
    delay: `${(i * 0.12).toFixed(2)}s`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: i % 3 === 0 ? 'w-2 h-2' : 'w-1.5 h-1.5',
  }))

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className={cn(
            'absolute top-0 rounded-full animate-confetti',
            p.color,
            p.size
          )}
          style={{ left: p.left, animationDelay: p.delay }}
        />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FormSuccessBanner({
  visible,
  title = 'Berhasil Disimpan!',
  description = 'Data kamu sudah kami catat dengan baik.',
  autoDismissMs = 6000,
  onDismiss,
  className,
}: FormSuccessBannerProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (visible && autoDismissMs > 0 && onDismiss) {
      timerRef.current = setTimeout(onDismiss, autoDismissMs)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [visible, autoDismissMs, onDismiss])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="success-banner"
          initial={{ opacity: 0, y: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0,   scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 340, damping: 26 }}
          className={cn(
            'relative overflow-hidden rounded-xl border border-green-400/30',
            'bg-green-50/80 dark:bg-green-950/40',
            'backdrop-blur-sm shadow-lg shadow-green-500/10',
            'px-5 py-4',
            className
          )}
          role="status"
          aria-live="polite"
          aria-label={title}
        >
          {/* Konfeti */}
          <ConfettiParticles />

          {/* Konten utama */}
          <div className="relative flex items-center gap-4">
            {/* Maskot perayaan */}
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 0.9, repeat: 3, ease: 'easeInOut' }}
              className="flex-shrink-0"
              aria-hidden="true"
            >
              <MascotDecorator
                assetId="mascot-running-document"
                size="md"
                state="success"
                noGlow
              />
            </motion.div>

            {/* Teks */}
            <div className="flex flex-1 flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-1.5">
                <CheckCircle2
                  className="h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400"
                  aria-hidden="true"
                />
                <p className="text-sm font-semibold text-green-800 dark:text-green-200 truncate">
                  {title}
                </p>
              </div>
              {description && (
                <p className="text-xs text-green-700/80 dark:text-green-300/80 leading-relaxed">
                  {description}
                </p>
              )}
            </div>

            {/* Tombol tutup */}
            {onDismiss && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDismiss}
                className="flex-shrink-0 h-7 w-7 text-green-700 hover:text-green-900 hover:bg-green-200/50 dark:text-green-300 dark:hover:bg-green-800/30"
                aria-label="Tutup notifikasi"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Progress bar auto-dismiss */}
          {autoDismissMs > 0 && (
            <motion.div
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: autoDismissMs / 1000, ease: 'linear' }}
              className="absolute bottom-0 left-0 h-0.5 w-full origin-left bg-green-400/50"
              aria-hidden="true"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

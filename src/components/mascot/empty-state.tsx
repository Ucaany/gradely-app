'use client'

/**
 * EmptyState — Komponen #2: Layar kosong / no-data
 *
 * UX Note:
 * Empty state adalah momen psikologis paling rentan: pengguna bingung dan
 * tidak tahu apa yang harus dilakukan. Maskot "mascot-sitting-reading" yang
 * sedang membaca + animasi float memberikan kesan "halaman ini santai,
 * belum ada data — bukan kesalahan kamu". Ini mengurangi disorientasi dan
 * mendorong pengguna melakukan CTA (call-to-action) pertama mereka.
 * Variasi maskot per konteks memberikan rasa personal yang menambah
 * keterlibatan emosional pengguna.
 *
 * Maskot yang digunakan:
 *   default  → mascot-sitting-reading   (santai, informatif)
 *   search   → mascot-phone-thinking    (mencari, penasaran)
 *   error    → mascot-angry-watch       (ada masalah teknis)
 *   activity → mascot-cycling           (ayo mulai bergerak)
 */

import * as React from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { MascotDecorator, type MascotAssetId } from '@/components/mascot/mascot-decorator'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EmptyStateVariant = 'default' | 'search' | 'error' | 'activity'

interface EmptyStateProps {
  /** Judul utama */
  title: string
  /** Deskripsi / instruksi tambahan */
  description?: string
  /** Variasi konteks yang menentukan maskot */
  variant?: EmptyStateVariant
  /** Override maskot manual */
  mascotOverride?: MascotAssetId
  /** Tombol CTA opsional */
  action?: React.ReactNode
  /** Ukuran maskot */
  mascotSize?: 'md' | 'lg'
  className?: string
}

// ---------------------------------------------------------------------------
// Config per variant
// ---------------------------------------------------------------------------

const VARIANT_CONFIG: Record<
  EmptyStateVariant,
  { mascotId: MascotAssetId; bgAccent: string }
> = {
  default:  { mascotId: 'mascot-sitting-reading', bgAccent: 'from-muted/40 to-muted/0' },
  search:   { mascotId: 'mascot-phone-thinking',  bgAccent: 'from-indigo-50/60 to-indigo-50/0 dark:from-indigo-950/30 dark:to-transparent' },
  error:    { mascotId: 'mascot-angry-watch',     bgAccent: 'from-red-50/60 to-red-50/0 dark:from-red-950/30 dark:to-transparent' },
  activity: { mascotId: 'mascot-cycling',         bgAccent: 'from-green-50/60 to-green-50/0 dark:from-green-950/30 dark:to-transparent' },
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EmptyState({
  title,
  description,
  variant = 'default',
  mascotOverride,
  action,
  mascotSize = 'lg',
  className,
}: EmptyStateProps) {
  const config = VARIANT_CONFIG[variant]
  const mascotId = mascotOverride ?? config.mascotId

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={cn(
        'flex flex-col items-center justify-center gap-5 rounded-xl px-6 py-12 text-center',
        'bg-gradient-to-b',
        config.bgAccent,
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Maskot dengan efek float lambat */}
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      >
        <MascotDecorator
          assetId={mascotId}
          size={mascotSize}
          state="idle"
          noGlow
        />
      </motion.div>

      {/* Teks */}
      <div className="flex flex-col gap-1.5 max-w-xs">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {/* CTA */}
      {action && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.3 }}
        >
          {action}
        </motion.div>
      )}
    </motion.div>
  )
}

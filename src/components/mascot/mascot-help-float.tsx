'use client'

/**
 * MascotHelpFloat — Komponen #4: Maskot helper mengambang pada form kompleks
 *
 * UX Note:
 * Form panjang (seperti input data akademik multi-field) menyebabkan
 * "form fatigue" — pengguna kehilangan motivasi di tengah jalan.
 * Maskot "mascot-idea-clipboard" yang mengambang di pojok kanan bawah
 * form bertindak sebagai "teman belajar" yang selalu siap membantu.
 * Tombol expand-nya membuka tooltip kontekstual berisi tips untuk
 * field yang sedang aktif — ini meningkatkan completion rate form
 * secara signifikan karena pengguna tidak perlu meninggalkan halaman
 * untuk mencari bantuan.
 *
 * Maskot yang digunakan:
 *   mascot-idea-clipboard → sedang membawa clipboard dengan ide (siap bantu!)
 */

import * as React from 'react'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MascotDecorator } from '@/components/mascot/mascot-decorator'
import { Button } from '@/components/ui/button'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HelpTip {
  /** Label singkat untuk judul tip */
  title: string
  /** Penjelasan yang ditampilkan dalam tooltip */
  body: string
}

interface MascotHelpFloatProps {
  /** Tips yang ditampilkan saat panel terbuka */
  tips: HelpTip[]
  /** Judul panel bantuan */
  panelTitle?: string
  /** Posisi float: bottom-right (default) atau bottom-left */
  position?: 'bottom-right' | 'bottom-left'
  className?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MascotHelpFloat({
  tips,
  panelTitle = 'Tips Pengisian',
  position = 'bottom-right',
  className,
}: MascotHelpFloatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTip, setActiveTip] = useState(0)

  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  const positionClass =
    position === 'bottom-right'
      ? 'bottom-4 right-4'
      : 'bottom-4 left-4'

  const panelAlignClass =
    position === 'bottom-right'
      ? 'right-0 origin-bottom-right'
      : 'left-0 origin-bottom-left'

  return (
    <div
      className={cn('fixed z-40 flex flex-col items-end gap-2', positionClass, className)}
      role="complementary"
      aria-label="Panel bantuan pengisian form"
    >
      {/* Panel tips — expand ke atas */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="help-panel"
            initial={{ opacity: 0, scale: 0.88, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 12 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
            className={cn(
              'absolute bottom-16 w-72 rounded-xl',
              'border border-border/60',
              'bg-card/90 backdrop-blur-md shadow-xl shadow-black/10',
              'overflow-hidden',
              panelAlignClass
            )}
          >
            {/* Header panel */}
            <div className="flex items-center justify-between gap-2 border-b border-border/50 px-4 py-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" aria-hidden="true" />
                <span className="text-sm font-semibold text-foreground">{panelTitle}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={toggle}
                aria-label="Tutup panel bantuan"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Tab tips */}
            {tips.length > 1 && (
              <div className="flex gap-1 border-b border-border/50 px-4 py-2 overflow-x-auto">
                {tips.map((tip, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTip(i)}
                    className={cn(
                      'flex-shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                      i === activeTip
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                    aria-pressed={i === activeTip}
                  >
                    {tip.title}
                  </button>
                ))}
              </div>
            )}

            {/* Konten tip aktif */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTip}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="p-4"
              >
                {tips.length === 1 && (
                  <p className="mb-2 text-xs font-semibold text-foreground">
                    {tips[0].title}
                  </p>
                )}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {tips[activeTip]?.body}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Maskot dekoratif di bagian bawah panel */}
            <div className="flex justify-end px-4 pb-3" aria-hidden="true">
              <MascotDecorator
                assetId="mascot-idea-clipboard"
                size="sm"
                state="info"
                noGlow
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tombol trigger — maskot yang bisa diklik */}
      <motion.button
        onClick={toggle}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        animate={isOpen ? {} : { y: [0, -4, 0] }}
        transition={isOpen ? {} : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className={cn(
          'relative flex h-14 w-14 items-center justify-center rounded-full',
          'bg-card border border-border/60 shadow-lg shadow-black/15',
          'hover:shadow-xl hover:border-primary/40 transition-shadow duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
        )}
        aria-label={isOpen ? 'Tutup panel bantuan' : 'Buka panel bantuan pengisian form'}
        aria-expanded={isOpen}
      >
        <MascotDecorator
          assetId="mascot-idea-clipboard"
          size="sm"
          state="idle"
          noGlow
          className="w-10 h-10"
        />

        {/* Indikator "ada tips" — dot notifikasi */}
        {!isOpen && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-yellow-400 border-2 border-background shadow-sm"
            aria-hidden="true"
          />
        )}
      </motion.button>
    </div>
  )
}

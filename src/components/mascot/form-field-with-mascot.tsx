'use client'

/**
 * FormFieldWithMascot — Komponen #1: Feedback inline pada form input
 *
 * UX Note:
 * Saat pengguna melakukan kesalahan input (error state), muncul maskot
 * "mascot-phone-thinking" yang bingung di sisi kanan field — ini menggeser
 * framing dari "kamu salah" menjadi "ayo kita pikirkan bersama". Efek ini
 * secara psikologis menurunkan kecemasan pengguna (anxiety reduction).
 * Saat sukses, maskot "mascot-idle-neutral" muncul dengan glow hijau sebagai
 * positive reinforcement yang mendorong pengguna untuk lanjut mengisi form.
 *
 * Maskot yang digunakan:
 *   error   → mascot-phone-thinking  (bingung, empati)
 *   success → mascot-idle-neutral    (puas, validasi)
 *   warning → mascot-angry-watch     (perhatian tanpa menghakimi)
 */

import * as React from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { cn } from '@/lib/utils'
import { MascotDecorator } from '@/components/mascot/mascot-decorator'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FieldValidationState = 'idle' | 'success' | 'error' | 'warning'

interface FormFieldWithMascotProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Label field */
  label: string
  /** Nama field untuk htmlFor / id */
  fieldId: string
  /** Status validasi saat ini */
  validationState?: FieldValidationState
  /** Pesan error / success yang ditampilkan di bawah field */
  message?: string
  /** Wajib diisi */
  required?: boolean
  className?: string
}

// ---------------------------------------------------------------------------
// Config per state
// ---------------------------------------------------------------------------

const STATE_CONFIG = {
  idle: {
    mascotId: null,
    messageColor: 'text-muted-foreground',
    ringClass: '',
  },
  success: {
    mascotId: 'mascot-idle-neutral' as const,
    messageColor: 'text-green-600 dark:text-green-400',
    ringClass: 'ring-1 ring-green-400/60 border-green-400/60',
  },
  error: {
    mascotId: 'mascot-phone-thinking' as const,
    messageColor: 'text-destructive',
    ringClass: 'ring-1 ring-destructive/60 border-destructive/60',
  },
  warning: {
    mascotId: 'mascot-angry-watch' as const,
    messageColor: 'text-yellow-600 dark:text-yellow-400',
    ringClass: 'ring-1 ring-yellow-400/60 border-yellow-400/60',
  },
} as const

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FormFieldWithMascot({
  label,
  fieldId,
  validationState = 'idle',
  message,
  required,
  className,
  ...inputProps
}: FormFieldWithMascotProps) {
  const config = STATE_CONFIG[validationState]
  const showMascot = config.mascotId !== null && validationState !== 'idle'

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {/* Label */}
      <Label
        htmlFor={fieldId}
        className={cn(
          'text-sm font-medium transition-colors',
          validationState === 'error' && 'text-destructive',
          validationState === 'success' && 'text-green-600 dark:text-green-400'
        )}
      >
        {label}
        {required && (
          <span className="ml-1 text-destructive" aria-hidden="true">*</span>
        )}
      </Label>

      {/* Input row — field + mascot side-by-side */}
      <div className="relative flex items-center gap-2">
        <Input
          id={fieldId}
          name={fieldId}
          aria-describedby={message ? `${fieldId}-message` : undefined}
          aria-invalid={validationState === 'error'}
          className={cn(
            'transition-all duration-200',
            config.ringClass
          )}
          {...inputProps}
        />

        {/* Mascot pojok kanan — muncul/hilang dengan animasi spring */}
        <AnimatePresence mode="wait">
          {showMascot && (
            <motion.div
              key={validationState}
              initial={{ opacity: 0, scale: 0.4, x: 8 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.4, x: 8 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="flex-shrink-0"
              aria-hidden="true"
            >
              <MascotDecorator
                assetId={config.mascotId!}
                size="sm"
                state={validationState}
                animate={validationState === 'error' ? 'shake' : 'none'}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pesan validasi dengan animasi slide-down */}
      <AnimatePresence mode="wait">
        {message && (
          <motion.p
            key={`${fieldId}-${validationState}`}
            id={`${fieldId}-message`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className={cn('text-xs font-medium', config.messageColor)}
            role={validationState === 'error' ? 'alert' : undefined}
          >
            {message}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

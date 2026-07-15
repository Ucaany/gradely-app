'use client'

/**
 * MascotDecorator — Reusable wrapper untuk semua aset maskot SVG.
 *
 * Props:
 *   assetId  — nama file tanpa ekstensi, misal "mascot-phone-thinking"
 *   size     — "sm" | "md" | "lg" (default: "md")
 *   state    — "idle" | "success" | "error" | "warning" | "info" (default: "idle")
 *   animate  — "float" | "bounce" | "shake" | "none" (default: "none")
 *   className — tambahan class Tailwind untuk override
 *   alt      — alt text untuk aksesibilitas
 */

import Image from 'next/image'
import { cn } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type MascotAssetId =
  | 'mascot-angry-stand'
  | 'mascot-angry-watch'
  | 'mascot-crawling'
  | 'mascot-cycling'
  | 'mascot-idea-clipboard'
  | 'mascot-idle-neutral'
  | 'mascot-phone-thinking'
  | 'mascot-running-document'
  | 'mascot-sitting-reading'

export type MascotSize = 'sm' | 'md' | 'lg'
export type MascotState = 'idle' | 'success' | 'error' | 'warning' | 'info'
export type MascotAnimation = 'float' | 'bounce' | 'shake' | 'spin-slow' | 'none'

interface MascotDecoratorProps {
  assetId: MascotAssetId
  size?: MascotSize
  state?: MascotState
  animate?: MascotAnimation
  className?: string
  alt?: string
  /** Nonaktifkan glow ring (berguna saat diembed di kontainer yang sudah berwarna) */
  noGlow?: boolean
  priority?: boolean
}

// ---------------------------------------------------------------------------
// Static maps — tidak dicomputasi ulang setiap render
// ---------------------------------------------------------------------------

/** Dimensi pixel untuk next/image (persegi agar SVG tidak distorsi) */
const SIZE_MAP: Record<MascotSize, { px: number; className: string }> = {
  sm: { px: 64,  className: 'w-16 h-16' },
  md: { px: 96,  className: 'w-24 h-24' },
  lg: { px: 128, className: 'w-32 h-32' },
}

/**
 * Drop-shadow filter + subtle glow ring per state.
 * Menggunakan warna CSS variable agar konsisten dengan theme shadcn/ui.
 */
const STATE_GLOW: Record<MascotState, string> = {
  idle:    '',
  success: 'drop-shadow-[0_0_8px_rgba(34,197,94,0.55)]  ring-1 ring-green-400/30  rounded-full',
  error:   'drop-shadow-[0_0_8px_rgba(239,68,68,0.55)]   ring-1 ring-red-400/30    rounded-full',
  warning: 'drop-shadow-[0_0_8px_rgba(234,179,8,0.55)]   ring-1 ring-yellow-400/30 rounded-full',
  info:    'drop-shadow-[0_0_8px_rgba(99,102,241,0.55)]  ring-1 ring-indigo-400/30 rounded-full',
}

/** Animasi CSS — didefinisikan di globals.css via @keyframes */
const ANIMATION_CLASS: Record<MascotAnimation, string> = {
  float:      'animate-mascot-float',
  bounce:     'animate-mascot-bounce',
  shake:      'animate-mascot-shake',
  'spin-slow': 'animate-spin-slow',
  none:       '',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function MascotDecorator({
  assetId,
  size = 'md',
  state = 'idle',
  animate = 'none',
  className,
  alt,
  noGlow = false,
  priority = false,
}: MascotDecoratorProps) {
  const { px, className: sizeClass } = SIZE_MAP[size]
  const glowClass = noGlow ? '' : STATE_GLOW[state]
  const animClass = ANIMATION_CLASS[animate]

  const resolvedAlt = alt ?? `${assetId} illustration`

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center select-none',
        sizeClass,
        glowClass,
        animClass,
        className
      )}
      role="img"
      aria-label={resolvedAlt}
    >
      <Image
        src={`/assets/illustrations/${assetId}.svg`}
        alt={resolvedAlt}
        width={px}
        height={px}
        priority={priority}
        className="w-full h-full object-contain"
        draggable={false}
      />
    </span>
  )
}

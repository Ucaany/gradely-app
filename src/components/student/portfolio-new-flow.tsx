'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { LucideIcon } from 'lucide-react'
import {
  Award, Briefcase, Heart, Users, Trophy, Zap,
  Wrench, BookOpen, Code2, Palette, MapPin, ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PortfolioForm } from '@/components/student/portfolio-form'
import type { PortfolioCategory } from '@/types'

const CATEGORY_META: Record<string, { icon: LucideIcon; description: string; color: string }> = {
  certificate: { icon: Award, description: 'Sertifikat keahlian, kursus online, atau pelatihan bersertifikat', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40' },
  internship: { icon: Briefcase, description: 'Pengalaman magang di perusahaan atau lembaga', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
  volunteer: { icon: Heart, description: 'Kegiatan sukarela dan pengabdian masyarakat', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' },
  organization: { icon: Users, description: 'Kepengurusan di organisasi kampus atau luar kampus', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
  achievement: { icon: Trophy, description: 'Penghargaan, beasiswa, atau pengakuan formal', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
  competition: { icon: Zap, description: 'Lomba, hackathon, atau kompetisi lainnya', color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40' },
  workshop: { icon: Wrench, description: 'Workshop atau seminar yang pernah diikuti', color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/40' },
  training: { icon: BookOpen, description: 'Pelatihan teknis atau pengembangan diri', color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
  project: { icon: Code2, description: 'Proyek individu atau tim yang dikerjakan', color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40' },
  work: { icon: Palette, description: 'Karya kreatif, tulisan, atau hasil karya lainnya', color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/40' },
  experience: { icon: MapPin, description: 'Pengalaman kerja, freelance, atau kolaborasi', color: 'text-green-600 bg-green-50 dark:bg-green-950/40' },
}

const CATEGORY_LABEL: Record<string, string> = {
  certificate: 'Sertifikat',
  internship: 'Magang',
  volunteer: 'Volunteer',
  organization: 'Organisasi',
  achievement: 'Prestasi',
  competition: 'Kompetisi',
  workshop: 'Workshop',
  training: 'Pelatihan',
  project: 'Proyek',
  work: 'Karya',
  experience: 'Pengalaman',
}

interface PortfolioNewFlowProps {
  categories: PortfolioCategory[]
}

export function PortfolioNewFlow({ categories }: PortfolioNewFlowProps) {
  const router = useRouter()
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  if (selectedCategoryId) {
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          onClick={() => setSelectedCategoryId(null)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="h-4 w-4" />
          Ganti Kategori
        </button>
        <PortfolioForm
          categories={categories}
          initialCategoryId={selectedCategoryId}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tambah Portofolio</h1>
        <p className="text-sm text-muted-foreground mt-1">Pilih kategori portofolio yang ingin kamu tambahkan</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((cat) => {
          const meta = CATEGORY_META[cat.code]
          const Icon = meta?.icon ?? Award
          const label = CATEGORY_LABEL[cat.code] ?? cat.name
          const description = meta?.description ?? ''
          const color = meta?.color ?? 'text-muted-foreground bg-muted'

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryId(cat.id)}
              className="group flex flex-col gap-3 rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-sm leading-snug">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex justify-start">
        <Button variant="ghost" onClick={() => router.back()}>
          Batal
        </Button>
      </div>
    </div>
  )
}

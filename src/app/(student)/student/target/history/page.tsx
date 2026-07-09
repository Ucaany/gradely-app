'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Sparkles, ShieldCheck, AlertCircle, Flame,
  Target, TrendingUp, GraduationCap, Calendar,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

interface AnalysisRecord {
  id: string
  target_semester: number
  target_ipk: number | null
  target_years: number | null
  analysis: {
    status: 'aman' | 'perlu_usaha' | 'berisiko'
    status_label: string
    ringkasan: string
    sks_per_semester_dibutuhkan: number | null
    ipk_minimal_per_semester: number | null
    ips_target_semester_depan: number | null
    rekomendasi: string[]
  }
  created_at: string
}

const AI_STATUS = {
  aman: {
    sublabel: 'Aman',
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: ShieldCheck,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    progressColor: 'bg-emerald-500',
    pct: 85,
  },
  perlu_usaha: {
    sublabel: 'Perlu Usaha',
    color: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-200 dark:border-amber-800',
    icon: Flame,
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
    progressColor: 'bg-amber-500',
    pct: 50,
  },
  berisiko: {
    sublabel: 'Perlu Perhatian',
    color: 'text-orange-700 dark:text-orange-400',
    bg: 'bg-orange-50 dark:bg-orange-950/40',
    border: 'border-orange-200 dark:border-orange-800',
    icon: AlertCircle,
    iconBg: 'bg-orange-100 dark:bg-orange-900/40',
    iconColor: 'text-orange-600 dark:text-orange-400',
    progressColor: 'bg-orange-500',
    pct: 25,
  },
}

export default function TargetHistoryPage() {
  const [records, setRecords] = useState<AnalysisRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch('/api/student/target/history')
        const result = await res.json()
        if (result.success) setRecords(result.data)
      } finally {
        setIsLoading(false)
      }
    }
    fetchHistory()
  }, [])

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Riwayat & Hasil</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLoading ? 'Memuat...' : `${records.length} analisis tersimpan`}
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/student/target">
            <Sparkles className="h-4 w-4 mr-1.5" />Analisis Baru
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Sparkles className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <div>
            <p className="text-sm font-semibold">Belum ada riwayat analisis</p>
            <p className="text-xs text-muted-foreground mt-1">Lakukan analisis pertamamu di halaman Target Kelulusan</p>
          </div>
          <Button size="sm" asChild>
            <Link href="/student/target">Mulai Analisis</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {records.map((rec, idx) => {
            const cfg = AI_STATUS[rec.analysis.status] ?? AI_STATUS.perlu_usaha
            const Icon = cfg.icon

            return (
              <Link key={rec.id} href={`/student/target/history/${rec.id}`}>
                <Card className={`overflow-hidden h-full hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer border ${cfg.border}`}>
                  <CardContent className="p-0">
                    {/* Top strip */}
                    <div className={`px-5 pt-5 pb-4 ${cfg.bg}`}>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.iconBg} ${cfg.iconColor}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {idx === 0 && (
                            <Badge className="text-xs bg-primary/10 text-primary border-0">Terbaru</Badge>
                          )}
                          <Badge variant="outline" className="text-xs bg-white/60 dark:bg-black/20">{rec.analysis.status_label}</Badge>
                        </div>
                      </div>
                      <p className={`text-sm font-bold ${cfg.color}`}>{cfg.sublabel}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{rec.analysis.ringkasan}</p>

                      {/* Progress bar */}
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Peluang capai target</span>
                          <span className={`font-semibold ${cfg.color}`}>{cfg.pct}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                          <div className={`h-full rounded-full ${cfg.progressColor}`} style={{ width: `${cfg.pct}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Bottom info */}
                    <div className="px-5 py-3 space-y-3 bg-card">
                      {/* Target info */}
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />Sem {rec.target_semester}
                        </span>
                        {rec.target_ipk && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />IPK {rec.target_ipk.toFixed(2)}
                          </span>
                        )}
                        {rec.target_years && (
                          <span className="flex items-center gap-1">
                            <GraduationCap className="h-3 w-3" />{rec.target_years} thn
                          </span>
                        )}
                        <span className="flex items-center gap-1 ml-auto">
                          <Calendar className="h-3 w-3" />{formatDate(rec.created_at)}
                        </span>
                      </div>

                      {/* 3 metrik */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'SKS/Sem', value: rec.analysis.sks_per_semester_dibutuhkan ?? '-' },
                          { label: 'IPK Min', value: rec.analysis.ipk_minimal_per_semester != null ? Number(rec.analysis.ipk_minimal_per_semester).toFixed(2) : '-' },
                          { label: 'Target IPS', value: rec.analysis.ips_target_semester_depan != null ? Number(rec.analysis.ips_target_semester_depan).toFixed(2) : '-' },
                        ].map(({ label, value }) => (
                          <div key={label} className="rounded-lg bg-muted/50 px-2 py-2 text-center">
                            <p className="text-xs text-muted-foreground leading-none mb-1">{label}</p>
                            <p className="text-sm font-bold leading-none">{value}</p>
                          </div>
                        ))}
                      </div>

                      <p className="text-xs text-primary font-medium">Lihat detail lengkap →</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

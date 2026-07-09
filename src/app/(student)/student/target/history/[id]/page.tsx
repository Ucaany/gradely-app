'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles, AlertTriangle, ShieldCheck, AlertCircle, Flame,
  Target, TrendingUp, BookOpen, GraduationCap, Calendar,
  ArrowLeft, Lightbulb, Map,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatDate } from '@/lib/utils'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Cell, LabelList,
} from 'recharts'

interface RencanaSemester {
  semester: number
  target_ips: number
  target_sks: number
  catatan: string
}

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
    analisis_tren: string
    strategi_kelulusan: string
    rencana_per_semester?: RencanaSemester[]
    peringatan: string | null
    motivasi: string
  }
  created_at: string
}

const AI_STATUS = {
  aman: { label: 'Kamu di jalur yang benar!', sublabel: 'Aman', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800', icon: ShieldCheck, iconColor: 'text-emerald-600', progressColor: 'bg-emerald-500', pct: 85 },
  perlu_usaha: { label: 'Butuh usaha lebih untuk mencapai target', sublabel: 'Perlu Usaha', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800', icon: Flame, iconColor: 'text-amber-600', progressColor: 'bg-amber-500', pct: 50 },
  berisiko: { label: 'Butuh perhatian lebih untuk mencapai target', sublabel: 'Perlu Perhatian', color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-800', icon: AlertCircle, iconColor: 'text-orange-600', progressColor: 'bg-orange-500', pct: 25 },
}

function IpsBarChart({ data }: { data: RencanaSemester[] }) {
  const chartData = data.map(r => ({ name: `Sem ${r.semester}`, ips: r.target_ips, sks: r.target_sks }))
  const getColor = (ips: number) => ips >= 3.5 ? '#10b981' : ips >= 3.0 ? '#3b82f6' : ips >= 2.5 ? '#f59e0b' : '#ef4444'

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 20, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
        <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 10, fontSize: 12 }} formatter={(v: unknown) => [`IPS ${Number(v).toFixed(2)}`, 'Target']} />
        <Bar dataKey="ips" radius={[6, 6, 0, 0]} barSize={36}>
          <LabelList dataKey="ips" position="top" style={{ fontSize: 11, fontWeight: 600 }} formatter={((v: unknown) => Number(v).toFixed(2)) as (value: unknown) => string} />
          {chartData.map((entry, i) => <Cell key={i} fill={getColor(entry.ips)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export default function AnalysisDetailPage() {
  const params = useParams()
  const [rec, setRec] = useState<AnalysisRecord | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await fetch(`/api/student/target/history/${params.id}`)
        const result = await res.json()
        if (!res.ok || !result.success) { setNotFound(true); return }
        setRec(result.data)
      } finally {
        setIsLoading(false)
      }
    }
    if (params.id) fetchDetail()
  }, [params.id])

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )

  if (notFound || !rec) return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20 text-center">
      <p className="text-sm font-semibold">Analisis tidak ditemukan</p>
      <Button size="sm" asChild><Link href="/student/target/history">Kembali ke Riwayat</Link></Button>
    </div>
  )

  const cfg = AI_STATUS[rec.analysis.status] ?? AI_STATUS.perlu_usaha
  const Icon = cfg.icon

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8 max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" asChild>
          <Link href="/student/target/history"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">Detail Analisis</h1>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Target className="h-3 w-3" />Sem {rec.target_semester}</span>
            {rec.target_ipk && <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />IPK {rec.target_ipk.toFixed(2)}</span>}
            {rec.target_years && <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" />{rec.target_years} tahun</span>}
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatDate(rec.created_at)}</span>
          </div>
        </div>
        <Button size="sm" variant="outline" asChild className="shrink-0">
          <Link href="/student/target"><Sparkles className="h-3.5 w-3.5 mr-1.5" />Analisis Baru</Link>
        </Button>
      </div>

      {/* Status */}
      <div className={`rounded-2xl border p-5 ${cfg.bg}`}>
        <div className="flex items-start gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/70 dark:bg-black/20 ${cfg.iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`font-bold text-base ${cfg.color}`}>{cfg.label}</span>
              <Badge variant="outline" className="text-xs">{rec.analysis.status_label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{rec.analysis.ringkasan}</p>
          </div>
        </div>
        <div className="mt-4 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Peluang capai target</span>
            <span className={`font-semibold ${cfg.color}`}>{cfg.pct}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/50 dark:bg-black/20 overflow-hidden">
            <div className={`h-full rounded-full ${cfg.progressColor}`} style={{ width: `${cfg.pct}%` }} />
          </div>
        </div>
      </div>

      {/* 3 metrik */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'SKS per Semester', sub: 'yang harus diambil', value: rec.analysis.sks_per_semester_dibutuhkan ?? '-', unit: rec.analysis.sks_per_semester_dibutuhkan ? 'SKS' : '', icon: BookOpen, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
          { label: 'IPK Minimal', sub: 'yang harus dijaga', value: rec.analysis.ipk_minimal_per_semester != null ? rec.analysis.ipk_minimal_per_semester.toFixed(2) : '-', unit: '', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
          { label: 'Target IPS', sub: 'semester depan', value: rec.analysis.ips_target_semester_depan != null ? rec.analysis.ips_target_semester_depan.toFixed(2) : '-', unit: '', icon: GraduationCap, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40' },
        ].map(({ label, sub, value, unit, icon: Ic, color }) => (
          <Card key={label}>
            <CardContent className="p-4 text-center">
              <div className={`inline-flex h-8 w-8 items-center justify-center rounded-xl mb-2 ${color}`}><Ic className="h-4 w-4" /></div>
              <p className="text-2xl font-bold leading-none">{value}<span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span></p>
              <p className="text-xs text-muted-foreground mt-1">{label}</p>
              <p className="text-xs font-medium" style={{ color: 'hsl(var(--primary))' }}>{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tren & Strategi */}
      <div className="grid gap-4 lg:grid-cols-2">
        {rec.analysis.analisis_tren && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Tren Akademikmu</CardTitle></CardHeader>
            <CardContent className="pt-0"><p className="text-sm text-muted-foreground leading-relaxed">{rec.analysis.analisis_tren}</p></CardContent>
          </Card>
        )}
        {rec.analysis.strategi_kelulusan && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Map className="h-4 w-4 text-primary" />Strategi Lulus Tepat Waktu</CardTitle></CardHeader>
            <CardContent className="pt-0"><p className="text-sm text-muted-foreground leading-relaxed">{rec.analysis.strategi_kelulusan}</p></CardContent>
          </Card>
        )}
      </div>

      {/* Chart rencana */}
      {rec.analysis.rencana_per_semester && rec.analysis.rencana_per_semester.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4 text-primary" />Rencana IPS Per Semester</CardTitle>
            <p className="text-xs text-muted-foreground">
              <span className="text-emerald-600 font-medium">Hijau</span> ≥3.5 · <span className="text-blue-600 font-medium">Biru</span> ≥3.0 · <span className="text-amber-600 font-medium">Kuning</span> ≥2.5 · <span className="text-red-600 font-medium">Merah</span> &lt;2.5
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            <IpsBarChart data={rec.analysis.rencana_per_semester} />
            <Separator className="my-4" />
            <div className="space-y-2">
              {rec.analysis.rencana_per_semester.map(r => (
                <div key={r.semester} className="flex items-center gap-3 text-sm">
                  <span className="font-semibold w-16 shrink-0 text-muted-foreground">Sem {r.semester}</span>
                  <Badge variant="secondary" className="text-xs">IPS {r.target_ips.toFixed(2)}</Badge>
                  <Badge variant="outline" className="text-xs">{r.target_sks} SKS</Badge>
                  {r.catatan && <span className="text-xs text-muted-foreground">{r.catatan}</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rekomendasi */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" />Saran untuk Kamu</CardTitle>
          <p className="text-xs text-muted-foreground">Langkah konkret yang bisa langsung kamu lakukan</p>
        </CardHeader>
        <CardContent className="pt-0 space-y-2.5">
          {rec.analysis.rekomendasi.map((r, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl bg-muted/40 px-4 py-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold mt-0.5">{i + 1}</span>
              <p className="text-sm leading-relaxed">{r}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Peringatan */}
      {rec.analysis.peringatan && (
        <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800/60">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-orange-700 dark:text-orange-400 mb-1">Perhatian!</p>
              <p className="text-sm text-orange-700 dark:text-orange-300 leading-relaxed">{rec.analysis.peringatan}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Motivasi */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
          <div>
            <p className="text-xs font-semibold text-primary mb-1">Pesan dari Asisten Gradely</p>
            <p className="text-sm italic text-muted-foreground leading-relaxed">&ldquo;{rec.analysis.motivasi}&rdquo;</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

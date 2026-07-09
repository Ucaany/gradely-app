'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Loader2, Sparkles, ChevronRight, ChevronLeft, Save, RotateCcw,
  CheckCircle2, AlertTriangle, TrendingUp, ShieldCheck, AlertCircle,
  Flame, Target, GraduationCap, Briefcase, Code2, Building2, Edit3, Info,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import type { AcademicSummary, StudentTarget, AcademicRule } from '@/types'

interface SummaryData {
  summary: AcademicSummary
  target: StudentTarget | null
  rule: AcademicRule
}
interface RencanaSemester { semester: number; target_ips: number; target_sks: number; catatan: string }
interface AIAnalysis {
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
  remaining_quota?: number
}

const AI_STATUS = {
  aman: { label: 'Aman', color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800', icon: ShieldCheck, iconColor: 'text-emerald-600', badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  perlu_usaha: { label: 'Perlu Usaha', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-800', icon: Flame, iconColor: 'text-amber-600', badgeClass: 'bg-amber-100 text-amber-700 border-amber-200' },
  berisiko: { label: 'Berisiko', color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-800', icon: AlertCircle, iconColor: 'text-red-600', badgeClass: 'bg-red-100 text-red-700 border-red-200' },
}
const SKILL_OPTIONS = ['Desain Grafis','UI/UX Design','Ilustrasi','Fotografi','Videografi','Animasi','Musik','Seni Pertunjukan','Kriya & Kerajinan','Arsitektur','Fashion Design','Branding','Social Media','Copywriting','Web Development','Mobile Development']
const SKILL_DESC: Record<string,string> = { 'Desain Grafis':'Membuat visual untuk media cetak, digital, dan branding menggunakan Illustrator & Photoshop.','UI/UX Design':'Merancang antarmuka dan pengalaman pengguna aplikasi/website yang intuitif.','Ilustrasi':'Membuat karya seni ilustrasi digital maupun tradisional.','Fotografi':'Mengabadikan momen dengan teknik pencahayaan dan komposisi yang tepat.','Videografi':'Merekam, mengedit, dan memproduksi konten video.','Animasi':'Membuat animasi 2D/3D untuk film, iklan, atau konten digital.','Musik':'Menciptakan dan memproduksi karya musik original.','Seni Pertunjukan':'Mengembangkan kemampuan teater, tari, atau seni pertunjukan.','Kriya & Kerajinan':'Membuat produk kerajinan tangan bernilai estetika tinggi.','Arsitektur':'Merancang bangunan yang estetis, fungsional, dan berkelanjutan.','Fashion Design':'Merancang pakaian dengan memahami tren dan kebutuhan pasar.','Branding':'Membangun identitas merek melalui strategi visual dan komunikasi.','Social Media':'Mengelola konten dan strategi pemasaran di media sosial.','Copywriting':'Menulis teks iklan dan konten marketing yang persuasif.','Web Development':'Membangun website menggunakan HTML, CSS, JavaScript, dan framework modern.','Mobile Development':'Mengembangkan aplikasi mobile untuk iOS dan Android.' }
const INDUSTRY_OPTIONS = ['Kreatif & Desain','Periklanan','Media','Teknologi','Startup','Penerbitan','Entertainment','Konstruksi','Properti','Fashion','Ritel']
const INDUSTRY_DESC: Record<string,string> = { 'Kreatif & Desain':'Studio desain dan agensi kreatif yang bergerak di bidang desain visual.','Periklanan':'Agensi iklan yang membuat kampanye kreatif untuk berbagai klien.','Media':'Perusahaan media, berita, broadcasting, dan platform konten digital.','Teknologi':'Perusahaan teknologi yang mengembangkan software, hardware, atau layanan digital.','Startup':'Perusahaan rintisan inovatif dengan budaya kerja yang dinamis.','Penerbitan':'Penerbit buku, majalah, dan konten cetak maupun digital.','Entertainment':'Industri hiburan termasuk film, musik, game, dan streaming.','Konstruksi':'Perusahaan konstruksi yang membutuhkan keahlian arsitektur dan desain.','Properti':'Pengembang properti dan perusahaan manajemen gedung.','Fashion':'Brand fashion dan industri tekstil yang membutuhkan kreativitas.','Ritel':'Perusahaan ritel yang membutuhkan desain display dan branding.' }
const IPK_DESC: Record<string,string> = { '2.75':'Syarat minimum banyak perusahaan. Target realistis untuk menjaga peluang kerja.','3.00':'IPK baik dan cukup kompetitif. Memenuhi syarat sebagian besar lowongan dan beasiswa.','3.25':'IPK di atas rata-rata yang membuka lebih banyak peluang karier dan beasiswa.','3.50':'IPK sangat baik. Diinginkan banyak perusahaan top dan program graduate.','3.75':'Mendekati cumlaude. Membuka peluang beasiswa S2 bergengsi.','4.00':'IPK sempurna — Summa Cumlaude. Prestasi tertinggi.' }
const SEM_DESC: Record<number,string> = { 7:'Lulus lebih cepat dari normal. Butuh rata-rata SKS lebih banyak tiap semester.', 8:'Waktu studi normal sesuai kurikulum. Target ideal mayoritas mahasiswa.', 9:'Satu semester lebih lambat. Masih dalam batas wajar.', 10:'Dua semester di atas normal. Perlu perhatian pada progres.', 11:'Tiga semester di atas normal. Konsultasikan dengan dosen wali.', 12:'Empat semester di atas normal. Prioritaskan percepatan studi.', 13:'Mendekati batas maksimal. Wajib segera menyelesaikan kewajiban akademik.', 14:'Semester terakhir yang diizinkan.' }
const STEPS = [
  { id: 1, label: 'Semester', icon: GraduationCap, desc: 'Target semester & tahun lulus' },
  { id: 2, label: 'IPK', icon: TrendingUp, desc: 'Target IPK kelulusan' },
  { id: 3, label: 'Skill', icon: Code2, desc: 'Skill yang ingin dikuasai' },
  { id: 4, label: 'Industri', icon: Building2, desc: 'Industri yang diminati' },
  { id: 5, label: 'Pengalaman', icon: Briefcase, desc: 'Target pengalaman & karier' },
]
const AI_STEPS = ['Membaca riwayat akademik...','Menganalisis tren per semester...','Menghitung proyeksi kelulusan...','Menyusun rekomendasi personal...','Memfinalisasi hasil analisis...']

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const done = currentStep > s.id
          const active = currentStep === s.id
          return (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all text-xs font-bold ${done ? 'bg-primary border-primary text-primary-foreground' : active ? 'border-primary text-primary' : 'border-muted text-muted-foreground'}`}>
                  {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <span className={`text-xs font-medium hidden sm:block truncate max-w-[60px] text-center ${active ? 'text-primary' : done ? 'text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-1 mb-5 ${done ? 'bg-primary' : 'bg-muted'}`} />}
            </div>
          )
        })}
      </div>
      <Progress value={(currentStep / STEPS.length) * 100} className="h-1" />
    </div>
  )
}

function AIProgress({ aiStep }: { aiStep: number }) {
  return (
    <div className="flex flex-col items-center gap-5 py-10">
      <div className="relative">
        <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-primary animate-pulse" />
        </div>
        <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-spin" style={{ animationDuration: '3s' }} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold">Asisten Gradely sedang menganalisis</p>
        <p className="text-xs text-muted-foreground mt-1">{AI_STEPS[Math.min(aiStep, AI_STEPS.length - 1)]}</p>
      </div>
      <div className="w-full space-y-1.5">
        {AI_STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 text-xs transition-all ${i < aiStep ? 'bg-primary text-primary-foreground' : i === aiStep ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {i < aiStep ? <CheckCircle2 className="h-3 w-3" /> : <span>{i + 1}</span>}
            </div>
            <span className={`text-xs transition-colors ${i <= aiStep ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
            {i === aiStep && <Loader2 className="h-3 w-3 animate-spin text-primary ml-auto" />}
          </div>
        ))}
      </div>
    </div>
  )
}

function RightPanel({ analysis, isSaving, saved, onSave, onEdit, onRegenerate, existingTarget, summaryData }: {
  analysis: AIAnalysis | null
  isSaving: boolean
  saved: boolean
  onSave: () => void
  onEdit: () => void
  onRegenerate: () => void
  existingTarget: StudentTarget | null
  summaryData: SummaryData | null
}) {
  if (!analysis && !existingTarget) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center gap-4 px-8 py-12">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/60">
          <Target className="h-7 w-7 text-muted-foreground/40" />
        </div>
        <div>
          <p className="text-sm font-semibold">Hasil analisis muncul di sini</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">Isi target di kiri dan klik<br />Analisis dengan AI untuk memulai</p>
        </div>
      </div>
    )
  }

  if (!analysis && existingTarget) {
    const summary = summaryData?.summary
    const rule = summaryData?.rule
    return (
      <div className="px-8 py-8 space-y-5">
        <div>
          <p className="text-sm font-semibold">Target Tersimpan</p>
          <p className="text-xs text-muted-foreground mt-0.5">Klik Analisis untuk mendapatkan rekomendasi terbaru</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Semester Lulus', value: `Semester ${existingTarget.target_semester}` },
            { label: 'Target IPK', value: existingTarget.target_ipk ? existingTarget.target_ipk.toFixed(2) : '-' },
            { label: 'Durasi', value: existingTarget.target_years ? `${existingTarget.target_years} tahun` : '-' },
            { label: 'IPK Saat Ini', value: summary ? summary.gpa.toFixed(2) : '-' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl bg-background px-4 py-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="font-semibold text-sm mt-0.5">{value}</p>
            </div>
          ))}
        </div>
        {summary && rule && (
          <div className="rounded-2xl bg-background px-4 py-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Progress SKS</span>
              <span className="font-medium">{summary.sks_percentage}%</span>
            </div>
            <Progress value={summary.sks_percentage} className="h-1.5" />
            <p className="text-xs text-muted-foreground">{summary.total_sks_earned} / {rule.total_sks_graduation} SKS</p>
          </div>
        )}
      </div>
    )
  }

  if (!analysis) return null
  const cfg = AI_STATUS[analysis.status] ?? AI_STATUS.perlu_usaha
  const Icon = cfg.icon

  return (
    <div className="px-8 py-8 space-y-5">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="text-sm font-semibold">Hasil Analisis AI</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onEdit}><Edit3 className="h-3 w-3 mr-1" />Ubah</Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onRegenerate}><RotateCcw className="h-3 w-3 mr-1" />Ulang</Button>
          {saved ? (
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Tersimpan</span>
          ) : (
            <Button size="sm" className="h-7 text-xs" onClick={onSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}Simpan
            </Button>
          )}
        </div>
      </div>

      <div className={`rounded-2xl p-4 flex items-start gap-3 ${cfg.bg}`}>
        <Icon className={`h-5 w-5 shrink-0 mt-0.5 ${cfg.iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`font-bold text-sm ${cfg.color}`}>{cfg.label}</span>
            <Badge variant="outline" className={`text-xs ${cfg.badgeClass}`}>{analysis.status_label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{analysis.ringkasan}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'SKS/Semester', value: analysis.sks_per_semester_dibutuhkan ?? '-', unit: analysis.sks_per_semester_dibutuhkan ? 'SKS' : '' },
          { label: 'IPK Minimal', value: analysis.ipk_minimal_per_semester != null ? analysis.ipk_minimal_per_semester.toFixed(2) : '-', unit: '' },
          { label: 'Target IPS', value: analysis.ips_target_semester_depan != null ? analysis.ips_target_semester_depan.toFixed(2) : '-', unit: '' },
        ].map(({ label, value, unit }) => (
          <div key={label} className="rounded-2xl bg-background px-3 py-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-xl font-bold">{value}<span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span></p>
          </div>
        ))}
      </div>

      {analysis.analisis_tren && (
        <div className="rounded-2xl bg-background px-4 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tren Akademik</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{analysis.analisis_tren}</p>
        </div>
      )}

      <div className="rounded-2xl bg-background px-4 py-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Rekomendasi</p>
        <ul className="space-y-2.5">
          {analysis.rekomendasi.map((r, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">{i + 1}</span>
              <span className="leading-relaxed">{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {analysis.strategi_kelulusan && (
        <div className="rounded-2xl bg-background px-4 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Strategi Kelulusan</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{analysis.strategi_kelulusan}</p>
        </div>
      )}

      {analysis.rencana_per_semester && analysis.rencana_per_semester.length > 0 && (
        <div className="rounded-2xl bg-background px-4 py-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Rencana Per Semester</p>
          <div className="space-y-2">
            {analysis.rencana_per_semester.map((r) => (
              <div key={r.semester} className="flex items-center gap-3 py-1.5">
                <span className="text-xs font-semibold text-muted-foreground w-12 shrink-0">Sem {r.semester}</span>
                <Badge variant="secondary" className="text-xs">IPS {r.target_ips.toFixed(2)}</Badge>
                <Badge variant="secondary" className="text-xs">{r.target_sks} SKS</Badge>
                {r.catatan && <span className="text-xs text-muted-foreground truncate">{r.catatan}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.peringatan && (
        <div className="rounded-2xl bg-orange-50 dark:bg-orange-950/20 px-4 py-4 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-orange-500" />
          <div>
            <p className="text-sm font-semibold text-orange-700 dark:text-orange-400 mb-0.5">Peringatan</p>
            <p className="text-sm text-orange-700 dark:text-orange-300">{analysis.peringatan}</p>
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-primary/5 px-4 py-4 flex items-start gap-3">
        <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
        <p className="text-sm italic text-muted-foreground leading-relaxed">&ldquo;{analysis.motivasi}&rdquo;</p>
      </div>

      {analysis.remaining_quota !== undefined && (
        <p className="text-xs text-muted-foreground text-right">Sisa kuota: {analysis.remaining_quota}x / jam</p>
      )}
    </div>
  )
}

export default function StudentTargetPage() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [userName, setUserName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [aiStep, setAiStep] = useState(0)
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [saved, setSaved] = useState(false)
  const [step, setStep] = useState(1)
  const [targetYears, setTargetYears] = useState<number | null>(null)
  const [targetSemester, setTargetSemester] = useState(8)
  const [targetIpk, setTargetIpk] = useState<number | null>(null)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [pengalaman, setPengalaman] = useState('')
  const [activeInfo, setActiveInfo] = useState<{ label: string; text: string } | null>(null)
  const aiTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const [summaryRes, profileRes] = await Promise.all([fetch('/api/student/summary'), fetch('/api/student/profile')])
        const summaryResult = await summaryRes.json()
        const profileResult = await profileRes.json()
        setUserName(profileResult.data?.full_name?.split(' ')[0] ?? '')
        if (summaryResult.success && summaryResult.data) {
          setSummaryData(summaryResult.data)
          const t = summaryResult.data.target as StudentTarget | null
          if (t) { setTargetSemester(t.target_semester); setTargetIpk(t.target_ipk ?? null); setTargetYears(t.target_years ?? null) }
        }
      } finally { setIsLoading(false) }
    }
    fetchData()
    return () => { if (aiTimerRef.current) clearInterval(aiTimerRef.current) }
  }, [])

  function startAiProgress() {
    setAiStep(0)
    let i = 0
    aiTimerRef.current = setInterval(() => {
      i++
      if (i < AI_STEPS.length - 1) setAiStep(i)
      else { if (aiTimerRef.current) clearInterval(aiTimerRef.current) }
    }, 1200)
  }

  async function handleAnalyze() {
    setIsAnalyzing(true); setAnalysis(null); setSaved(false); startAiProgress()
    try {
      const res = await fetch('/api/student/target/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_semester: targetSemester, target_ipk: targetIpk, target_years: targetYears }),
      })
      const result = await res.json()
      setAiStep(AI_STEPS.length - 1)
      if (!res.ok || !result.success) { toast.error(result.error ?? 'Gagal menganalisis. Coba lagi.'); return }
      setAnalysis(result.data)
    } finally { if (aiTimerRef.current) clearInterval(aiTimerRef.current); setIsAnalyzing(false) }
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const res = await fetch('/api/student/target', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_semester: targetSemester, target_ipk: targetIpk, target_years: targetYears }),
      })
      const result = await res.json()
      if (!res.ok) { toast.error(result.error ?? 'Gagal menyimpan target'); return }
      toast.success('Target berhasil disimpan dan tampil di dashboard')
      setSaved(true)
      const refreshRes = await fetch('/api/student/summary')
      const refreshResult = await refreshRes.json()
      if (refreshResult.success) setSummaryData(refreshResult.data)
    } finally { setIsSaving(false) }
  }

  function toggleSkill(s: string) { setSelectedSkills(p => p.includes(s) ? p.filter(x => x !== s) : [...p, s]) }
  function toggleIndustry(ind: string) { setSelectedIndustries(p => p.includes(ind) ? p.filter(x => x !== ind) : [...p, ind]) }

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )

  const existingTarget = summaryData?.target

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">

      {/* Full screen loading saat analisis */}
      {isAnalyzing && (
        <div className="flex flex-1 flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4">
          <AIProgress aiStep={aiStep} />
        </div>
      )}

      {!isAnalyzing && (
      <div className="max-w-2xl mx-auto w-full px-4 py-8 md:px-6 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Target Kelulusan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {userName ? `Halo, ${userName}! ` : ''}Atur target dan dapatkan analisis dari Asisten Gradely.
          </p>
        </div>

        {/* Form + step */}
        <div className="space-y-5">
          <StepIndicator currentStep={step} />

          <Card className="border-0 shadow-none bg-muted/30 rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  {(() => { const Icon = STEPS[step-1].icon; return <Icon className="h-4 w-4 text-primary" /> })()}
                  {STEPS[step-1].label}
                </CardTitle>
                <CardDescription className="text-xs">{STEPS[step-1].desc}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">

                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium mb-2.5 text-muted-foreground">Berapa tahun ingin lulus? (opsional)</p>
                      <div className="grid grid-cols-4 gap-2">
                        {[3,4,5,6].map(y => (
                          <button key={y} onClick={() => { setTargetYears(y===targetYears?null:y); setActiveInfo({ label: `${y} Tahun`, text: SEM_DESC[y*2] ?? `Menyelesaikan studi dalam ${y} tahun.` }) }}
                            className={`rounded-xl border-2 py-3 text-center transition-all ${targetYears===y?'border-primary bg-primary/5':'border-border hover:border-primary/40'}`}>
                            <p className="text-xl font-bold">{y}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">tahun</p>
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 mt-2.5">
                        <span className="text-xs text-muted-foreground">Manual:</span>
                        <Input type="number" min={1} max={7} placeholder="tahun" className="h-8 w-20 text-sm"
                          value={targetYears??''} onChange={e=>setTargetYears(e.target.value===''?null:Number(e.target.value))} />
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-xs font-medium mb-2.5 text-muted-foreground">Target semester lulus *</p>
                      <div className="grid grid-cols-4 gap-2">
                        {Array.from({length:8},(_,i)=>i+7).map(sem => (
                          <button key={sem} onClick={() => { setTargetSemester(sem); setActiveInfo({ label: `Semester ${sem}`, text: SEM_DESC[sem]??'' }) }}
                            className={`rounded-xl border-2 py-3 text-center transition-all ${targetSemester===sem?'border-primary bg-primary/5':'border-border hover:border-primary/40'}`}>
                            <p className="text-xl font-bold">{sem}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{sem===7?'Cepat':sem===8?'Normal':'Sem '+sem}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-3">
                    <p className="text-xs font-medium mb-2.5 text-muted-foreground">Target IPK kelulusan (opsional)</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[2.75,3.00,3.25,3.50,3.75,4.00].map(ipk => (
                        <button key={ipk} onClick={() => { setTargetIpk(ipk===targetIpk?null:ipk); setActiveInfo({ label: `IPK ${ipk.toFixed(2)}`, text: IPK_DESC[ipk.toFixed(2)]??'' }) }}
                          className={`rounded-xl border-2 py-3 text-center transition-all ${targetIpk===ipk?'border-primary bg-primary/5':'border-border hover:border-primary/40'}`}>
                          <p className="text-xl font-bold">{ipk.toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{ipk>=3.75?'Cum Laude':ipk>=3.5?'Sangat Baik':ipk>=3.0?'Baik':'Cukup'}</p>
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-2.5">
                      <span className="text-xs text-muted-foreground">Manual:</span>
                      <Input type="number" min={0} max={4} step={0.01} placeholder="0.00" className="h-8 w-20 text-sm"
                        value={targetIpk??''} onChange={e=>setTargetIpk(e.target.value===''?null:Number(e.target.value))} />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-3">
                    <p className="text-xs font-medium mb-2.5 text-muted-foreground">Pilih skill yang ingin dikuasai (opsional)</p>
                    <div className="flex flex-wrap gap-2">
                      {SKILL_OPTIONS.map(s => (
                        <button key={s} onClick={() => { toggleSkill(s); setActiveInfo({ label: s, text: SKILL_DESC[s]??'' }) }}
                          className={`rounded-full border px-3 py-1.5 text-xs transition-all ${selectedSkills.includes(s)?'bg-primary text-primary-foreground border-primary':'border-border hover:border-primary/60'}`}>
                          {s}
                        </button>
                      ))}
                    </div>
                    {selectedSkills.length>0 && <p className="text-xs text-muted-foreground">Dipilih: {selectedSkills.length} skill</p>}
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-3">
                    <p className="text-xs font-medium mb-2.5 text-muted-foreground">Industri yang diminati (opsional)</p>
                    <div className="flex flex-wrap gap-2">
                      {INDUSTRY_OPTIONS.map(ind => (
                        <button key={ind} onClick={() => { toggleIndustry(ind); setActiveInfo({ label: ind, text: INDUSTRY_DESC[ind]??'' }) }}
                          className={`rounded-full border px-3 py-1.5 text-xs transition-all ${selectedIndustries.includes(ind)?'bg-primary text-primary-foreground border-primary':'border-border hover:border-primary/60'}`}>
                          {ind}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium mb-2">Target pengalaman / karier (opsional)</p>
                      <Input placeholder="cth: Magang di startup teknologi..." className="h-9"
                        value={pengalaman} onChange={e=>setPengalaman(e.target.value)} />
                    </div>
                    <Separator />
                    <div className="rounded-xl border bg-muted/30 p-4 space-y-2 text-sm">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Ringkasan Target</p>
                      <div className="flex justify-between"><span className="text-muted-foreground">Semester lulus</span><span className="font-medium">Semester {targetSemester}</span></div>
                      {targetYears && <div className="flex justify-between"><span className="text-muted-foreground">Durasi</span><span className="font-medium">{targetYears} tahun</span></div>}
                      {targetIpk && <div className="flex justify-between"><span className="text-muted-foreground">Target IPK</span><span className="font-medium">{targetIpk.toFixed(2)}</span></div>}
                      {selectedSkills.length>0 && <div className="flex justify-between gap-2"><span className="text-muted-foreground shrink-0">Skill</span><span className="font-medium text-right text-xs">{selectedSkills.slice(0,3).join(', ')}{selectedSkills.length>3?` +${selectedSkills.length-3}`:''}</span></div>}
                      {selectedIndustries.length>0 && <div className="flex justify-between gap-2"><span className="text-muted-foreground shrink-0">Industri</span><span className="font-medium text-right text-xs">{selectedIndustries.slice(0,2).join(', ')}{selectedIndustries.length>2?` +${selectedIndustries.length-2}`:''}</span></div>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Info panel */}
            {activeInfo && (
              <div className="rounded-2xl bg-primary/8 px-4 py-3 flex items-start gap-3">
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-primary">{activeInfo.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{activeInfo.text}</p>
                </div>
                <button onClick={() => setActiveInfo(null)} className="text-muted-foreground hover:text-foreground shrink-0 text-xs">✕</button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-2">
              {step > 1 && (
                <Button variant="outline" size="sm" onClick={() => { setStep(s=>s-1); setActiveInfo(null) }}>
                  <ChevronLeft className="h-4 w-4 mr-1" />Kembali
                </Button>
              )}
              {step < STEPS.length ? (
                <Button size="sm" onClick={() => { setStep(s=>s+1); setActiveInfo(null) }} className="flex-1">
                  Lanjut<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button size="sm" onClick={handleAnalyze} disabled={isAnalyzing} className="flex-1 gap-1.5">
                  {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {isAnalyzing ? 'Menganalisis...' : 'Analisis dengan AI'}
                </Button>
              )}
            </div>
          </div>

        {/* Setelah analisis selesai */}
        {analysis && !isAnalyzing && (
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 px-5 py-4 flex items-center gap-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Analisis selesai!</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                Hasil analisis telah disimpan di Riwayat & Hasil.
                {saved ? ' Target sudah tersimpan di dashboard.' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!saved && (
                <Button size="sm" variant="outline" onClick={handleSave} disabled={isSaving} className="h-8 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-400">
                  {isSaving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}Simpan Target
                </Button>
              )}
              <Button size="sm" asChild className="h-8 text-xs">
                <Link href="/student/target/history">Lihat Hasil</Link>
              </Button>
            </div>
          </div>
        )}

      </div>
      )}
    </div>
  )
}

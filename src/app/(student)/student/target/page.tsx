'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  Loader2, Sparkles, ChevronRight, ChevronLeft, Save,
  CheckCircle2, TrendingUp,
  GraduationCap, Briefcase, Code2, Building2, Info,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'


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

export default function StudentTargetPage() {
  const [, setSummaryData] = useState<SummaryData | null>(null)
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
  const [skillOptions, setSkillOptions] = useState<{ name: string; description: string }[]>([])
  const [industryOptions, setIndustryOptions] = useState<{ name: string; description: string }[]>([])
  const aiTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const [summaryRes, profileRes, skillsRes, industriesRes] = await Promise.all([
          fetch('/api/student/summary'),
          fetch('/api/student/profile'),
          fetch('/api/student/skills'),
          fetch('/api/student/industries'),
        ])
        const [summaryResult, profileResult, skillsResult, industriesResult] = await Promise.all([
          summaryRes.json(), profileRes.json(), skillsRes.json(), industriesRes.json(),
        ])
        setUserName(profileResult.data?.full_name?.split(' ')[0] ?? '')
        if (summaryResult.success && summaryResult.data) {
          setSummaryData(summaryResult.data)
          const t = summaryResult.data.target as StudentTarget | null
          if (t) { setTargetSemester(t.target_semester); setTargetIpk(t.target_ipk ?? null); setTargetYears(t.target_years ?? null) }
        }
        if (skillsResult.success) setSkillOptions(skillsResult.data ?? [])
        if (industriesResult.success) setIndustryOptions(industriesResult.data ?? [])
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
                      {skillOptions.map(s => (
                        <button key={s.name} onClick={() => { toggleSkill(s.name); setActiveInfo({ label: s.name, text: s.description ?? '' }) }}
                          className={`rounded-full border px-3 py-1.5 text-xs transition-all ${selectedSkills.includes(s.name)?'bg-primary text-primary-foreground border-primary':'border-border hover:border-primary/60'}`}>
                          {s.name}
                        </button>
                      ))}
                      {skillOptions.length === 0 && (
                        <p className="text-xs text-muted-foreground">Belum ada opsi skill tersedia.</p>
                      )}
                    </div>
                    {selectedSkills.length>0 && <p className="text-xs text-muted-foreground">Dipilih: {selectedSkills.length} skill</p>}
                  </div>
                )}

                {step === 4 && (
                  <div className="space-y-3">
                    <p className="text-xs font-medium mb-2.5 text-muted-foreground">Industri yang diminati (opsional)</p>
                    <div className="flex flex-wrap gap-2">
                      {industryOptions.map(ind => (
                        <button key={ind.name} onClick={() => { toggleIndustry(ind.name); setActiveInfo({ label: ind.name, text: ind.description ?? '' }) }}
                          className={`rounded-full border px-3 py-1.5 text-xs transition-all ${selectedIndustries.includes(ind.name)?'bg-primary text-primary-foreground border-primary':'border-border hover:border-primary/60'}`}>
                          {ind.name}
                        </button>
                      ))}
                      {industryOptions.length === 0 && (
                        <p className="text-xs text-muted-foreground">Belum ada opsi industri tersedia.</p>
                      )}
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

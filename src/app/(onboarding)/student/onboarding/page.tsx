'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Sparkles,
  Building2,
  Briefcase,
  User,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  Check,
  SearchX,
  Factory,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { CAREER_OPTIONS } from '@/lib/constants/career'
import { getInitials } from '@/lib/utils'
import { DarkModeToggle } from '@/components/dark-mode-toggle'

interface Company {
  id: string
  company_name: string
  industry: string | null
  description: string | null
  website: string | null
  logo_url: string | null
  company_categories: { category: string }[]
}

interface ProfileData {
  full_name: string
  email: string
  nim: string | null
  phone: string | null
  avatar_url: string | null
  current_semester: number | null
  study_programs: { name: string; degree_level: string } | null
  universities: { name: string; city: string | null } | null
}

const STEPS = [
  { label: 'Skill & Minat', icon: Sparkles },
  { label: 'Minat Karier', icon: Briefcase },
  { label: 'Industri', icon: Factory },
  { label: 'Perusahaan', icon: Building2 },
  { label: 'Profil Kamu', icon: User },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [availableSkills, setAvailableSkills] = useState<string[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [skillNotFound, setSkillNotFound] = useState(false)
  const [availableIndustries, setAvailableIndustries] = useState<{ name: string; description: string | null }[]>([])
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [industries, setIndustries] = useState<string[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [selectedCareers, setSelectedCareers] = useState<string[]>([])
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  useEffect(() => {
    fetch('/api/student/profile').then(r => r.json()).then(r => {
      if (r.success) setProfile(r.data)
    })
    fetch('/api/student/skills').then(r => r.json()).then(r => {
      if (r.success) setAvailableSkills((r.data as { name: string }[]).map(s => s.name))
    })
    fetch('/api/student/industries').then(r => r.json()).then(r => {
      if (r.success) setAvailableIndustries(r.data ?? [])
    })
  }, [])

  async function loadCompanies(skills: string[]) {
    setIsLoadingCompanies(true)
    try {
      const res = await fetch(`/api/student/onboarding/companies?skills=${encodeURIComponent(skills.join(','))}`)
      const result = await res.json()
      if (result.success) {
        setCompanies(result.data.companies ?? [])
        setIndustries(result.data.industries ?? [])
      }
    } finally {
      setIsLoadingCompanies(false)
    }
  }

  function toggleSkill(skill: string) {
    if (skillNotFound) return
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  function toggleSkillNotFound() {
    setSkillNotFound(prev => {
      if (!prev) setSelectedSkills([])
      return !prev
    })
  }

  function toggleIndustry(name: string) {
    setSelectedIndustries(prev =>
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    )
  }

  function toggleCompany(id: string) {
    setSelectedCompanies(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  async function handleNext() {
    if (step === 0) {
      if (!skillNotFound && selectedSkills.length === 0) {
        toast.error('Pilih minimal 1 skill atau centang "Saya tidak menemukan skill"')
        return
      }
      setStep(1)
    } else if (step === 1) {
      setStep(2)
    } else if (step === 2) {
      if (skillNotFound) {
        setCompanies([])
        setIndustries([])
      } else {
        await loadCompanies(selectedSkills)
      }
      setStep(3)
    } else if (step === 3) {
      setStep(4)
    } else {
      await handleComplete()
    }
  }

  function handleBack() {
    if (step > 0) setStep(s => s - 1)
  }

  function handleSkipLater() {
    router.push('/student/dashboard')
  }

  async function handleComplete() {
    setIsCompleting(true)
    try {
      const res = await fetch('/api/student/onboarding/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills: skillNotFound ? [] : selectedSkills,
          interested_company_ids: selectedCompanies,
          skill_not_found: skillNotFound,
          selected_industries: selectedIndustries,
          selected_careers: selectedCareers,
        }),
      })
      const result = await res.json()
      if (!res.ok) { toast.error(result.error ?? 'Gagal menyelesaikan onboarding'); return }
      toast.success('Selamat datang di Gradely!')
      router.push('/student/dashboard')
      router.refresh()
    } finally {
      setIsCompleting(false)
    }
  }

  const NavButtons = () => (
    <div className="flex items-center justify-between mt-8 gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={handleBack}
        disabled={step === 0}
        className="gap-1.5"
      >
        <ChevronLeft className="h-4 w-4" />
        Kembali
      </Button>

      <div className="flex items-center gap-1.5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === step ? 'w-5 h-1.5 bg-primary'
                : i < step ? 'w-1.5 h-1.5 bg-primary/40'
                : 'w-1.5 h-1.5 bg-muted-foreground/25'
            }`}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSkipLater}
          className="text-muted-foreground text-xs"
        >
          Isi Nanti
        </Button>
        <Button
          size="sm"
          onClick={handleNext}
          disabled={isCompleting}
          className="gap-1.5"
        >
          {isCompleting
            ? <><Loader2 className="h-4 w-4 animate-spin" />Menyimpan...</>
            : step === STEPS.length - 1
            ? <><CheckCircle2 className="h-4 w-4" />Mulai Gradely</>
            : <>Lanjut<ChevronRight className="h-4 w-4" /></>
          }
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* Top bar */}
      <div className="fixed top-0 right-0 z-10 px-4 pt-4">
        <DarkModeToggle />
      </div>

      {/* Center content */}
      <div className="flex-1 w-full flex flex-col items-center justify-center px-4 py-12">

        {/* Step 0 — Skills: 2-col layout */}
        {step === 0 ? (
          <div className="w-full max-w-5xl">

            {/* Step indicator — centered */}
            <div className="flex flex-col items-center gap-4 mb-10">
              <div className="flex items-center gap-2">
                {STEPS.map((s, i) => {
                  const isDone = i < step
                  const isActive = i === step
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`flex items-center gap-2 text-xs font-medium transition-all ${
                        isActive ? 'text-primary' : isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                      }`}>
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full transition-all ${
                          isDone ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                            : isActive ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {isDone ? <Check className="h-3 w-3" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                        </div>
                        <span className="hidden sm:block">{s.label}</span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`w-10 h-px transition-colors ${i < step ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-border'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
              <Progress value={((step + 1) / STEPS.length) * 100} className="h-1 w-44" />
            </div>

            {/* 2-col layout: left info + right skill grid */}
            <div className="flex flex-col lg:flex-row lg:gap-12 lg:items-start">

              {/* LEFT PANEL */}
              <div className="hidden lg:flex flex-col gap-8 w-80 shrink-0 sticky top-10">
                <div className="space-y-3">
                  <h1 className="text-3xl font-semibold tracking-tight leading-snug">
                    Apa skill &<br />minat kamu?
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Pilih skill yang kamu miliki atau ingin kembangkan. Ini membantu kami menampilkan perusahaan dan peluang karir yang relevan untukmu.
                  </p>
                </div>

                {selectedSkills.length === 0 && !skillNotFound && (
                  <div className="rounded-xl border border-dashed border-border bg-muted/30 px-5 py-6 text-center">
                    <Sparkles className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Pilih skill di sebelah kanan untuk mulai</p>
                  </div>
                )}

                {selectedSkills.length > 0 && !skillNotFound && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-primary uppercase tracking-wide">Dipilih</p>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {selectedSkills.length}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedSkills.map(s => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {skillNotFound && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30 px-5 py-4 space-y-1">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">Skill tidak ditemukan</p>
                    <p className="text-xs text-amber-600/70 dark:text-amber-500/70 leading-relaxed">
                      Tidak masalah, kamu tetap bisa lanjut ke langkah berikutnya.
                    </p>
                  </div>
                )}

                <NavButtons />
              </div>

              {/* RIGHT PANEL — skill grid */}
              <div className="flex-1 min-w-0 space-y-5">

                {/* Mobile title */}
                <div className="lg:hidden text-center space-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight">Apa skill & minat kamu?</h1>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Pilih skill yang kamu miliki atau ingin kembangkan.
                  </p>
                </div>

                {/* Skill grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {availableSkills.map((skill) => {
                    const selected = selectedSkills.includes(skill)
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        disabled={skillNotFound}
                        className={`relative flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-medium text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          skillNotFound
                            ? 'border-border bg-muted/20 text-muted-foreground/30 cursor-not-allowed opacity-40'
                            : selected
                            ? 'border-primary bg-primary/8 text-primary shadow-sm ring-1 ring-primary/20 cursor-pointer'
                            : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent/50 cursor-pointer'
                        }`}
                      >
                        <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150 ${
                          selected && !skillNotFound
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground/25 bg-transparent'
                        }`}>
                          {selected && !skillNotFound && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                        </div>
                        <span className="leading-tight">{skill}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Tidak menemukan skill */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={toggleSkillNotFound}
                    className={`w-full flex items-center gap-4 rounded-xl border px-5 py-4 text-sm font-medium text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer ${
                      skillNotFound
                        ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-sm ring-1 ring-amber-300/50 dark:border-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                        : 'border-dashed border-border bg-card text-muted-foreground hover:border-muted-foreground/40 hover:bg-accent/40'
                    }`}
                  >
                    <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-150 ${
                      skillNotFound
                        ? 'border-amber-500 bg-amber-500 dark:border-amber-400 dark:bg-amber-400'
                        : 'border-muted-foreground/25'
                    }`}>
                      {skillNotFound
                        ? <Check className="h-3.5 w-3.5 text-white dark:text-amber-950" />
                        : <SearchX className="h-3.5 w-3.5 text-muted-foreground/40" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium">Saya tidak menemukan skill saya</p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">Lewati langkah ini dan lanjut ke tahap berikutnya</p>
                    </div>
                  </button>
                </div>

                {/* Mobile: selected skills summary */}
                {selectedSkills.length > 0 && !skillNotFound && (
                  <Card className="lg:hidden border-primary/20 bg-primary/5">
                    <CardContent className="py-3 px-4">
                      <p className="text-xs font-medium text-primary mb-2">{selectedSkills.length} skill dipilih</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSkills.map(s => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Mobile nav */}
                <div className="lg:hidden pt-2">
                  <NavButtons />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Steps 1 & 2 — single column centered */
          <div className="w-full max-w-xl">
            {/* Header + progress */}
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="flex items-center gap-2">
                {STEPS.map((s, i) => {
                  const isDone = i < step
                  const isActive = i === step
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`flex items-center gap-1.5 text-xs font-medium transition-all ${
                        isActive ? 'text-primary' : isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                      }`}>
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full transition-all ${
                          isDone ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                            : isActive ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {isDone ? <Check className="h-3 w-3" /> : <span className="text-[10px] font-bold">{i + 1}</span>}
                        </div>
                        <span className="hidden sm:block text-xs">{s.label}</span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`w-8 h-px transition-colors ${i < step ? 'bg-emerald-300 dark:bg-emerald-700' : 'bg-border'}`} />
                      )}
                    </div>
                  )
                })}
              </div>
              <Progress value={((step + 1) / STEPS.length) * 100} className="h-1 w-40" />
            </div>

            {/* STEP 2 — Industri */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h1 className="text-2xl font-semibold tracking-tight">Industri yang kamu minati</h1>
                  <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
                    Pilih industri yang ingin kamu masuki setelah lulus. Ini membantu kami menyesuaikan saran karier untukmu.
                  </p>
                </div>

                {availableIndustries.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-14 gap-3 text-center">
                      <Factory className="h-10 w-10 text-muted-foreground/25" />
                      <div>
                        <p className="text-sm font-medium">Belum ada opsi industri</p>
                        <p className="text-xs text-muted-foreground mt-1">Kamu bisa lewati langkah ini.</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {availableIndustries.map((ind) => {
                      const selected = selectedIndustries.includes(ind.name)
                      return (
                        <button
                          key={ind.name}
                          type="button"
                          onClick={() => toggleIndustry(ind.name)}
                          className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-sm font-medium text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer ${
                            selected
                              ? 'border-primary bg-primary/8 text-primary shadow-sm ring-1 ring-primary/20'
                              : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent/50'
                          }`}
                        >
                          <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                            selected ? 'border-primary bg-primary' : 'border-muted-foreground/25'
                          }`}>
                            {selected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                          </div>
                          <span className="leading-tight truncate">{ind.name}</span>
                        </button>
                      )
                    })}
                  </div>
                )}

                {selectedIndustries.length > 0 && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="py-3 px-4">
                      <p className="text-xs font-medium text-primary mb-2">{selectedIndustries.length} industri dipilih</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedIndustries.map(name => (
                          <Badge key={name} variant="secondary" className="text-xs">{name}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* STEP 3 — Companies */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h1 className="text-2xl font-semibold tracking-tight">Perusahaan & industri relevan</h1>
                  <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
                    Berdasarkan skill kamu, berikut perusahaan mitra yang relevan. Pilih yang kamu minati.
                  </p>
                </div>

                {industries.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {industries.map(ind => (
                      <Badge key={ind} variant="outline" className="text-xs">{ind}</Badge>
                    ))}
                  </div>
                )}

                {isLoadingCompanies ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Mencari perusahaan relevan...</p>
                  </div>
                ) : companies.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-14 gap-3 text-center">
                      <Building2 className="h-10 w-10 text-muted-foreground/25" />
                      <div>
                        <p className="text-sm font-medium">Belum ada perusahaan mitra</p>
                        <p className="text-xs text-muted-foreground mt-1">Kamu bisa lanjut ke langkah berikutnya.</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {companies.map((company) => {
                      const selected = selectedCompanies.includes(company.id)
                      return (
                        <button
                          key={company.id}
                          type="button"
                          onClick={() => toggleCompany(company.id)}
                          className={`flex flex-col gap-3 rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer ${
                            selected
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-border bg-card hover:border-primary/50 hover:bg-muted/30'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="h-9 w-9 rounded-lg shrink-0">
                                <AvatarImage src={company.logo_url ?? ''} />
                                <AvatarFallback className="rounded-lg text-xs font-bold bg-muted">
                                  {company.company_name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">{company.company_name}</p>
                                {company.industry && (
                                  <p className="text-xs text-muted-foreground">{company.industry}</p>
                                )}
                              </div>
                            </div>
                            <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                              selected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                            }`}>
                              {selected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                            </div>
                          </div>
                          {company.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{company.description}</p>
                          )}
                          {company.company_categories?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {company.company_categories.slice(0, 3).map(c => (
                                <Badge key={c.category} variant="secondary" className="text-xs px-2 py-0">{c.category}</Badge>
                              ))}
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}

                {selectedCompanies.length > 0 && (
                  <p className="text-xs text-muted-foreground text-center">{selectedCompanies.length} perusahaan dipilih</p>
                )}
              </div>
            )}

            {/* STEP 4 — Profile */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h1 className="text-2xl font-semibold tracking-tight">Konfirmasi profil kamu</h1>
                  <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
                    Data ini diisi oleh admin kampus. Kamu bisa memperbarui kapan saja di menu Profil Saya.
                  </p>
                </div>

                {!profile ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Card>
                      <CardContent className="pt-5">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-14 w-14 shrink-0">
                            <AvatarImage src={profile.avatar_url ?? ''} />
                            <AvatarFallback className="text-base font-semibold">{getInitials(profile.full_name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-base font-semibold truncate">{profile.full_name}</p>
                            <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
                            {profile.nim && <p className="text-xs text-muted-foreground font-mono mt-0.5">NIM: {profile.nim}</p>}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Card>
                        <CardHeader className="pb-2 pt-4 px-4">
                          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Akademik</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Program Studi</p>
                            <p className="text-sm font-medium">{profile.study_programs?.name ?? '-'}</p>
                          </div>
                          <Separator />
                          <div>
                            <p className="text-xs text-muted-foreground">Semester Aktif</p>
                            <p className="text-sm font-medium">{profile.current_semester ? `Semester ${profile.current_semester}` : '-'}</p>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2 pt-4 px-4">
                          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Institusi</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4 space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Universitas</p>
                            <p className="text-sm font-medium">{profile.universities?.name ?? '-'}</p>
                          </div>
                          <Separator />
                          <div>
                            <p className="text-xs text-muted-foreground">Nomor HP</p>
                            <p className="text-sm font-medium">{profile.phone ?? '-'}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Skill Dipilih</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        {skillNotFound ? (
                          <p className="text-sm text-muted-foreground italic">Skill tidak ditemukan dalam daftar</p>
                        ) : selectedSkills.length === 0 ? (
                          <p className="text-sm text-muted-foreground italic">Belum ada skill dipilih</p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {selectedSkills.map(s => (
                              <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {selectedIndustries.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2 pt-4 px-4">
                          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Industri yang Diminati</CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pb-4">
                          <div className="flex flex-wrap gap-1.5">
                            {selectedIndustries.map(name => (
                              <Badge key={name} variant="outline" className="text-xs">{name}</Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )}

            <NavButtons />
          </div>
        )}
      </div>
    </div>
  )
}

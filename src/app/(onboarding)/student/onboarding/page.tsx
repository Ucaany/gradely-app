'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  GraduationCap,
  Sparkles,
  Building2,
  User,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { getInitials } from '@/lib/utils'

const AVAILABLE_SKILLS = [
  'Desain Grafis', 'UI/UX Design', 'Ilustrasi', 'Fotografi',
  'Videografi', 'Animasi', 'Musik', 'Seni Pertunjukan',
  'Kriya & Kerajinan', 'Arsitektur', 'Fashion Design', 'Branding',
  'Social Media', 'Copywriting', 'Web Development', 'Mobile Development',
]

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
  { label: 'Perusahaan', icon: Building2 },
  { label: 'Profil Kamu', icon: User },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [industries, setIndustries] = useState<string[]>([])
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false)
  const [isCompleting, setIsCompleting] = useState(false)

  useEffect(() => {
    fetch('/api/student/profile').then(r => r.json()).then(r => {
      if (r.success) setProfile(r.data)
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
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    )
  }

  function toggleCompany(id: string) {
    setSelectedCompanies(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  async function handleNext() {
    if (step === 0) {
      if (selectedSkills.length === 0) { toast.error('Pilih minimal 1 skill'); return }
      await loadCompanies(selectedSkills)
      setStep(1)
    } else if (step === 1) {
      setStep(2)
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
          skills: selectedSkills,
          interested_company_ids: selectedCompanies,
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-between bg-background">

      {/* Center content */}
      <div className="flex-1 w-full flex flex-col items-center justify-center px-4 py-10 pb-28">
        <div className="w-full max-w-xl">

          {/* Logo + progress */}
          <div className="flex flex-col items-center gap-5 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <GraduationCap className="h-5 w-5" />
            </div>

            {/* Step dots */}
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
                        {isDone
                          ? <Check className="h-3 w-3" />
                          : <span className="text-[10px] font-bold">{i + 1}</span>
                        }
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

          {/* STEP 1 — Skills */}
          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Apa skill & minat kamu?</h1>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
                  Pilih skill yang kamu miliki atau ingin kembangkan.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AVAILABLE_SKILLS.map((skill) => {
                  const selected = selectedSkills.includes(skill)
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`relative flex items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        selected
                          ? 'border-primary bg-primary/5 text-primary shadow-sm'
                          : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted/40'
                      }`}
                    >
                      <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        selected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                      }`}>
                        {selected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                      </div>
                      {skill}
                    </button>
                  )
                })}
              </div>

              {selectedSkills.length > 0 && (
                <Card className="border-primary/20 bg-primary/5">
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
            </div>
          )}

          {/* STEP 2 — Companies */}
          {step === 1 && (
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
                        className={`flex flex-col gap-3 rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
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

          {/* STEP 3 — Profile */}
          {step === 2 && (
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
                      <div className="flex flex-wrap gap-1.5">
                        {selectedSkills.map(s => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur-sm z-10">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
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
      </div>
    </div>
  )
}

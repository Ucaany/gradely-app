'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Briefcase,
  User,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  Check,
  Factory,
  Eye,
  EyeOff,
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
import { Switch } from '@/components/ui/switch'

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
  { label: 'Minat Karier', icon: Briefcase },
  { label: 'Industri', icon: Factory },
  { label: 'Profil Kamu', icon: User },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [availableIndustries, setAvailableIndustries] = useState<{ name: string }[]>([])
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [selectedCareers, setSelectedCareers] = useState<string[]>([])
  const [careerNotFound, setCareerNotFound] = useState(false)
  const [profileVisible, setProfileVisible] = useState(true)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isCompleting, setIsCompleting] = useState(false)
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [optionsError, setOptionsError] = useState<string | null>(null)

  useEffect(() => {
    setIsLoadingOptions(true)
    setOptionsError(null)
    Promise.all([
      fetch('/api/student/profile').then(r => r.json()),
      fetch('/api/student/industries').then(r => r.json()),
    ]).then(([profileRes, industriesRes]) => {
      if (profileRes.success) setProfile(profileRes.data)
      if (industriesRes.success) {
        setAvailableIndustries(industriesRes.data ?? [])
      } else {
        setOptionsError(industriesRes.error ?? 'Gagal memuat industri')
      }
    }).catch(() => {
      setOptionsError('Gagal memuat data onboarding')
    }).finally(() => setIsLoadingOptions(false))
  }, [])

  function toggleIndustry(name: string) {
    setSelectedIndustries(prev =>
      prev.includes(name) ? prev.filter(i => i !== name) : [...prev, name]
    )
  }

  function toggleCareerNotFound() {
    setCareerNotFound(prev => {
      if (!prev) setSelectedCareers([])
      return !prev
    })
  }

  async function handleNext() {
    if (step === 0) {
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
          selected_industries: selectedIndustries,
          selected_careers: selectedCareers,
          profile_visible: profileVisible,
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

      <div className="fixed top-0 right-0 z-10 px-4 pt-4">
        <DarkModeToggle />
      </div>

      <div className="flex-1 w-full flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
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

          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Minat karier kamu</h1>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
                  Pilih bidang karier yang ingin kamu tekuni. Data ini ditampilkan ke perusahaan mitra.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {CAREER_OPTIONS.map((option) => {
                  const selected = selectedCareers.includes(option)
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => {
                        if (careerNotFound) return
                        setSelectedCareers(prev =>
                          prev.includes(option) ? prev.filter(c => c !== option) : [...prev, option]
                        )
                      }}
                      disabled={careerNotFound}
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        careerNotFound
                          ? 'bg-muted/50 text-muted-foreground/50 border-border cursor-not-allowed'
                          : selected
                          ? 'bg-primary text-primary-foreground border-primary cursor-pointer'
                          : 'bg-background text-foreground border-border hover:bg-muted cursor-pointer'
                      }`}
                    >
                      {selected && <Check className="h-3.5 w-3.5" />}
                      {option}
                    </button>
                  )
                })}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={toggleCareerNotFound}
                  className={`w-full flex items-center gap-4 rounded-xl border px-5 py-4 text-sm font-medium text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer ${
                    careerNotFound
                      ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-sm ring-1 ring-amber-300/50 dark:border-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
                      : 'border-dashed border-border bg-card text-muted-foreground hover:border-muted-foreground/40 hover:bg-accent/40'
                  }`}
                >
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    careerNotFound
                      ? 'border-amber-500 bg-amber-500 dark:border-amber-400 dark:bg-amber-400'
                      : 'border-muted-foreground/25'
                  }`}>
                    {careerNotFound && <Check className="h-3.5 w-3.5 text-white dark:text-amber-950" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">Tidak ada minat karier</p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">Lewati langkah ini dan lanjut ke tahap berikutnya</p>
                  </div>
                </button>
              </div>

              {selectedCareers.length > 0 && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="py-3 px-4">
                    <p className="text-xs font-medium text-primary mb-2">{selectedCareers.length} minat dipilih</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCareers.map(c => (
                        <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-2xl font-semibold tracking-tight">Industri yang kamu minati</h1>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-md mx-auto">
                  Pilih industri yang ingin kamu masuki setelah lulus. Ini membantu kami menyesuaikan saran karier untukmu.
                </p>
              </div>

              {isLoadingOptions ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Memuat industri...</p>
                </div>
              ) : availableIndustries.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-14 gap-3 text-center">
                    <Factory className="h-10 w-10 text-muted-foreground/25" />
                    <div>
                      <p className="text-sm font-medium">Belum ada opsi industri</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {optionsError ?? 'Admin belum menambahkan industri aktif. Kamu bisa lewati langkah ini.'}
                      </p>
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

                  {selectedCareers.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Minat Karier</CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        <div className="flex flex-wrap gap-1.5">
                          {selectedCareers.map(c => (
                            <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

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

                  <Card>
                    <CardHeader className="pb-2 pt-4 px-4">
                      <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        {profileVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        Visibilitas Profil
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">Tampil ke Perusahaan</p>
                          <p className="text-xs text-muted-foreground">
                            {profileVisible ? 'Profil kamu bisa ditemukan perusahaan mitra' : 'Profil kamu tersembunyi dari perusahaan'}
                          </p>
                        </div>
                        <Switch
                          checked={profileVisible}
                          onCheckedChange={setProfileVisible}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}

          <NavButtons />
        </div>
      </div>
    </div>
  )
}

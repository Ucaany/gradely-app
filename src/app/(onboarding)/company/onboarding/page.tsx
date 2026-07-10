'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Building2, Globe, FileText, ChevronRight, CheckCircle2, Loader2, Check, Briefcase, ImageIcon, MapPin, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { DarkModeToggle } from '@/components/dark-mode-toggle'

const STEPS = [
  { label: 'Profil Perusahaan', icon: Building2 },
  { label: 'Konfirmasi', icon: Check },
]

interface CompanyData {
  id: string
  company_name: string
  industry: string | null
  description: string | null
  website: string | null
  logo_url: string | null
  address: string | null
  postal_code: string | null
}

export default function CompanyOnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isCompleting, setIsCompleting] = useState(false)
  const [, setCompany] = useState<CompanyData | null>(null)

  const [form, setForm] = useState({
    company_name: '',
    industry: '',
    description: '',
    website: '',
    logo_url: '',
    address: '',
    postal_code: '',
  })

  useEffect(() => {
    fetch('/api/company/onboarding')
      .then(r => r.json())
      .then(r => {
        if (r.success && r.data) {
          setCompany(r.data)
          setForm({
            company_name: r.data.company_name ?? '',
            industry: r.data.industry ?? '',
            description: r.data.description ?? '',
            website: r.data.website ?? '',
            logo_url: r.data.logo_url ?? '',
            address: r.data.address ?? '',
            postal_code: r.data.postal_code ?? '',
          })
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  function handleNext() {
    if (step === 0) {
      if (!form.company_name.trim()) { toast.error('Nama perusahaan wajib diisi'); return }
      setStep(1)
    }
  }

  async function handleComplete() {
    setIsCompleting(true)
    try {
      const res = await fetch('/api/company/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await res.json()
      if (!res.ok || !result.success) { toast.error(result.error ?? 'Gagal menyelesaikan onboarding'); return }
      toast.success('Selamat datang di Gradely!')
      router.push('/company/dashboard')
      router.refresh()
    } finally {
      setIsCompleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="fixed top-0 right-0 z-10 px-4 pt-4">
        <DarkModeToggle />
      </div>

      <div className="flex-1 w-full flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg">

          <div className="flex flex-col items-center gap-4 mb-10">
            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => {
                const isDone = i < step
                const isActive = i === step
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 text-xs font-medium transition-all ${isActive ? 'text-primary' : isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full transition-all ${isDone ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' : isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground'}`}>
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

          {step === 0 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">Lengkapi profil perusahaan</h1>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Informasi ini ditampilkan ke mahasiswa saat mereka melihat perusahaan mitra.
                </p>
              </div>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="company_name" className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                        Nama Perusahaan <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="company_name"
                        value={form.company_name}
                        onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                        placeholder="Nama perusahaan"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="industry" className="flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                        Industri
                      </Label>
                      <Input
                        id="industry"
                        value={form.industry}
                        onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                        placeholder="Teknologi, Kreatif..."
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="logo_url" className="flex items-center gap-1.5">
                      <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      URL Logo
                    </Label>
                    <Input
                      id="logo_url"
                      value={form.logo_url}
                      onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))}
                      placeholder="https://example.com/logo.png"
                      type="url"
                    />
                    {form.logo_url && (
                      <div className="flex items-center gap-2 mt-1">
                        <Avatar className="h-10 w-10 rounded-lg shrink-0 border">
                          <AvatarImage src={form.logo_url} />
                          <AvatarFallback className="rounded-lg text-xs bg-muted">?</AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground">Preview logo</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="website" className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      Website
                    </Label>
                    <Input
                      id="website"
                      value={form.website}
                      onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
                      placeholder="https://perusahaan.com"
                      type="url"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="address" className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      Alamat
                    </Label>
                    <Textarea
                      id="address"
                      value={form.address}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                      placeholder="Jl. Contoh No. 1, Kota, Provinsi"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="postal_code" className="flex items-center gap-1.5">
                      <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                      Kode Pos
                    </Label>
                    <Input
                      id="postal_code"
                      value={form.postal_code}
                      onChange={e => setForm(f => ({ ...f, postal_code: e.target.value }))}
                      placeholder="55281"
                      maxLength={10}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description" className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      Deskripsi Perusahaan
                    </Label>
                    <Textarea
                      id="description"
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Ceritakan tentang perusahaan, visi misi, dan jenis talenta yang dicari..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button onClick={handleNext} className="gap-1.5">
                  Lanjut
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight">Konfirmasi profil kamu</h1>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Pastikan informasi berikut sudah benar sebelum memulai.
                </p>
              </div>

              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 rounded-xl shrink-0 border">
                      <AvatarImage src={form.logo_url} />
                      <AvatarFallback className="rounded-xl text-base font-bold bg-muted">
                        {form.company_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-base font-semibold truncate">{form.company_name}</p>
                      {form.industry && <p className="text-sm text-muted-foreground">{form.industry}</p>}
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    {form.website && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Website</p>
                        <p className="text-primary">{form.website}</p>
                      </div>
                    )}
                    {form.address && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Alamat</p>
                        <p className="leading-relaxed whitespace-pre-line">{form.address}{form.postal_code ? ` (${form.postal_code})` : ''}</p>
                      </div>
                    )}
                    {form.description && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Deskripsi</p>
                        <p className="leading-relaxed whitespace-pre-line text-foreground">{form.description}</p>
                      </div>
                    )}
                    {!form.website && !form.address && !form.description && (
                      <p className="text-muted-foreground text-xs italic">Detail belum diisi. Kamu bisa melengkapinya nanti di menu Pengaturan Perusahaan.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between gap-3">
                <Button variant="outline" onClick={() => setStep(0)} disabled={isCompleting}>Kembali</Button>
                <Button onClick={handleComplete} disabled={isCompleting} className="gap-1.5">
                  {isCompleting
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Menyimpan...</>
                    : <><CheckCircle2 className="h-4 w-4" />Mulai Gradely</>
                  }
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
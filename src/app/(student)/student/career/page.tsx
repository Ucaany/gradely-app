'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Loader2, Briefcase, Eye, EyeOff, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

import { CAREER_OPTIONS } from '@/lib/constants/career'

export default function StudentCareerPage() {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [profileVisible, setProfileVisible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isTogglingVisibility, setIsTogglingVisibility] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [careerRes, profileRes] = await Promise.all([
        fetch('/api/student/career'),
        fetch('/api/student/profile'),
      ])
      const [careerData, profileData] = await Promise.all([careerRes.json(), profileRes.json()])
      if (careerData.success) {
        setSelectedInterests((careerData.data ?? []).map((c: { interest: string }) => c.interest))
      }
      if (profileData.success) {
        setProfileVisible(profileData.data?.profile_visible ?? false)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function toggleInterest(interest: string) {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    )
  }

  async function handleSave() {
    if (selectedInterests.length === 0) {
      toast.error('Pilih minimal 1 minat karier')
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch('/api/student/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interests: selectedInterests }),
      })
      const result = await res.json()
      if (!res.ok) { toast.error(result.error ?? 'Gagal menyimpan'); return }
      toast.success('Minat karier diperbarui')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleVisibility(value: boolean) {
    setIsTogglingVisibility(true)
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_visible: value }),
      })
      const result = await res.json()
      if (!res.ok) { toast.error(result.error ?? 'Gagal mengubah pengaturan'); return }
      setProfileVisible(value)
      toast.success(value ? 'Profil kamu sekarang terlihat oleh perusahaan' : 'Profil kamu disembunyikan dari perusahaan')
    } finally {
      setIsTogglingVisibility(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profil Karier</h1>
        <p className="text-sm text-muted-foreground">Kelola minat karier dan visibilitas profil kamu ke perusahaan mitra</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Minat Karier */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                Minat Karier
              </CardTitle>
              <CardDescription>
                Pilih bidang karier yang kamu minati. Perusahaan yang relevan akan ditampilkan berdasarkan pilihan ini.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {CAREER_OPTIONS.map((option) => {
                  const selected = selectedInterests.includes(option)
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleInterest(option)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${
                        selected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {selected && <Check className="h-3.5 w-3.5" />}
                      {option}
                    </button>
                  )
                })}
              </div>

              {selectedInterests.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground mb-2">Terpilih ({selectedInterests.length}):</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedInterests.map((interest) => (
                      <Badge key={interest} variant="secondary" className="gap-1 pr-1">
                        {interest}
                        <button
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button onClick={handleSave} disabled={isSaving || selectedInterests.length === 0}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSaving ? 'Menyimpan...' : 'Simpan Minat Karier'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visibilitas */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                {profileVisible ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                Visibilitas Profil
              </CardTitle>
              <CardDescription>
                Kendalikan apakah perusahaan mitra bisa menemukan profil kamu.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">Tampil ke Perusahaan</p>
                  <p className="text-xs text-muted-foreground">
                    {profileVisible ? 'Profil kamu bisa ditemukan perusahaan mitra' : 'Profil kamu tersembunyi'}
                  </p>
                </div>
                <Switch
                  checked={profileVisible}
                  onCheckedChange={handleToggleVisibility}
                  disabled={isTogglingVisibility}
                />
              </div>

              <Separator />

              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="font-medium text-foreground text-sm">Data yang ditampilkan ke perusahaan:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Nama lengkap</li>
                  <li>Program studi & universitas</li>
                  <li>IPK</li>
                  <li>Minat karier & skill portofolio</li>
                  <li>Link portofolio</li>
                </ul>
                <p className="font-medium text-foreground text-sm mt-3">Data yang tidak ditampilkan:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>NIM</li>
                  <li>Nomor HP</li>
                  <li>Detail nilai per mata kuliah</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Building2, Globe, Loader2, Pencil, Save, X, ImageIcon, MapPin, Hash, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'


interface CompanyProfile {
  id: string
  company_name: string
  industry: string | null
  description: string | null
  website: string | null
  logo_url: string | null
  address: string | null
  postal_code: string | null
  is_active: boolean
  is_verified: boolean
  created_at: string
  company_categories: { id: string; category: string }[]
}

export default function CompanyProfilePage() {
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

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
    fetch('/api/company/profile')
      .then(r => r.json())
      .then(r => {
        if (r.success && r.data) {
          setProfile(r.data)
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

  function startEdit() {
    if (!profile) return
    setForm({
      company_name: profile.company_name ?? '',
      industry: profile.industry ?? '',
      description: profile.description ?? '',
      website: profile.website ?? '',
      logo_url: profile.logo_url ?? '',
      address: profile.address ?? '',
      postal_code: profile.postal_code ?? '',
    })
    setIsEditing(true)
  }

  function cancelEdit() { setIsEditing(false) }

  async function handleSave() {
    if (!form.company_name.trim()) {
      toast.error('Nama perusahaan tidak boleh kosong')
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch('/api/company/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await res.json()
      if (!res.ok || !result.success) {
        toast.error(result.error ?? 'Gagal menyimpan perubahan')
        return
      }
      setProfile(prev => prev ? { ...prev, ...form } : prev)
      setIsEditing(false)
      toast.success('Profil perusahaan berhasil diperbarui')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-24 gap-3">
        <Building2 className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">Data perusahaan tidak ditemukan.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8 w-full max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Pengaturan Perusahaan</h1>
          <p className="text-sm text-muted-foreground">Kelola informasi dan pengaturan perusahaan</p>
        </div>
        {!isEditing ? (
          <Button size="sm" variant="outline" onClick={startEdit} className="gap-1.5 shrink-0">
            <Pencil className="h-4 w-4" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2 shrink-0">
            <Button size="sm" variant="outline" onClick={cancelEdit} disabled={isSaving} className="gap-1.5">
              <X className="h-4 w-4" />
              Batal
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="gap-1.5">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Simpan
            </Button>
          </div>
        )}
      </div>

      {/* Identity card with logo */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 rounded-xl shrink-0 border">
              <AvatarImage src={profile.logo_url ?? ''} alt={profile.company_name} />
              <AvatarFallback className="rounded-xl text-lg font-bold bg-muted">
                {profile.company_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold truncate">{profile.company_name}</p>
              {profile.industry && (
                <p className="text-sm text-muted-foreground">{profile.industry}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <Badge variant={profile.is_active ? 'default' : 'secondary'} className="text-xs gap-1">
                  {profile.is_active
                    ? <><CheckCircle2 className="h-3 w-3" />Aktif</>
                    : <><XCircle className="h-3 w-3" />Nonaktif</>
                  }
                </Badge>
                {profile.is_verified && (
                  <Badge variant="outline" className="text-xs gap-1 border-emerald-500 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Terverifikasi
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main info form/view */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Informasi Perusahaan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="company_name">Nama Perusahaan <span className="text-destructive">*</span></Label>
                  <Input
                    id="company_name"
                    value={form.company_name}
                    onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                    placeholder="Nama perusahaan"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="industry">Industri</Label>
                  <Input
                    id="industry"
                    value={form.industry}
                    onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}
                    placeholder="Contoh: Teknologi, Kreatif"
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
                <Label htmlFor="description">Deskripsi Perusahaan</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Ceritakan tentang perusahaan kamu..."
                  rows={4}
                />
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Nama Perusahaan</p>
                  <p className="text-sm font-medium">{profile.company_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Industri</p>
                  <p className="text-sm font-medium">{profile.industry ?? '-'}</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Website</p>
                {profile.website ? (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    {profile.website}
                  </a>
                ) : (
                  <p className="text-sm text-muted-foreground">-</p>
                )}
              </div>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />Alamat
                  </p>
                  <p className="text-sm font-medium whitespace-pre-line">{profile.address ?? '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                    <Hash className="h-3 w-3" />Kode Pos
                  </p>
                  <p className="text-sm font-medium">{profile.postal_code ?? '-'}</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Deskripsi</p>
                <p className="text-sm leading-relaxed whitespace-pre-line">
                  {profile.description ?? <span className="text-muted-foreground">-</span>}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Status card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Status Akun
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Status Aktif</p>
              <p className="text-xs text-muted-foreground">Profil perusahaan terlihat oleh mahasiswa</p>
            </div>
            <Badge variant={profile.is_active ? 'default' : 'secondary'}>
              {profile.is_active ? 'Aktif' : 'Nonaktif'}
            </Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Verifikasi</p>
              <p className="text-xs text-muted-foreground">Status verifikasi oleh admin</p>
            </div>
            <Badge variant={profile.is_verified ? 'outline' : 'secondary'}
              className={profile.is_verified ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : ''}>
              {profile.is_verified ? 'Terverifikasi' : 'Belum Diverifikasi'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      {profile.company_categories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Kategori Perusahaan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.company_categories.map(c => (
                <Badge key={c.id} variant="secondary">{c.category}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
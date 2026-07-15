import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Shield,
  Bell,
  Bot,
  Lock,
  Users,
  Server,
  MessageSquare,
  Mail,
  CheckCircle2,
  XCircle,
  Info,
  ArrowRight,
  Building2,
} from 'lucide-react'
import Link from 'next/link'
import { AISettingsForm } from '@/components/admin/ai-settings-form'

export default async function GeneralSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: university } = await supabase
    .from('universities')
    .select('id, name, short_name, city, province, website')
    .limit(1)
    .single()

  const { data: aiSettings } = await supabase
    .from('settings')
    .select('key, value')
    .eq('university_id', university?.id ?? '')
    .in('key', ['ai_api_key', 'ai_base_url', 'ai_model', 'ai_vision_api_key', 'ai_vision_base_url', 'ai_vision_model'])

  const aiMap = Object.fromEntries((aiSettings ?? []).map(r => [r.key, r.value]))
  const aiApiKeyConfigured = !!(aiMap['ai_api_key'])
  const aiBaseUrl = aiMap['ai_base_url'] ?? ''
  const aiModel = aiMap['ai_model'] ?? ''
  const aiVisionApiKeyConfigured = !!(aiMap['ai_vision_api_key'])
  const aiVisionBaseUrl = aiMap['ai_vision_base_url'] ?? ''
  const aiVisionModel = aiMap['ai_vision_model'] ?? ''

  const securityItems = [
    {
      icon: Lock,
      label: 'Autentikasi Supabase',
      desc: 'Login via email & password dengan enkripsi penuh',
      active: true,
    },
    {
      icon: Users,
      label: 'Role-based Access Control',
      desc: 'Admin, Dosen, Mahasiswa, Perusahaan',
      active: true,
    },
    {
      icon: Server,
      label: 'Session Management',
      desc: 'Server-side session via SSR — aman dari XSS',
      active: true,
    },
  ]

  const notificationItems = [
    {
      icon: MessageSquare,
      label: 'Notifikasi WhatsApp',
      desc: 'Via Fonnte API — kirim pesan langsung ke nomor HP mahasiswa',
      active: true,
      href: '/admin/settings',
      hrefLabel: 'Konfigurasi',
    },
    {
      icon: Mail,
      label: 'Notifikasi Email',
      desc: 'SMTP belum dikonfigurasi',
      active: false,
      href: null,
      hrefLabel: null,
    },
  ]

  return (
    <div className="flex flex-1 flex-col gap-8 px-4 py-6 md:px-6 lg:px-8 w-full">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Pengaturan Umum</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola informasi institusi dan konfigurasi platform Gradely
        </p>
      </div>

      {/* Informasi Institusi */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40">
              <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-base">Informasi Institusi</CardTitle>
              <CardDescription>Data institusi yang tampil di seluruh platform</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="uni_name">Nama Institusi</Label>
            <Input
              id="uni_name"
              defaultValue={university?.name ?? ''}
              placeholder="Institut Seni Indonesia Yogyakarta"
              disabled
              className="bg-muted/50"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="uni_short_name">Nama Singkat</Label>
              <Input
                id="uni_short_name"
                defaultValue={university?.short_name ?? ''}
                placeholder="ISI Yogyakarta"
                disabled
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uni_city">Kota</Label>
              <Input
                id="uni_city"
                defaultValue={university?.city ?? ''}
                placeholder="Yogyakarta"
                disabled
                className="bg-muted/50"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="uni_province">Provinsi</Label>
              <Input
                id="uni_province"
                defaultValue={university?.province ?? ''}
                placeholder="DI Yogyakarta"
                disabled
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uni_website">Website</Label>
              <Input
                id="uni_website"
                defaultValue={university?.website ?? ''}
                placeholder="https://isi.ac.id"
                disabled
                className="bg-muted/50"
              />
            </div>
          </div>
          <Alert variant="default" className="border-muted bg-muted/30">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs text-muted-foreground">
              Untuk mengubah data institusi, hubungi administrator database secara langsung.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Keamanan */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
              <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-base">Keamanan</CardTitle>
              <CardDescription>Status lapisan keamanan yang aktif di platform</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-0 pt-0">
          {securityItems.map((item, i) => (
            <div key={item.label}>
              <div className="flex items-center justify-between py-3 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-none">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 gap-1 text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Aktif
                </Badge>
              </div>
              {i < securityItems.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Notifikasi */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/40">
              <Bell className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <CardTitle className="text-base">Notifikasi</CardTitle>
              <CardDescription>Status dan konfigurasi saluran pengiriman notifikasi</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-0 pt-0">
          {notificationItems.map((item, i) => (
            <div key={item.label}>
              <div className="flex items-center justify-between py-3 gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-none">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {item.active ? (
                    <Badge
                      variant="outline"
                      className="gap-1 text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Aktif
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-muted-foreground">
                      <XCircle className="h-3 w-3" />
                      Nonaktif
                    </Badge>
                  )}
                  {item.href && (
                    <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" asChild>
                      <Link href={item.href}>
                        {item.hrefLabel}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
              {i < notificationItems.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI & Pembacaan Dokumen */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/40">
              <Bot className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-base">AI &amp; Pembacaan Dokumen</CardTitle>
              <CardDescription>
                Konfigurasi model AI untuk import KHS dan analisis akademik otomatis
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AISettingsForm
            universityId={university?.id ?? ''}
            defaultApiKey=""
            defaultBaseUrl={aiBaseUrl}
            defaultModel={aiModel}
            defaultVisionApiKey=""
            defaultVisionBaseUrl={aiVisionBaseUrl}
            defaultVisionModel={aiVisionModel}
            apiKeyConfigured={aiApiKeyConfigured}
            visionApiKeyConfigured={aiVisionApiKeyConfigured}
          />
        </CardContent>
      </Card>

    </div>
  )
}

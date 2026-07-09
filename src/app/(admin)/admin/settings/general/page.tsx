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
import { Settings, Globe, Shield, Bell } from 'lucide-react'
import Link from 'next/link'

export default async function GeneralSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: university } = await supabase
    .from('universities')
    .select('id, name, short_name, city, province, website')
    .limit(1)
    .single()

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Pengaturan Umum</h1>
          <p className="text-sm text-muted-foreground">
            Kelola informasi dan konfigurasi platform Gradely
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Globe className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Informasi Institusi</CardTitle>
                <CardDescription>Data institusi yang tampil di platform</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="uni_name">Nama Institusi</Label>
                <Input id="uni_name" defaultValue={university?.name ?? ''} placeholder="Institut Seni Indonesia Yogyakarta" disabled />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="uni_short_name">Nama Singkat</Label>
                  <Input id="uni_short_name" defaultValue={university?.short_name ?? ''} placeholder="ISI Yogyakarta" disabled />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uni_city">Kota</Label>
                  <Input id="uni_city" defaultValue={university?.city ?? ''} placeholder="Yogyakarta" disabled />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="uni_province">Provinsi</Label>
                <Input id="uni_province" defaultValue={university?.province ?? ''} placeholder="DI Yogyakarta" disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uni_website">Website</Label>
                <Input id="uni_website" defaultValue={university?.website ?? ''} placeholder="https://isi.ac.id" disabled />
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                Hubungi administrator database untuk mengubah data institusi.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Keamanan</CardTitle>
                <CardDescription>Pengaturan keamanan akses platform</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-0">
              {[
                { label: 'Autentikasi Supabase', desc: 'Login via email & password' },
                { label: 'Role-based Access Control', desc: 'Admin, Dosen, Mahasiswa, Perusahaan' },
                { label: 'Session Management', desc: 'Server-side session via SSR' },
              ].map((item, i, arr) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between py-3">
                    <div className="min-w-0 pr-4">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
                      Aktif
                    </Badge>
                  </div>
                  {i < arr.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Bell className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Notifikasi</CardTitle>
                <CardDescription>Konfigurasi pengiriman notifikasi sistem</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-0">
              {[
                { label: 'Notifikasi WhatsApp', desc: 'Via WAHA self-hosted', active: true, href: '/admin/settings' },
                { label: 'Notifikasi Email', desc: 'SMTP belum dikonfigurasi', active: false, href: null },
              ].map((item, i, arr) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between py-3 gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline" className={item.active ? 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800' : 'text-muted-foreground'}>
                        {item.active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                      {item.href && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                          <Link href={item.href}>
                            <Settings className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                  {i < arr.length - 1 && <Separator />}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

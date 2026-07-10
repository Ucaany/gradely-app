'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, XCircle, Send } from 'lucide-react'

import { wahaSettingsSchema, type WahaSettingsInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface Props {
  universityId: string
  defaultValues: WahaSettingsInput
}

export function WahaSettingsForm({ universityId, defaultValues }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [testPhone, setTestPhone] = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const [sendResult, setSendResult] = useState<'success' | 'error' | null>(null)

  const { register, handleSubmit, getValues, formState: { errors } } =
    useForm<WahaSettingsInput>({
      resolver: zodResolver(wahaSettingsSchema),
      defaultValues,
    })

  async function onSubmit(data: WahaSettingsInput) {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: data }),
        credentials: 'include',
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error ?? 'Gagal menyimpan konfigurasi')
        return
      }
      toast.success('Konfigurasi WAHA berhasil disimpan')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSendTest() {
    if (!testPhone.trim()) {
      toast.error('Isi nomor HP tujuan terlebih dahulu')
      return
    }
    setSendLoading(true)
    setSendResult(null)
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'test', university_id: universityId, phone: testPhone }),
        credentials: 'include',
      })
      const result = await res.json()
      if (result.success) {
        setSendResult('success')
        toast.success('Pesan test berhasil dikirim!')
      } else {
        setSendResult('error')
        toast.error(result.error ?? 'Gagal mengirim pesan test')
      }
    } finally {
      setSendLoading(false)
    }
  }

  async function handleTest() {
    const values = getValues()
    if (!values.waha_url || !values.waha_session) {
      toast.error('Isi WAHA URL dan Session Name terlebih dahulu')
      return
    }
    setTestLoading(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/admin/waha/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          waha_url: values.waha_url,
          waha_session: values.waha_session,
          waha_api_key: values.waha_api_key,
        }),
        credentials: 'include',
      })
      const result = await res.json()
      if (result.success) {
        setTestResult('success')
        toast.success('Koneksi WAHA berhasil!')
      } else {
        setTestResult('error')
        toast.error(result.error ?? 'Koneksi gagal')
      }
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Endpoint & Sesi</CardTitle>
          <CardDescription>
            Konfigurasi alamat server WAHA dan nama sesi WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="waha_url">
              WAHA URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="waha_url"
              placeholder="http://localhost:3000"
              disabled={isLoading}
              {...register('waha_url')}
            />
            {errors.waha_url && (
              <p className="text-xs text-destructive">{errors.waha_url.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              URL server WAHA self-hosted, contoh: http://192.168.1.10:3000
            </p>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="waha_session">
              Session Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="waha_session"
              placeholder="default"
              disabled={isLoading}
              {...register('waha_session')}
            />
            {errors.waha_session && (
              <p className="text-xs text-destructive">{errors.waha_session.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Nama sesi WhatsApp yang aktif di server WAHA
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Autentikasi</CardTitle>
          <CardDescription>
            API Key opsional untuk mengamankan akses ke server WAHA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="waha_api_key">API Key</Label>
            <Input
              id="waha_api_key"
              type="password"
              placeholder="Kosongkan jika tidak menggunakan autentikasi"
              disabled={isLoading}
              {...register('waha_api_key')}
            />
            <p className="text-xs text-muted-foreground">
              Opsional. Diisi jika server WAHA dikonfigurasi dengan API key.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Koneksi</CardTitle>
          <CardDescription>
            Uji koneksi ke server WAHA sebelum menyimpan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {testResult && (
            <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
              testResult === 'success'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                : 'border-destructive/30 bg-destructive/5 text-destructive'
            }`}>
              {testResult === 'success'
                ? <CheckCircle2 className="h-4 w-4 shrink-0" />
                : <XCircle className="h-4 w-4 shrink-0" />
              }
              <span>
                {testResult === 'success'
                  ? 'Koneksi berhasil. Server WAHA dapat dijangkau.'
                  : 'Koneksi gagal. Periksa URL dan session name.'}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={handleTest}
              disabled={testLoading || isLoading}
              className="w-full sm:w-auto"
            >
              {testLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {testLoading ? 'Menguji...' : 'Test Koneksi'}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Menyimpan...' : 'Simpan Konfigurasi'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kirim Pesan Test</CardTitle>
          <CardDescription>
            Kirim pesan WhatsApp percobaan ke nomor HP tertentu untuk memastikan pengiriman berjalan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test_phone">Nomor HP Tujuan</Label>
            <Input
              id="test_phone"
              placeholder="08123456789"
              value={testPhone}
              onChange={(e) => { setTestPhone(e.target.value); setSendResult(null) }}
              disabled={sendLoading}
            />
            <p className="text-xs text-muted-foreground">
              Format: 08xxx atau +628xxx. Pastikan nomor terdaftar di WhatsApp.
            </p>
          </div>

          {sendResult && (
            <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
              sendResult === 'success'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                : 'border-destructive/30 bg-destructive/5 text-destructive'
            }`}>
              {sendResult === 'success'
                ? <CheckCircle2 className="h-4 w-4 shrink-0" />
                : <XCircle className="h-4 w-4 shrink-0" />
              }
              <span>
                {sendResult === 'success'
                  ? 'Pesan berhasil dikirim ke nomor tujuan.'
                  : 'Gagal mengirim pesan. Pastikan WAHA aktif dan sesi terkoneksi.'}
              </span>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={handleSendTest}
            disabled={sendLoading || !testPhone.trim()}
            className="w-full sm:w-auto"
          >
            {sendLoading
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim...</>
              : <><Send className="mr-2 h-4 w-4" /> Kirim Pesan Test</>
            }
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, XCircle, Send } from 'lucide-react'

import { fonnteSettingsSchema, type FonnteSettingsInput } from '@/lib/validations'
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

interface Props {
  universityId: string
  defaultValues: FonnteSettingsInput
}

export function WahaSettingsForm({ universityId, defaultValues }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; device?: string } | null>(null)
  const [testPhone, setTestPhone] = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const [sendResult, setSendResult] = useState<'success' | 'error' | null>(null)

  const { register, handleSubmit, getValues, formState: { errors } } =
    useForm<FonnteSettingsInput>({
      resolver: zodResolver(fonnteSettingsSchema),
      defaultValues,
    })

  async function onSubmit(data: FonnteSettingsInput) {
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
      toast.success('Konfigurasi Fonnte berhasil disimpan')
      startTransition(() => router.refresh())
    } finally {
      setIsLoading(false)
    }
  }

  async function handleTest() {
    const values = getValues()
    if (!values.fonnte_token) {
      toast.error('Isi Token Fonnte terlebih dahulu')
      return
    }
    setTestLoading(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/admin/waha/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fonnte_token: values.fonnte_token }),
        credentials: 'include',
      })
      const result = await res.json()
      if (result.success) {
        setTestResult({ success: true, device: result.data?.device })
        toast.success('Token Fonnte valid!')
      } else {
        setTestResult({ success: false })
        toast.error(result.error ?? 'Token tidak valid')
      }
    } finally {
      setTestLoading(false)
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Token Fonnte</CardTitle>
          <CardDescription>
            Token API dari akun Fonnte untuk mengirim pesan WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fonnte_token">
              Token <span className="text-destructive">*</span>
            </Label>
            <Input
              id="fonnte_token"
              type="password"
              placeholder="Token dari dashboard Fonnte"
              disabled={isLoading}
              {...register('fonnte_token')}
            />
            {errors.fonnte_token && (
              <p className="text-xs text-destructive">{errors.fonnte_token.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Dapatkan token di <span className="font-medium">fonnte.com → Device → Token</span>
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Validasi Token</CardTitle>
          <CardDescription>
            Uji token Fonnte sebelum menyimpan
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {testResult && (
            <div className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
              testResult.success
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                : 'border-destructive/30 bg-destructive/5 text-destructive'
            }`}>
              {testResult.success
                ? <CheckCircle2 className="h-4 w-4 shrink-0" />
                : <XCircle className="h-4 w-4 shrink-0" />
              }
              <span>
                {testResult.success
                  ? `Token valid.${testResult.device ? ` Device: ${testResult.device}` : ''}`
                  : 'Token tidak valid. Periksa kembali token Fonnte Anda.'}
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
              {testLoading ? 'Memvalidasi...' : 'Validasi Token'}
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
            Kirim pesan WhatsApp percobaan ke nomor HP tertentu
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
                  : 'Gagal mengirim pesan. Pastikan token valid dan device Fonnte aktif.'}
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

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface Props {
  universityId: string
  isConfigured: boolean
}

export function GeminiSettingsForm({ universityId, isConfigured }: Props) {
  const router = useRouter()
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)

  async function handleSave() {
    if (!apiKey.trim()) {
      toast.error('Masukkan Gemini API key terlebih dahulu')
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: { gemini_api_key: apiKey.trim() },
        }),
        credentials: 'include',
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error ?? 'Gagal menyimpan API key')
        return
      }
      toast.success('Gemini API key berhasil disimpan')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  async function handleTest() {
    if (!apiKey.trim()) {
      toast.error('Masukkan API key terlebih dahulu')
      return
    }
    setTestLoading(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/admin/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey.trim(),
          base_url: 'https://generativelanguage.googleapis.com/v1beta',
          model: 'gemini-2.0-flash',
          type: 'gemini',
        }),
        credentials: 'include',
      })
      if (res.ok) {
        setTestResult('success')
        toast.success('API key valid! Gemini dapat dijangkau.')
      } else {
        setTestResult('error')
        toast.error('API key tidak valid atau tidak memiliki akses.')
      }
    } catch {
      setTestResult('error')
      toast.error('Gagal menghubungi server.')
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="gemini_api_key">Gemini API Key</Label>
        <div className="relative">
          <Input
            id="gemini_api_key"
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); setTestResult(null) }}
            placeholder="AIza..."
            disabled={isLoading}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowKey(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Dapatkan API key di{' '}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            Google AI Studio
          </a>
          . Digunakan untuk membaca dokumen KHS yang diunggah mahasiswa.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Badge
          variant="outline"
          className={
            isConfigured
              ? 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
              : 'text-muted-foreground'
          }
        >
          {isConfigured ? 'Terkonfigurasi' : 'Belum dikonfigurasi'}
        </Badge>
      </div>

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
              ? 'API key valid. Gemini siap digunakan.'
              : 'API key tidak valid atau tidak memiliki akses ke Gemini.'}
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={handleTest}
          disabled={testLoading || isLoading}
        >
          {testLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {testLoading ? 'Menguji...' : 'Test API Key'}
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isLoading}
        >
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Menyimpan...' : 'Simpan API Key'}
        </Button>
      </div>
    </div>
  )
}

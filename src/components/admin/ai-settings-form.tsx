'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff, Sparkles, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface Props {
  universityId: string
  defaultApiKey: string
  defaultBaseUrl: string
  defaultModel: string
  defaultVisionApiKey: string
  defaultVisionBaseUrl: string
  defaultVisionModel: string
  apiKeyConfigured?: boolean
  visionApiKeyConfigured?: boolean
}

function validateUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw)
    if (parsed.protocol !== 'https:') return false
    const h = parsed.hostname
    if (
      h === 'localhost' ||
      /^127\./.test(h) ||
      /^10\./.test(h) ||
      /^192\.168\./.test(h) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
      h === '169.254.169.254' ||
      h.endsWith('.internal') ||
      h.endsWith('.local')
    ) return false
    return true
  } catch {
    return false
  }
}

function AIConfigSection({
  title,
  description,
  icon: Icon,
  configType,
  universityId: _universityId, // eslint-disable-line @typescript-eslint/no-unused-vars
  defaultApiKey,
  defaultBaseUrl,
  defaultModel,
  apiKeyPlaceholder,
  modelPlaceholder,
  isConfigured,
  router,
}: {
  title: string
  description: string
  icon: React.ElementType
  configType: 'text' | 'vision'
  universityId: string
  defaultApiKey: string
  defaultBaseUrl: string
  defaultModel: string
  apiKeyPlaceholder: string
  modelPlaceholder: string
  isConfigured: boolean
  router: ReturnType<typeof useRouter>
}) {
  const keyPrefix = configType === 'vision' ? 'ai_vision_' : 'ai_'
  const [apiKey, setApiKey] = useState(defaultApiKey)
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl || 'https://9prxy.sribuai.my.id/v1')
  const [model, setModel] = useState(defaultModel || (configType === 'vision' ? 'kr/auto' : 'kr/auto'))
  const [showKey, setShowKey] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [testLoading, setTestLoading] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  async function handleSave() {
    if (!apiKey.trim() && !isConfigured) {
      toast.error('Masukkan API key terlebih dahulu')
      return
    }
    if (!validateUrl(baseUrl.trim())) {
      toast.error('Base URL tidak valid. Gunakan HTTPS dengan domain publik.')
      return
    }
    setIsLoading(true)
    try {
      const settingsPayload: Record<string, string> = {
        [`${keyPrefix}base_url`]: baseUrl.trim(),
        [`${keyPrefix}model`]: model.trim(),
      }
      if (apiKey.trim()) {
        settingsPayload[`${keyPrefix}api_key`] = apiKey.trim()
      }
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsPayload }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error ?? 'Gagal menyimpan konfigurasi')
        return
      }
      toast.success(`Konfigurasi ${title} berhasil disimpan`)
      // Soft refresh: update server state tanpa full page reload
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  async function handleTest() {
    if (!apiKey.trim() && !isConfigured) {
      toast.error('Masukkan API key terlebih dahulu')
      return
    }
    if (!validateUrl(baseUrl.trim())) {
      toast.error('Base URL tidak valid. Gunakan HTTPS dengan domain publik.')
      return
    }
    setTestLoading(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/admin/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: apiKey.trim() || null,
          base_url: baseUrl.trim(),
          model: model.trim(),
          config_type: configType,
        }),
      })
      const result = await res.json()
      if (res.ok) {
        setTestResult({ ok: true, message: 'Koneksi berhasil. Model siap digunakan.' })
        toast.success('Koneksi berhasil! Model dapat dijangkau.')
      } else {
        const errMsg = result.error ?? 'Koneksi gagal. Periksa API key dan Base URL.'
        setTestResult({ ok: false, message: errMsg })
        toast.error(errMsg)
      }
    } catch {
      const errMsg = 'Gagal menghubungi server. Periksa koneksi internet.'
      setTestResult({ ok: false, message: errMsg })
      toast.error(errMsg)
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="space-y-3 pl-6">
        <div className="space-y-2">
          <Label htmlFor={`${keyPrefix}api_key`}>API Key</Label>
          <div className="relative">
            <Input
              id={`${keyPrefix}api_key`}
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => { setApiKey(e.target.value); setTestResult(null) }}
              placeholder={apiKeyPlaceholder}
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
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${keyPrefix}base_url`}>Base URL</Label>
          <Input
            id={`${keyPrefix}base_url`}
            type="text"
            value={baseUrl}
            onChange={(e) => { setBaseUrl(e.target.value); setTestResult(null) }}
            placeholder="https://9prxy.sribuai.my.id/v1"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Endpoint OpenAI-compatible. Harus HTTPS dengan domain publik. Sertakan path <span className="font-medium text-foreground">/v1</span> jika diperlukan, contoh: <span className="font-medium text-foreground">https://ai.sumopod.com/v1</span>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${keyPrefix}model`}>Model</Label>
          <Input
            id={`${keyPrefix}model`}
            type="text"
            value={model}
            onChange={(e) => { setModel(e.target.value); setTestResult(null) }}
            placeholder={modelPlaceholder}
            disabled={isLoading}
          />
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
            testResult.ok
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
              : 'border-destructive/30 bg-destructive/5 text-destructive'
          }`}>
            {testResult.ok
              ? <CheckCircle2 className="h-4 w-4 shrink-0" />
              : <XCircle className="h-4 w-4 shrink-0" />
            }
            <span>{testResult.message}</span>
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
            {testLoading ? 'Menguji...' : 'Test Koneksi'}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AISettingsForm({
  universityId,
  defaultApiKey,
  defaultBaseUrl,
  defaultModel,
  defaultVisionApiKey,
  defaultVisionBaseUrl,
  defaultVisionModel,
  apiKeyConfigured = false,
  visionApiKeyConfigured = false,
}: Props) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <AIConfigSection
        title="Model Text"
        description="Untuk analisis target kelulusan dan pesan notifikasi otomatis"
        icon={Sparkles}
        configType="text"
        universityId={universityId}
        defaultApiKey={defaultApiKey}
        defaultBaseUrl={defaultBaseUrl}
        defaultModel={defaultModel}
        apiKeyPlaceholder="sk-..."
        modelPlaceholder="kr/auto"
        isConfigured={apiKeyConfigured}
        router={router}
      />

      <Separator />

      <AIConfigSection
        title="Model Vision"
        description="Untuk membaca dan mengekstrak data dari dokumen KHS mahasiswa (harus support image/PDF)"
        icon={FileText}
        configType="vision"
        universityId={universityId}
        defaultApiKey={defaultVisionApiKey}
        defaultBaseUrl={defaultVisionBaseUrl}
        defaultModel={defaultVisionModel}
        apiKeyPlaceholder="sk-..."
        modelPlaceholder="kr/auto"
        isConfigured={visionApiKeyConfigured}
        router={router}
      />
    </div>
  )
}

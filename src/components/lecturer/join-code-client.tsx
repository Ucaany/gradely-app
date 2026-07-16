'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, RefreshCw, Check } from 'lucide-react'
import { toast } from 'sonner'

interface JoinCodeClientProps {
  initialCode: string | null
  lecturerId: string
}

export function JoinCodeClient({ initialCode }: JoinCodeClientProps) {
  const [code, setCode] = useState(initialCode)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function generateCode() {
    setLoading(true)
    try {
      const res = await fetch('/api/lecturer/join-code', { method: 'POST' })
      const json = await res.json()
      if (!res.ok || !json.success) {
        toast.error(json.error ?? 'Gagal membuat kode bergabung')
      } else {
        setCode(json.data.join_code)
        toast.success('Kode bergabung berhasil dibuat')
      }
    } catch {
      toast.error('Gagal membuat kode bergabung')
    } finally {
      setLoading(false)
    }
  }

  async function copyCode() {
    if (!code) return
    await navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Kode disalin ke clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      {code ? (
        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={code}
            className="font-mono text-2xl tracking-widest text-center h-14 text-lg font-bold"
          />
          <Button variant="outline" size="icon" className="h-14 w-14 shrink-0" onClick={copyCode}>
            {copied ? <Check className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/30 py-8 text-center">
          <p className="text-sm text-muted-foreground">Belum ada kode bergabung aktif</p>
        </div>
      )}

      <Button onClick={generateCode} disabled={loading} className="w-full" variant={code ? 'outline' : 'default'}>
        {loading ? (
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4 mr-2" />
        )}
        {code ? 'Buat Ulang Kode' : 'Buat Kode Bergabung'}
      </Button>
    </div>
  )
}

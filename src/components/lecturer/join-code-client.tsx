'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, RefreshCw, Check } from 'lucide-react'
import { toast } from 'sonner'

interface JoinCodeClientProps {
  initialCode: string | null
  lecturerId: string
}

export function JoinCodeClient({ initialCode, lecturerId }: JoinCodeClientProps) {
  const [code, setCode] = useState(initialCode)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()

  async function generateCode() {
    setLoading(true)
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    const { error } = await supabase
      .from('advisor_students')
      .update({ join_code: newCode })
      .eq('lecturer_id', lecturerId)

    if (error) {
      toast.error('Gagal membuat kode bergabung')
    } else {
      setCode(newCode)
      toast.success('Kode bergabung berhasil dibuat')
    }
    setLoading(false)
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

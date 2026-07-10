'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Loader2, Send, Sparkles, Phone } from 'lucide-react'

interface SendLecturerDialogProps {
  lecturerId: string
  lecturerName: string
  lecturerPhone: string | null
  adviseeCount: number
  trigger?: React.ReactNode
}

export function SendLecturerDialog({
  lecturerId,
  lecturerName,
  lecturerPhone,
  adviseeCount,
  trigger,
}: SendLecturerDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [generated, setGenerated] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    setMessage('')
    setGenerated(false)
    try {
      const res = await fetch('/api/admin/send-message-lecturer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lecturer_id: lecturerId, preview_only: true }),
      })
      const result = await res.json()
      if (!result.success) {
        toast.error(result.error ?? 'Gagal generate pesan')
        return
      }
      setMessage(result.data.message)
      setGenerated(true)
    } catch {
      toast.error('Gagal menghubungi server')
    } finally {
      setLoading(false)
    }
  }

  async function handleSend() {
    if (!message.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/admin/send-message-lecturer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lecturer_id: lecturerId }),
      })
      const result = await res.json()
      if (!result.success) {
        toast.error(result.error ?? 'Gagal mengirim pesan')
        return
      }
      toast.success(`Laporan berhasil dikirim ke ${lecturerName}`)
      setOpen(false)
      setMessage('')
      setGenerated(false)
    } catch {
      toast.error('Gagal menghubungi server')
    } finally {
      setSending(false)
    }
  }

  function handleOpenChange(val: boolean) {
    setOpen(val)
    if (!val) {
      setMessage('')
      setGenerated(false)
    }
  }

  const noPhone = !lecturerPhone || lecturerPhone.trim() === ''

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Kirim Laporan WA
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Kirim Laporan ke Dosen Wali</DialogTitle>
          <DialogDescription>
            Laporan kondisi akademik {adviseeCount} mahasiswa bimbingan <strong>{lecturerName}</strong> akan di-generate AI dan dikirim via WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {noPhone ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-4 flex items-start gap-3">
              <Phone className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
              <div>
                <p className="text-sm font-semibold text-destructive">Nomor HP belum diisi</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Dosen {lecturerName} belum mengisi nomor HP di profil. Minta dosen untuk mengisi nomor HP terlebih dahulu agar pesan dapat dikirim.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span>Akan dikirim ke: <strong className="text-foreground">{lecturerPhone}</strong></span>
              </div>

              {!generated && (
                <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 px-4 py-5 flex flex-col items-center gap-3 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Generate Laporan dengan AI</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      AI akan membuat laporan lengkap kondisi akademik semua mahasiswa bimbingan {lecturerName} beserta rekomendasi tindakan.
                    </p>
                  </div>
                  <Button onClick={handleGenerate} disabled={loading} size="sm">
                    {loading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="h-4 w-4 mr-2" /> Generate Laporan</>
                    )}
                  </Button>
                </div>
              )}

              {generated && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Preview Pesan</p>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={handleGenerate} disabled={loading}>
                      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                      Regenerate
                    </Button>
                  </div>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={12}
                    className="text-sm resize-none font-mono"
                  />
                  <p className="text-xs text-muted-foreground">Pesan dapat diedit sebelum dikirim.</p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Batal</Button>
          {generated && !noPhone && (
            <Button onClick={handleSend} disabled={sending || !message.trim()}>
              {sending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Mengirim...</>
              ) : (
                <><Send className="h-4 w-4 mr-2" /> Kirim via WhatsApp</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

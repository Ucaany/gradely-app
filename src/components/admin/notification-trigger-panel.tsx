'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Send, CalendarClock, Users, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface Props {
  universityId: string
  eligibleStudentCount: number
}

interface SendResult {
  sent: number
  failed: number
}

export function NotificationTriggerPanel({ universityId, eligibleStudentCount }: Props) {
  const [reminderLoading, setReminderLoading] = useState(false)
  const [reminderResult, setReminderResult] = useState<SendResult | null>(null)

  async function handleSemesterReminder() {
    setReminderLoading(true)
    setReminderResult(null)
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'semester_reminder',
          university_id: universityId,
        }),
        credentials: 'include',
      })
      const result = await res.json()
      if (result.success) {
        setReminderResult(result.data)
        toast.success(`Pengingat terkirim: ${result.data.sent} berhasil, ${result.data.failed} gagal`)
      } else {
        toast.error(result.error ?? 'Gagal mengirim pengingat')
      }
    } finally {
      setReminderLoading(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Pengingat Akademik */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40">
                <CalendarClock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-base">Pengingat Akademik</CardTitle>
                <CardDescription className="mt-0.5">
                  Kirim pengingat ke semua mahasiswa aktif
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2.5">
            <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{eligibleStudentCount}</span> mahasiswa aktif dengan nomor HP terdaftar
            </span>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            Sistem akan mengirim notifikasi WhatsApp + inbox ke seluruh mahasiswa aktif yang memiliki nomor HP terdaftar.
            Setiap mahasiswa menerima pengingat sesuai semester aktif masing-masing.
          </p>

          {reminderResult && (
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${
              reminderResult.failed === 0
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
            }`}>
              {reminderResult.failed === 0
                ? <CheckCircle2 className="h-4 w-4 shrink-0" />
                : <XCircle className="h-4 w-4 shrink-0" />
              }
              <span>
                {reminderResult.sent} berhasil dikirim
                {reminderResult.failed > 0 && `, ${reminderResult.failed} gagal`}
              </span>
            </div>
          )}

          <Button
            onClick={handleSemesterReminder}
            disabled={reminderLoading || eligibleStudentCount === 0}
            className="w-full sm:w-auto"
          >
            {reminderLoading
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengirim...</>
              : <><Send className="mr-2 h-4 w-4" /> Kirim Pengingat Akademik</>
            }
          </Button>
        </CardContent>
      </Card>

      {/* Catatan Panduan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Panduan Penggunaan</CardTitle>
          <CardDescription>Informasi penting sebelum mengirim notifikasi</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">1</Badge>
              Notifikasi dikirim ke semua mahasiswa aktif — setiap mahasiswa menerima pesan sesuai semester aktif masing-masing secara otomatis.
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">2</Badge>
              Hanya mahasiswa dengan nomor HP terdaftar yang akan menerima WhatsApp. Semua mahasiswa aktif menerima notifikasi inbox.
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">3</Badge>
              Riwayat pengiriman WhatsApp dapat dilihat di <span className="font-medium text-foreground">Dashboard Admin → Riwayat Pesan</span>.
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">4</Badge>
              Pastikan konfigurasi Fonnte sudah benar sebelum mengirim. Cek di <span className="font-medium text-foreground">Konfigurasi Fonnte</span>.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

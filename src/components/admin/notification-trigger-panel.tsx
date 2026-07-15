'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Send, AlertTriangle, CalendarClock, Users, CheckCircle2, XCircle } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface Props {
  universityId: string
  eligibleStudentCount: number
}

interface SendResult {
  sent: number
  failed: number
}

export function NotificationTriggerPanel({ universityId, eligibleStudentCount }: Props) {
  const [warningLoading, setWarningLoading] = useState(false)
  const [warningResult, setWarningResult] = useState<SendResult | null>(null)

  const [reminderLoading, setReminderLoading] = useState(false)
  const [reminderResult, setReminderResult] = useState<SendResult | null>(null)
  const [semester, setSemester] = useState('')
  const [academicYear, setAcademicYear] = useState('')

  async function handleAcademicWarning() {
    setWarningLoading(true)
    setWarningResult(null)
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'academic_warning', university_id: universityId }),
        credentials: 'include',
      })
      const result = await res.json()
      if (result.success) {
        setWarningResult(result.data)
        toast.success(`Notifikasi terkirim: ${result.data.sent} berhasil, ${result.data.failed} gagal`)
      } else {
        toast.error(result.error ?? 'Gagal mengirim notifikasi')
      }
    } finally {
      setWarningLoading(false)
    }
  }

  async function handleSemesterReminder() {
    if (!semester || !academicYear) {
      toast.error('Isi semester dan tahun ajaran terlebih dahulu')
      return
    }
    setReminderLoading(true)
    setReminderResult(null)
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'semester_reminder',
          university_id: universityId,
          semester: Number(semester),
          academic_year: academicYear,
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
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/40">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle className="text-base">Peringatan Akademik</CardTitle>
                <CardDescription className="mt-0.5">
                  Kirim peringatan ke mahasiswa dengan IPK &lt; 2.0
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
            Sistem akan menghitung IPK setiap mahasiswa aktif dan mengirim notifikasi WhatsApp + inbox hanya kepada mahasiswa yang IPK-nya di bawah 2.0.
          </p>

          {warningResult && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Terkirim</p>
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{warningResult.sent}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40 px-3 py-2">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Gagal</p>
                    <p className="text-lg font-bold text-red-700 dark:text-red-400">{warningResult.failed}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          <Button
            onClick={handleAcademicWarning}
            disabled={warningLoading}
            className="w-full"
            variant="destructive"
          >
            {warningLoading
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mengirim...</>
              : <><Send className="mr-2 h-4 w-4" />Kirim Peringatan Akademik</>
            }
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950/40">
              <CalendarClock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-base">Pengingat Semester</CardTitle>
              <CardDescription className="mt-0.5">
                Kirim pengingat awal semester ke semua mahasiswa aktif
              </CardDescription>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="semester">Semester</Label>
              <Input
                id="semester"
                type="number"
                min={1}
                max={14}
                placeholder="contoh: 3"
                value={semester}
                onChange={(e) => { setSemester(e.target.value); setReminderResult(null) }}
                disabled={reminderLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="academic_year">Tahun Ajaran</Label>
              <Input
                id="academic_year"
                placeholder="2024/2025"
                value={academicYear}
                onChange={(e) => { setAcademicYear(e.target.value); setReminderResult(null) }}
                disabled={reminderLoading}
              />
            </div>
          </div>

          {reminderResult && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/40 px-3 py-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Terkirim</p>
                    <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{reminderResult.sent}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40 px-3 py-2">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Gagal</p>
                    <p className="text-lg font-bold text-red-700 dark:text-red-400">{reminderResult.failed}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          <Button
            onClick={handleSemesterReminder}
            disabled={reminderLoading || !semester || !academicYear}
            className="w-full"
          >
            {reminderLoading
              ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mengirim...</>
              : <><Send className="mr-2 h-4 w-4" />Kirim Pengingat Semester</>
            }
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Catatan Pengiriman</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">1</Badge>
              Notifikasi dikirim via WhatsApp (Fonnte) <span className="font-medium text-foreground">dan</span> masuk ke inbox mahasiswa di aplikasi.
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
              Pastikan konfigurasi WAHA sudah benar sebelum mengirim. Cek di <span className="font-medium text-foreground">Konfigurasi WAHA</span>.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

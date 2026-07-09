'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Loader2, Target, TrendingUp, BookOpen, GraduationCap, CheckCircle2, AlertTriangle, AlertOctagon, XCircle } from 'lucide-react'
import { studentTargetSchema, type StudentTargetInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { formatGPA } from '@/lib/utils'
import { ACADEMIC_STATUS_CONFIG } from '@/lib/utils/academic'
import type { AcademicSummary, StudentTarget, AcademicRule } from '@/types'

interface SummaryData {
  summary: AcademicSummary
  target: StudentTarget | null
  rule: AcademicRule
}

export default function StudentTargetPage() {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<StudentTargetInput>({
    resolver: zodResolver(studentTargetSchema),
    defaultValues: {
      target_semester: 8,
      career_goal: '',
      notes: '',
    },
  })

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        const res = await fetch('/api/student/summary')
        const result = await res.json()
        if (result.success && result.data) {
          setSummaryData(result.data)
          if (result.data.target) {
            form.reset({
              target_semester: result.data.target.target_semester,
              career_goal: result.data.target.career_goal ?? '',
              notes: result.data.target.notes ?? '',
            })
          }
        }
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [form])

  async function onSubmit(data: StudentTargetInput) {
    setIsSaving(true)
    try {
      const res = await fetch('/api/student/target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error ?? 'Gagal menyimpan target')
        return
      }
      toast.success('Target kelulusan berhasil disimpan')
      // Refresh data
      const refreshRes = await fetch('/api/student/summary')
      const refreshResult = await refreshRes.json()
      if (refreshResult.success) setSummaryData(refreshResult.data)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const summary = summaryData?.summary
  const rule = summaryData?.rule
  const watchedTarget = form.watch('target_semester')

  const sksPerSemRemaining = summary && watchedTarget > (summary.current_semester ?? 1)
    ? Math.ceil(
        (summary.total_sks_required - summary.total_sks_earned) /
        (watchedTarget - summary.current_semester)
      )
    : null

  const willMeetTarget = summary
    ? summary.predicted_graduation_semester <= watchedTarget
    : null

  const statusConfig = summary ? ACADEMIC_STATUS_CONFIG[summary.academic_status] : null

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Target Kelulusan</h1>
        <p className="text-sm text-muted-foreground">
          Atur target semester kelulusan dan pantau progres kamu
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form target */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Atur Target
            </CardTitle>
            <CardDescription>
              Pilih semester target kelulusan dan tambahkan catatan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="target_semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Semester Lulus <span className="text-destructive">*</span></FormLabel>
                      <Select
                        value={String(field.value)}
                        onValueChange={(v) => field.onChange(Number(v))}
                        disabled={isSaving}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih target semester" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 8 }, (_, i) => i + 7).map((sem) => (
                            <SelectItem key={sem} value={String(sem)}>
                              Semester {sem}
                              {sem === 8 && ' (Normal)'}
                              {sem === 7 && ' (Lebih Cepat)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="career_goal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Karier</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Misal: UI/UX Designer di startup teknologi"
                          disabled={isSaving}
                          className="resize-none"
                          rows={2}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catatan</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Catatan tambahan..."
                          disabled={isSaving}
                          className="resize-none"
                          rows={2}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSaving ? 'Menyimpan...' : 'Simpan Target'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Ringkasan & Prediksi */}
        <div className="flex flex-col gap-4">
          {/* Status akademik */}
          {statusConfig && summary && (
            <div className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${statusConfig.bgColor}`}>
              <span className={`shrink-0 ${statusConfig.iconColor}`}>
                {statusConfig.icon === 'TrendingUp' && <TrendingUp className="h-5 w-5" />}
                {statusConfig.icon === 'CheckCircle2' && <CheckCircle2 className="h-5 w-5" />}
                {statusConfig.icon === 'AlertTriangle' && <AlertTriangle className="h-5 w-5" />}
                {statusConfig.icon === 'AlertOctagon' && <AlertOctagon className="h-5 w-5" />}
                {statusConfig.icon === 'XCircle' && <XCircle className="h-5 w-5" />}
              </span>
              <div>
                <p className={`font-semibold text-sm ${statusConfig.color}`}>
                  Status: {statusConfig.label}
                </p>
                <p className="text-xs text-muted-foreground">Semester {summary.current_semester} aktif</p>
              </div>
            </div>
          )}

          {/* Progress SKS */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Progress SKS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {summary?.total_sks_earned ?? 0} / {summary?.total_sks_required ?? (rule?.total_sks_graduation ?? 144)} SKS
                </span>
                <span className="font-medium">{summary?.sks_percentage ?? 0}%</span>
              </div>
              <Progress value={summary?.sks_percentage ?? 0} className="h-3" />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded bg-muted p-2">
                  <p className="text-xs text-muted-foreground">SKS Tersisa</p>
                  <p className="font-semibold">{(summary?.total_sks_required ?? 144) - (summary?.total_sks_earned ?? 0)}</p>
                </div>
                <div className="rounded bg-muted p-2">
                  <p className="text-xs text-muted-foreground">SKS/Semester (target)</p>
                  <p className="font-semibold">{sksPerSemRemaining ?? '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prediksi */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Prediksi Kelulusan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Prediksi lulus</p>
                  <p className="text-2xl font-bold">Semester {summary?.predicted_graduation_semester ?? '-'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Target kamu</p>
                  <p className="text-2xl font-bold">Semester {watchedTarget}</p>
                </div>
              </div>
              {willMeetTarget !== null && (
                <Badge
                  variant="outline"
                  className={`w-full justify-center py-1.5 text-sm ${
                    willMeetTarget
                      ? 'text-green-700 border-green-300 bg-green-50 dark:bg-green-950 dark:text-green-400'
                      : 'text-red-700 border-red-300 bg-red-50 dark:bg-red-950 dark:text-red-400'
                  }`}
                >
                  {willMeetTarget
                    ? '✅ Kamu diprediksi lulus sesuai target'
                    : '⚠️ Perlu tambah SKS per semester untuk capai target'}
                </Badge>
              )}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded bg-muted p-2">
                  <p className="text-xs text-muted-foreground">IPK saat ini</p>
                  <p className="font-semibold">{formatGPA(summary?.gpa ?? 0)}</p>
                </div>
                <div className="rounded bg-muted p-2">
                  <p className="text-xs text-muted-foreground">IPS terakhir</p>
                  <p className="font-semibold">{formatGPA(summary?.last_gpa ?? 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info aturan akademik */}
          {rule && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Aturan Akademik
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Total SKS Kelulusan</p>
                    <p className="font-medium">{rule.total_sks_graduation} SKS</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Semester Normal</p>
                    <p className="font-medium">Semester {rule.normal_semester}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">IPK Minimum</p>
                    <p className="font-medium">{rule.min_gpa.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Maks Semester</p>
                    <p className="font-medium">Semester {rule.max_semester}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

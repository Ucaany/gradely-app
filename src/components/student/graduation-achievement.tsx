'use client'

import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Trophy, Plus, X, Save, Loader2, Star, BookOpen,
  Briefcase, GraduationCap, Award, Target, CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Separator } from '@/components/ui/separator'

const achievementSchema = z.object({
  achievement_title: z.string().min(2, 'Judul minimal 2 karakter').max(200).optional().nullable(),
  achievement_description: z.string().max(1000).optional().nullable(),
  achievement_ipk_target: z.number().min(0).max(4).optional().nullable(),
  achievement_sks_target: z.number().int().min(0).max(300).optional().nullable(),
  achievement_semester_target: z.number().int().min(1).max(14).optional().nullable(),
  achievement_skills: z.array(z.object({ value: z.string().max(100) })).optional(),
  achievement_certificates: z.array(z.object({ value: z.string().max(200) })).optional(),
  achievement_internship: z.string().max(300).optional().nullable(),
  achievement_thesis_topic: z.string().max(300).optional().nullable(),
})

type AchievementFormValues = z.infer<typeof achievementSchema>

interface AchievementData {
  achievement_title: string | null
  achievement_description: string | null
  achievement_ipk_target: number | null
  achievement_sks_target: number | null
  achievement_semester_target: number | null
  achievement_skills: string[] | null
  achievement_certificates: string[] | null
  achievement_internship: string | null
  achievement_thesis_topic: string | null
  achievement_updated_at: string | null
}

export function GraduationAchievementForm({ onSaved }: { onSaved?: () => void }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasTarget, setHasTarget] = useState(true)

  const form = useForm<AchievementFormValues>({
    resolver: zodResolver(achievementSchema),
    defaultValues: {
      achievement_title: '',
      achievement_description: '',
      achievement_ipk_target: null,
      achievement_sks_target: null,
      achievement_semester_target: null,
      achievement_skills: [],
      achievement_certificates: [],
      achievement_internship: '',
      achievement_thesis_topic: '',
    },
  })

  const skillsArray = useFieldArray({ control: form.control, name: 'achievement_skills' })
  const certsArray = useFieldArray({ control: form.control, name: 'achievement_certificates' })

  useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const res = await fetch('/api/student/achievement')
        const result = await res.json()
        if (result.success && result.data) {
          const d = result.data as AchievementData
          form.reset({
            achievement_title: d.achievement_title ?? '',
            achievement_description: d.achievement_description ?? '',
            achievement_ipk_target: d.achievement_ipk_target ?? null,
            achievement_sks_target: d.achievement_sks_target ?? null,
            achievement_semester_target: d.achievement_semester_target ?? null,
            achievement_skills: (d.achievement_skills ?? []).map((v) => ({ value: v })),
            achievement_certificates: (d.achievement_certificates ?? []).map((v) => ({ value: v })),
            achievement_internship: d.achievement_internship ?? '',
            achievement_thesis_topic: d.achievement_thesis_topic ?? '',
          })
        } else if (result.error?.includes('target kelulusan')) {
          setHasTarget(false)
        }
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [form])

  async function onSubmit(data: AchievementFormValues) {
    setIsSaving(true)
    try {
      const payload = {
        ...data,
        achievement_skills: data.achievement_skills?.map((s) => s.value).filter(Boolean) ?? [],
        achievement_certificates: data.achievement_certificates?.map((c) => c.value).filter(Boolean) ?? [],
        achievement_ipk_target: data.achievement_ipk_target ?? null,
        achievement_sks_target: data.achievement_sks_target ?? null,
        achievement_semester_target: data.achievement_semester_target ?? null,
        achievement_title: data.achievement_title || null,
        achievement_description: data.achievement_description || null,
        achievement_internship: data.achievement_internship || null,
        achievement_thesis_topic: data.achievement_thesis_topic || null,
      }
      const res = await fetch('/api/student/achievement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error ?? 'Gagal menyimpan capaian')
        return
      }
      toast.success('Capaian target berhasil disimpan')
      onSaved?.()
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!hasTarget) {
    return (
      <div className="rounded-xl border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30 dark:border-yellow-800 px-4 py-4 flex items-start gap-3">
        <Target className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Target belum diset</p>
          <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
            Atur target kelulusan terlebih dahulu menggunakan form Analisis di atas, lalu simpan untuk mengisi capaian.
          </p>
        </div>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Judul capaian */}
        <FormField
          control={form.control}
          name="achievement_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5 text-sm">
                <Trophy className="h-3.5 w-3.5 text-yellow-500" />
                Judul Capaian Target
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="cth: Lulus Cum Laude Tepat Waktu dengan Bekal Karier"
                  className="h-9 text-sm"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Deskripsi */}
        <FormField
          control={form.control}
          name="achievement_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Deskripsi Capaian</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Ceritakan apa yang ingin kamu capai selama kuliah hingga lulus..."
                  className="text-sm min-h-[80px] resize-none"
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* Targets numerik */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5" />
            Target Capaian Akademik
          </p>
          <div className="grid grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="achievement_ipk_target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Target IPK</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0} max={4} step={0.01}
                      placeholder="3.50"
                      className="h-9 text-sm"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="achievement_sks_target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Target SKS Lulus</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0} max={300}
                      placeholder="144"
                      className="h-9 text-sm"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="achievement_semester_target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Sem. Lulus</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1} max={14}
                      placeholder="8"
                      className="h-9 text-sm"
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Skills */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Skill yang Ingin Dikuasai
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => skillsArray.append({ value: '' })}
            >
              <Plus className="h-3 w-3 mr-1" />
              Tambah
            </Button>
          </div>
          <div className="space-y-2">
            {skillsArray.fields.map((field, idx) => (
              <div key={field.id} className="flex gap-2">
                <FormField
                  control={form.control}
                  name={`achievement_skills.${idx}.value`}
                  render={({ field: f }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder={`cth: UI/UX Design, Photography, Video Editing`}
                          className="h-8 text-sm"
                          {...f}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => skillsArray.remove(idx)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {skillsArray.fields.length === 0 && (
              <p className="text-xs text-muted-foreground italic">Belum ada skill. Klik Tambah untuk mengisi.</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Sertifikat */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5" />
              Sertifikat / Prestasi yang Ingin Diraih
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => certsArray.append({ value: '' })}
            >
              <Plus className="h-3 w-3 mr-1" />
              Tambah
            </Button>
          </div>
          <div className="space-y-2">
            {certsArray.fields.map((field, idx) => (
              <div key={field.id} className="flex gap-2">
                <FormField
                  control={form.control}
                  name={`achievement_certificates.${idx}.value`}
                  render={({ field: f }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          placeholder="cth: Sertifikat Adobe Certified, Juara Lomba Desain"
                          className="h-8 text-sm"
                          {...f}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => certsArray.remove(idx)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {certsArray.fields.length === 0 && (
              <p className="text-xs text-muted-foreground italic">Belum ada sertifikat. Klik Tambah untuk mengisi.</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Magang & Skripsi */}
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="achievement_internship"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  Target Magang / Praktik Kerja
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="cth: Magang di perusahaan animasi"
                    className="h-9 text-sm"
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
            name="achievement_thesis_topic"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs flex items-center gap-1.5">
                  <GraduationCap className="h-3.5 w-3.5" />
                  Topik Tugas Akhir / Skripsi
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="cth: Desain motion graphic untuk edukasi"
                    className="h-9 text-sm"
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSaving}>
          {isSaving
            ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Menyimpan...</>
            : <><Save className="h-4 w-4 mr-2" />Simpan Capaian Target</>
          }
        </Button>
      </form>
    </Form>
  )
}

export function AchievementSummaryCard({ data }: { data: AchievementData }) {
  const hasAny = data.achievement_title ||
    data.achievement_ipk_target ||
    data.achievement_sks_target ||
    data.achievement_semester_target ||
    (data.achievement_skills && data.achievement_skills.length > 0) ||
    (data.achievement_certificates && data.achievement_certificates.length > 0) ||
    data.achievement_internship ||
    data.achievement_thesis_topic

  if (!hasAny) return null

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400">
          <Trophy className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">
            {data.achievement_title ?? 'Capaian Target Kelulusan'}
          </p>
          <p className="text-xs text-muted-foreground">Target yang ingin kamu raih</p>
        </div>
      </div>

      {data.achievement_description && (
        <p className="text-xs text-muted-foreground leading-relaxed">{data.achievement_description}</p>
      )}

      <div className="grid grid-cols-3 gap-2">
        {data.achievement_ipk_target != null && (
          <div className="rounded-lg bg-muted/60 px-3 py-2 text-center">
            <p className="text-xs text-muted-foreground">Target IPK</p>
            <p className="font-bold text-sm mt-0.5">{data.achievement_ipk_target.toFixed(2)}</p>
          </div>
        )}
        {data.achievement_sks_target != null && (
          <div className="rounded-lg bg-muted/60 px-3 py-2 text-center">
            <p className="text-xs text-muted-foreground">Target SKS</p>
            <p className="font-bold text-sm mt-0.5">{data.achievement_sks_target}</p>
          </div>
        )}
        {data.achievement_semester_target != null && (
          <div className="rounded-lg bg-muted/60 px-3 py-2 text-center">
            <p className="text-xs text-muted-foreground">Sem. Lulus</p>
            <p className="font-bold text-sm mt-0.5">Sem {data.achievement_semester_target}</p>
          </div>
        )}
      </div>

      {data.achievement_skills && data.achievement_skills.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
            <BookOpen className="h-3 w-3" /> Skill Target
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data.achievement_skills.map((s, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {data.achievement_certificates && data.achievement_certificates.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
            <Award className="h-3 w-3" /> Sertifikat / Prestasi
          </p>
          <div className="space-y-1">
            {data.achievement_certificates.map((c, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs">
                <CheckCircle2 className="h-3 w-3 shrink-0 text-green-500" />
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {data.achievement_internship && (
          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
              <Briefcase className="h-3 w-3" /> Magang
            </p>
            <p className="text-xs font-medium">{data.achievement_internship}</p>
          </div>
        )}
        {data.achievement_thesis_topic && (
          <div className="rounded-lg bg-muted/40 px-3 py-2">
            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
              <GraduationCap className="h-3 w-3" /> Tugas Akhir
            </p>
            <p className="text-xs font-medium">{data.achievement_thesis_topic}</p>
          </div>
        )}
      </div>
    </div>
  )
}

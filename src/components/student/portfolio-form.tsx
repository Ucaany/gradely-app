'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Loader2, Plus, Trash2, GripVertical, Globe, Lock,
  Tag, Calendar, AlignLeft, Link2, X, Settings2,
} from 'lucide-react'
import { createPortfolioSchema, type CreatePortfolioInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CategoryMetadataFields, getCategoryMetadataLabel } from '@/components/student/category-metadata-fields'
import type { PortfolioCategory, StudentPortfolioWithCategory } from '@/types'

export const CATEGORY_LABEL: Record<string, string> = {
  certificate: 'Sertifikat',
  internship: 'Magang',
  volunteer: 'Volunteer',
  organization: 'Organisasi',
  achievement: 'Prestasi',
  competition: 'Kompetisi',
  workshop: 'Workshop',
  training: 'Pelatihan',
  project: 'Proyek',
  work: 'Karya',
  experience: 'Pengalaman',
}

interface PortfolioFormProps {
  categories: PortfolioCategory[]
  editItem?: StudentPortfolioWithCategory
}

export function PortfolioForm({ categories, editItem }: PortfolioFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [skillInput, setSkillInput] = useState('')
  const [metadata, setMetadata] = useState<Record<string, unknown>>(
    (editItem?.metadata as Record<string, unknown>) ?? {}
  )
  const isEdit = !!editItem

  const form = useForm<CreatePortfolioInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createPortfolioSchema) as any,
    defaultValues: {
      category_id: editItem?.category_id ?? '',
      title: editItem?.title ?? '',
      description: editItem?.description ?? '',
      skills: editItem?.skills ?? [],
      start_date: editItem?.start_date ?? '',
      end_date: editItem?.end_date ?? '',
      status: editItem?.status ?? 'completed',
      is_public: editItem?.is_public ?? true,
      links: editItem?.links ?? [],
      metadata: (editItem?.metadata as Record<string, unknown>) ?? {},
    },
  })

  const { fields: linkFields, append: appendLink, remove: removeLink } = useFieldArray({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    control: form.control as any,
    name: 'links',
  })

  const watchStatus = form.watch('status')
  const watchSkills = form.watch('skills') ?? []
  const watchIsPublic = form.watch('is_public')
  const watchCategoryId = form.watch('category_id')

  const selectedCategory = categories.find((c) => c.id === watchCategoryId)
  const metadataLabel = selectedCategory ? getCategoryMetadataLabel(selectedCategory.code) : null

  function handleMetadataChange(key: string, value: unknown) {
    const updated = { ...metadata, [key]: value }
    setMetadata(updated)
    form.setValue('metadata', updated)
  }

  // Reset metadata when category changes
  useEffect(() => {
    if (!isEdit) {
      setMetadata({})
      form.setValue('metadata', {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchCategoryId])

  function addSkill() {
    const trimmed = skillInput.trim()
    if (!trimmed) return
    const current = form.getValues('skills') ?? []
    if (!current.includes(trimmed)) {
      form.setValue('skills', [...current, trimmed])
    }
    setSkillInput('')
  }

  function removeSkill(skill: string) {
    const current = form.getValues('skills') ?? []
    form.setValue('skills', current.filter((s) => s !== skill))
  }

  function addLink() {
    appendLink({ label: '', url: '' })
  }

  async function onSubmit(data: CreatePortfolioInput) {
    setIsLoading(true)
    try {
      const url = isEdit ? `/api/student/portfolio/${editItem!.id}` : '/api/student/portfolio'
      const method = isEdit ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, metadata }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error ?? 'Gagal menyimpan portofolio')
        return
      }
      toast.success(isEdit ? 'Portofolio diperbarui' : 'Portofolio ditambahkan')
      router.push('/student/portfolio')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {isEdit ? 'Edit Portofolio' : 'Tambah Portofolio'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isEdit ? 'Perbarui data portofolio kamu' : 'Tambahkan karya, pengalaman, atau pencapaian kamu'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Portofolio'}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Kolom kiri */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Info Dasar */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlignLeft className="h-4 w-4 text-muted-foreground" />
                  Informasi Dasar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Judul <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: Magang UI/UX di Tokopedia" disabled={isLoading} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Jelaskan pengalaman atau karya kamu secara singkat..."
                          rows={4}
                          disabled={isLoading}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Detail per kategori */}
            {selectedCategory && metadataLabel && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-muted-foreground" />
                    {metadataLabel}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CategoryMetadataFields
                    categoryCode={selectedCategory.code}
                    metadata={metadata}
                    onChange={handleMetadataChange}
                    disabled={isLoading}
                  />
                </CardContent>
              </Card>
            )}

            {/* Periode */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Periode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <FormLabel className="text-sm font-medium cursor-pointer">Sedang Berlangsung</FormLabel>
                        <FormDescription className="text-xs">Aktifkan jika kegiatan ini masih berjalan</FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value === 'ongoing'}
                          onCheckedChange={(v) => field.onChange(v ? 'ongoing' : 'completed')}
                          disabled={isLoading}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="start_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tanggal Mulai</FormLabel>
                        <FormControl>
                          <Input type="date" disabled={isLoading} {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {watchStatus !== 'ongoing' && (
                    <FormField
                      control={form.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tanggal Selesai</FormLabel>
                          <FormControl>
                            <Input type="date" disabled={isLoading} {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Skill */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  Skill
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Tambah skill lalu tekan Enter atau klik Tambah"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                    disabled={isLoading}
                  />
                  <Button type="button" variant="outline" onClick={addSkill} disabled={isLoading}>
                    <Plus className="h-4 w-4 mr-1" />
                    Tambah
                  </Button>
                </div>
                {watchSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {watchSkills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="gap-1 pr-1 text-sm">
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Belum ada skill ditambahkan</p>
                )}
              </CardContent>
            </Card>

            {/* Tautan */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-muted-foreground" />
                    Tautan
                  </CardTitle>
                  <Button type="button" variant="outline" size="sm" onClick={addLink} disabled={isLoading}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Tambah Tautan
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {linkFields.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                    Belum ada tautan. Klik &quot;Tambah Tautan&quot; untuk menambahkan.
                  </p>
                )}
                {linkFields.map((field, index) => (
                  <div key={field.id} className="flex items-start gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground mt-2.5 shrink-0" />
                    <div className="grid grid-cols-5 gap-2 flex-1">
                      <FormField
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        control={form.control as any}
                        name={`links.${index}.label`}
                        render={({ field: f }) => (
                          <FormItem className="col-span-2">
                            {index === 0 && <FormLabel className="text-xs">Label</FormLabel>}
                            <FormControl>
                              <Input placeholder="GitHub, Behance, Demo..." disabled={isLoading} {...f} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        control={form.control as any}
                        name={`links.${index}.url`}
                        render={({ field: f }) => (
                          <FormItem className="col-span-3">
                            {index === 0 && <FormLabel className="text-xs">URL</FormLabel>}
                            <FormControl>
                              <Input placeholder="https://..." disabled={isLoading} {...f} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:text-destructive mt-0.5 shrink-0"
                      onClick={() => removeLink(index)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {linkFields.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full border border-dashed"
                    onClick={addLink}
                    disabled={isLoading}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Tambah Tautan Lagi
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Kolom kanan */}
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Kategori</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {CATEGORY_LABEL[cat.code] ?? cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Visibilitas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <FormField
                  control={form.control}
                  name="is_public"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-2">
                        {watchIsPublic
                          ? <Globe className="h-4 w-4 text-emerald-500" />
                          : <Lock className="h-4 w-4 text-muted-foreground" />
                        }
                        <div>
                          <FormLabel className="text-sm font-medium cursor-pointer">
                            {watchIsPublic ? 'Publik' : 'Privat'}
                          </FormLabel>
                          <FormDescription className="text-xs">
                            {watchIsPublic
                              ? 'Terlihat oleh perusahaan mitra'
                              : 'Hanya kamu yang bisa lihat'}
                          </FormDescription>
                        </div>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isLoading} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Portofolio privat tidak akan muncul di profil publik meskipun kamu mengaktifkan visibilitas profil.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  )
}

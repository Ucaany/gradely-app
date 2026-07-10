'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Loader2,
  User,
  Mail,
  Phone,
  GraduationCap,
  Building2,
  BookOpen,
  Calendar,
  Link2,
  Eye,
  EyeOff,
  Pencil,
  Save,
  X,
  Hash,
  BadgeCheck,
  Tag,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
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
import { updateStudentProfileSchema, type UpdateStudentProfileInput } from '@/lib/validations'
import { getInitials } from '@/lib/utils'

interface ProfileData {
  id: string
  full_name: string
  email: string
  nim: string | null
  phone: string | null
  avatar_url: string | null
  current_semester: number | null
  current_semester_type: 'ganjil' | 'genap' | null
  profile_visible: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  study_programs: { id: string; name: string; short_name: string | null; degree_level: string } | null
  universities: { id: string; name: string; short_name: string | null; city: string | null; province: string | null } | null
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium mt-0.5 break-all">{value || <span className="text-muted-foreground italic">Belum diisi</span>}</p>
      </div>
    </div>
  )
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [skills, setSkills] = useState<string[]>([])
  const [careerInterests, setCareerInterests] = useState<string[]>([])

  const form = useForm<UpdateStudentProfileInput>({
    resolver: zodResolver(updateStudentProfileSchema),
    defaultValues: {
      full_name: '',
      phone: '',
      avatar_url: '',
      current_semester: 1,
      current_semester_type: 'ganjil',
      profile_visible: true,
    },
  })

  const fetchProfile = useCallback(async () => {
    setIsLoading(true)
    try {
      const [profileRes, portfolioRes, careerRes] = await Promise.all([
        fetch('/api/student/profile'),
        fetch('/api/student/portfolio'),
        fetch('/api/student/career'),
      ])
      const [profileData, portfolioData, careerData] = await Promise.all([
        profileRes.json(), portfolioRes.json(), careerRes.json(),
      ])
      if (profileData.success) {
        setProfile(profileData.data)
        form.reset({
          full_name: profileData.data.full_name ?? '',
          phone: profileData.data.phone ?? '',
          avatar_url: profileData.data.avatar_url ?? '',
          current_semester: profileData.data.current_semester ?? 1,
          current_semester_type: profileData.data.current_semester_type ?? 'ganjil',
          profile_visible: profileData.data.profile_visible ?? true,
        })
      }
      if (portfolioData.success) {
        const allSkills = new Set<string>()
        for (const item of portfolioData.data ?? []) {
          for (const skill of item.skills ?? []) allSkills.add(skill)
        }
        setSkills(Array.from(allSkills))
      }
      if (careerData.success) {
        setCareerInterests((careerData.data ?? []).map((c: { interest: string }) => c.interest))
      }
    } finally {
      setIsLoading(false)
    }
  }, [form])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  async function onSubmit(data: UpdateStudentProfileInput) {
    setIsSaving(true)
    try {
      const res = await fetch('/api/student/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error ?? 'Gagal menyimpan profil')
        return
      }
      setProfile(result.data)
      setIsEditing(false)
      toast.success('Profil berhasil diperbarui')
    } finally {
      setIsSaving(false)
    }
  }

  function handleCancel() {
    if (profile) {
      form.reset({
        full_name: profile.full_name ?? '',
        phone: profile.phone ?? '',
        avatar_url: profile.avatar_url ?? '',
        current_semester: profile.current_semester ?? 1,
        current_semester_type: profile.current_semester_type ?? 'ganjil',
        profile_visible: profile.profile_visible ?? true,
      })
    }
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!profile) return null

  const studyProgram = profile.study_programs
  const university = profile.universities
  const joinDate = new Date(profile.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Profil Saya</h1>
          <p className="text-sm text-muted-foreground">Kelola informasi dan pengaturan akun kamu</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
            <Pencil className="h-3.5 w-3.5 mr-2" />
            Edit Profil
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Avatar + Identity */}
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url ?? ''} />
                <AvatarFallback className="text-xl font-semibold">{getInitials(profile.full_name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-base">{profile.full_name}</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <BadgeCheck className="h-3 w-3 mr-1" />
                  {profile.is_active ? 'Aktif' : 'Nonaktif'}
                </Badge>
                {studyProgram?.degree_level && (
                  <Badge variant="outline" className="text-xs">{studyProgram.degree_level}</Badge>
                )}
              </div>
              <Separator />
              <div className="w-full space-y-1 text-left">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Hash className="h-3 w-3 shrink-0" />
                  <span>NIM: <span className="font-mono font-medium text-foreground">{profile.nim ?? '-'}</span></span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 shrink-0" />
                  <span>Bergabung {joinDate}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Eye className="h-3 w-3 shrink-0" />
                  <span>Profil {profile.profile_visible ? 'terlihat oleh perusahaan mitra' : 'disembunyikan dari perusahaan'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Institusi */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                Institusi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              <div>
                <p className="text-xs text-muted-foreground">Universitas</p>
                <p className="text-sm font-medium">{university?.name ?? '-'}</p>
                {university?.city && (
                  <p className="text-xs text-muted-foreground">{university.city}{university.province ? `, ${university.province}` : ''}</p>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Program Studi</p>
                <p className="text-sm font-medium">{studyProgram?.name ?? '-'}</p>
                {studyProgram?.short_name && (
                  <p className="text-xs text-muted-foreground">{studyProgram.short_name}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Detail / Edit Form */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Edit Informasi Profil</CardTitle>
                <CardDescription>Perubahan akan langsung tersimpan ke database</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Lengkap <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input placeholder="Nama lengkap kamu" disabled={isSaving} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nomor HP</FormLabel>
                          <FormControl>
                            <Input placeholder="08123456789" disabled={isSaving} {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="avatar_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL Foto Profil</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/foto.jpg" disabled={isSaving} {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                          {field.value && (
                            <div className="flex items-center gap-2 mt-1">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={field.value} />
                                <AvatarFallback className="text-xs">{getInitials(form.watch('full_name'))}</AvatarFallback>
                              </Avatar>
                              <p className="text-xs text-muted-foreground">Preview foto profil</p>
                            </div>
                          )}
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name="current_semester"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Semester Aktif</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={1}
                                max={14}
                                disabled={isSaving}
                                {...field}
                                value={field.value ?? ''}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="current_semester_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Jenis Semester</FormLabel>
                            <Select value={field.value ?? 'ganjil'} onValueChange={field.onChange} disabled={isSaving}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="ganjil">Ganjil</SelectItem>
                                <SelectItem value="genap">Genap</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="profile_visible"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-sm font-medium cursor-pointer">Tampil ke Perusahaan</FormLabel>
                            <p className="text-xs text-muted-foreground">Izinkan perusahaan mitra melihat profil kamu</p>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isSaving} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2 pt-1">
                      <Button type="submit" disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
                        <X className="mr-2 h-4 w-4" />
                        Batal
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    Informasi Pribadi
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 divide-y">
                  <InfoRow icon={User} label="Nama Lengkap" value={profile.full_name} />
                  <InfoRow icon={Mail} label="Email" value={profile.email} />
                  <InfoRow icon={Phone} label="Nomor HP" value={profile.phone} />
                  <InfoRow icon={Hash} label="NIM" value={profile.nim} />
                  <InfoRow
                    icon={Link2}
                    label="URL Foto Profil"
                    value={profile.avatar_url ? (
                      <a href={profile.avatar_url} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 text-sm break-all">
                        {profile.avatar_url}
                      </a>
                    ) : null}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    Informasi Akademik
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 divide-y">
                  <InfoRow
                    icon={BookOpen}
                    label="Semester Aktif"
                    value={profile.current_semester
                      ? `Semester ${profile.current_semester} (${profile.current_semester_type === 'ganjil' ? 'Ganjil' : 'Genap'})`
                      : null}
                  />
                  <InfoRow icon={GraduationCap} label="Program Studi" value={studyProgram?.name} />
                  <InfoRow icon={Building2} label="Universitas" value={university?.name} />
                </CardContent>
              </Card>

              {/* Skill dari portofolio */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    Skill
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 py-2">
                      {skills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic py-2">
                      Belum ada skill. Tambahkan skill melalui portofolio kamu.
                    </p>
                  )}
                  {careerInterests.length > 0 && (
                    <>
                      <p className="text-xs text-muted-foreground mt-3 mb-1.5">Minat Karier</p>
                      <div className="flex flex-wrap gap-1.5">
                        {careerInterests.map((interest) => (
                          <Badge key={interest} variant="outline" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    {profile.profile_visible ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    Pengaturan Privasi
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">Tampil ke Perusahaan</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Izinkan perusahaan mitra melihat profil kamu</p>
                    </div>
                    <Badge variant="outline" className={profile.profile_visible
                      ? 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'text-muted-foreground'}>
                      {profile.profile_visible ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

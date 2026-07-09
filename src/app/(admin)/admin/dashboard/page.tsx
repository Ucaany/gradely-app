import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Users,
  BookOpen,
  Building2,
  GraduationCap,
  TrendingUp,
  ArrowRight,
  FileUp,
  UserPlus,
  ClipboardList,
  CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import { DashboardChart } from '@/components/admin/dashboard-chart'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [studentsRes, lecturersRes, companiesRes, programsRes, recentStudents] =
    await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('is_active', true),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'lecturer').eq('is_active', true),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'company').eq('is_active', true),
      supabase.from('study_programs').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('users').select('id, full_name, email, nim, is_active, created_at').eq('role', 'student').order('created_at', { ascending: false }).limit(5),
    ])

  const stats = [
    { title: 'Total Mahasiswa', value: studentsRes.count ?? 0, description: 'Mahasiswa aktif', icon: GraduationCap, trend: '+2.5%' },
    { title: 'Dosen Wali', value: lecturersRes.count ?? 0, description: 'Dosen aktif', icon: Users, trend: '+0%' },
    { title: 'Program Studi', value: programsRes.count ?? 0, description: 'Prodi aktif', icon: BookOpen, trend: '+0%' },
    { title: 'Perusahaan Mitra', value: companiesRes.count ?? 0, description: 'Perusahaan terdaftar', icon: Building2, trend: '+1.2%' },
  ]

  const quickActions = [
    { label: 'Tambah Mahasiswa', href: '/admin/users/students/new', icon: UserPlus, description: 'Daftarkan mahasiswa baru' },
    { label: 'Tambah Dosen Wali', href: '/admin/users/lecturers/new', icon: UserPlus, description: 'Daftarkan dosen wali baru' },
    { label: 'Aturan Akademik', href: '/admin/academic-rules', icon: ClipboardList, description: 'Kelola aturan akademik' },
    { label: 'Import CSV', href: '/admin/users/import', icon: FileUp, description: 'Import data dari file CSV' },
  ]

  const systemStatus = [
    { label: 'Database', status: 'Aktif' },
    { label: 'Autentikasi', status: 'Aktif' },
    { label: 'Notifikasi WhatsApp', status: 'Aktif' },
  ]

  const students = recentStudents.data ?? []

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard Admin</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan data platform Gradely — ISI Yogyakarta
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-3 w-3" />
                <span>{stat.trend} dari bulan lalu</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardChart />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Sistem</CardTitle>
            <CardDescription>Kondisi layanan saat ini</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {systemStatus.map((item, i) => (
              <div key={item.label}>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
                    {item.status}
                  </Badge>
                </div>
                {i < systemStatus.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aksi Cepat</CardTitle>
            <CardDescription>Pintasan ke fitur yang sering digunakan</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {quickActions.map((action) => (
              <Button key={action.href} variant="outline" className="h-auto w-full justify-between px-4 py-3" asChild>
                <Link href={action.href}>
                  <div className="flex items-center gap-3 min-w-0">
                    <action.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="text-left min-w-0">
                      <div className="text-sm font-medium">{action.label}</div>
                      <div className="text-xs text-muted-foreground truncate">{action.description}</div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <CardTitle className="text-base">Mahasiswa Terbaru</CardTitle>
              <CardDescription>5 mahasiswa terakhir didaftarkan</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="shrink-0 self-start sm:self-auto" asChild>
              <Link href="/admin/users/students">Lihat semua</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0 pb-2">
            <div className="w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Nama</TableHead>
                    <TableHead className="min-w-[100px]">NIM</TableHead>
                    <TableHead className="min-w-[80px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">
                        Belum ada data mahasiswa
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="min-w-0">
                          <div className="font-medium text-sm leading-tight truncate">{s.full_name}</div>
                          <div className="text-xs text-muted-foreground truncate">{s.email}</div>
                        </TableCell>
                        <TableCell className="text-sm font-mono">{s.nim ?? '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`shrink-0 whitespace-nowrap text-xs ${s.is_active ? 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800' : 'text-muted-foreground'}`}>
                            {s.is_active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
  MessageCircle,
  XCircle,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import { DashboardChart } from '@/components/admin/dashboard-chart'
import { formatDate, getInitials } from '@/lib/utils'
import type { WhatsappLog } from '@/types'

type Period = '24h' | '1w' | 'all'

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: { period?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const period = (searchParams.period ?? '24h') as Period

  const now = new Date()
  const periodStart =
    period === '24h'
      ? new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      : period === '1w'
      ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      : null

  const [studentsRes, lecturersRes, companiesRes, programsRes, recentStudentsRes, wahaLogsRes] =
    await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('is_active', true),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'lecturer').eq('is_active', true),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'company').eq('is_active', true),
      supabase.from('study_programs').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('users').select('id, full_name, email, nim, is_active, avatar_url, created_at').eq('role', 'student').order('created_at', { ascending: false }).limit(5),
      periodStart
        ? supabase.from('whatsapp_logs').select('id, phone_number, message, status, error_message, sent_at, created_at').gte('created_at', periodStart).order('created_at', { ascending: false }).limit(50)
        : supabase.from('whatsapp_logs').select('id, phone_number, message, status, error_message, sent_at, created_at').order('created_at', { ascending: false }).limit(50),
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

  const students = recentStudentsRes.data ?? []
  const wahaLogs = (wahaLogsRes.data ?? []) as WhatsappLog[]

  const periodLabels: Record<Period, string> = {
    '24h': '24 Jam Terakhir',
    '1w': '7 Hari Terakhir',
    'all': 'Semua',
  }

  const sentCount = wahaLogs.filter((l) => l.status === 'sent').length
  const failedCount = wahaLogs.filter((l) => l.status === 'failed').length

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard Admin</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan data platform Gradely — ISI Yogyakarta
        </p>
      </div>

      {/* Stat cards */}
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

      {/* Chart + Status Sistem */}
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

      {/* Aksi Cepat + Mahasiswa Terbaru */}
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

        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-start justify-between gap-2 pb-0">
            <div>
              <CardTitle className="text-base">Mahasiswa Terbaru</CardTitle>
              <CardDescription>5 mahasiswa terakhir didaftarkan</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="shrink-0 -mt-1" asChild>
              <Link href="/admin/users/students">
                Lihat riwayat
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 sm:pl-6">Mahasiswa</TableHead>
                  <TableHead>NIM</TableHead>
                  <TableHead className="pr-4 sm:pr-6">Status</TableHead>
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
                      <TableCell className="pl-4 sm:pl-6">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarImage src={s.avatar_url ?? ''} />
                            <AvatarFallback className="text-xs">{getInitials(s.full_name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-sm leading-tight truncate max-w-[140px]">{s.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[140px]">{s.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono">{s.nim ?? '-'}</TableCell>
                      <TableCell className="pr-4 sm:pr-6">
                        <Badge variant="outline" className={`shrink-0 whitespace-nowrap text-xs ${s.is_active ? 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800' : 'text-muted-foreground'}`}>
                          {s.is_active ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Riwayat WhatsApp dengan filter periode */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between pb-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-muted-foreground" />
              Riwayat Pesan WhatsApp
            </CardTitle>
            <CardDescription className="mt-1">
              {periodLabels[period]} · {wahaLogs.length} pesan
              {wahaLogs.length > 0 && (
                <span className="ml-2">
                  <span className="text-emerald-600 dark:text-emerald-400">{sentCount} terkirim</span>
                  {failedCount > 0 && <span className="text-destructive ml-2">{failedCount} gagal</span>}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {/* Period filter buttons */}
            <div className="flex rounded-lg border p-0.5 gap-0.5">
              {(['24h', '1w', 'all'] as Period[]).map((p) => (
                <Button
                  key={p}
                  variant={period === p ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 px-3 text-xs"
                  asChild
                >
                  <Link href={`?period=${p}`}>
                    {p === '24h' ? '24 Jam' : p === '1w' ? '1 Minggu' : 'Semua'}
                  </Link>
                </Button>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="shrink-0 text-xs" asChild>
              <Link href="/admin/settings">
                Pengaturan
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 mt-3">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 sm:pl-6 min-w-[130px]">No. HP</TableHead>
                  <TableHead className="min-w-[260px]">Pesan</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="pr-4 sm:pr-6 min-w-[140px]">Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wahaLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-10">
                      Tidak ada pesan pada periode {periodLabels[period].toLowerCase()}
                    </TableCell>
                  </TableRow>
                ) : (
                  wahaLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="pl-4 sm:pl-6 text-sm font-mono">{log.phone_number}</TableCell>
                      <TableCell className="text-sm">
                        <p className="truncate max-w-[300px] text-muted-foreground">{log.message}</p>
                        {log.error_message && (
                          <p className="text-xs text-destructive mt-0.5 truncate max-w-[300px]">{log.error_message}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.status === 'sent' ? (
                          <Badge variant="outline" className="shrink-0 whitespace-nowrap text-xs text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
                            <CheckCircle2 className="h-3 w-3 mr-1" />Terkirim
                          </Badge>
                        ) : log.status === 'failed' ? (
                          <Badge variant="outline" className="shrink-0 whitespace-nowrap text-xs text-destructive border-destructive/30 bg-destructive/5">
                            <XCircle className="h-3 w-3 mr-1" />Gagal
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                            <Clock className="h-3 w-3 mr-1" />Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="pr-4 sm:pr-6 text-sm text-muted-foreground">
                        {formatDate(log.sent_at ?? log.created_at)}
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
  )
}

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
  Link2,
} from 'lucide-react'
import Link from 'next/link'
import { DashboardChart } from '@/components/admin/dashboard-chart'
import { StudentStatusChart } from '@/components/admin/student-status-chart'
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

  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

  const [
    studentsRes, lecturersRes, companiesRes, programsRes,
    recentStudentsRes, wahaLogsRes, advisorRes,
    studentsLastMonth, lecturersLastMonth, companiesLastMonth,
    studentsThisMonth, lecturersThisMonth, companiesThisMonth,
  ] =
    await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('is_active', true),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'lecturer').eq('is_active', true),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'company').eq('is_active', true),
      supabase.from('study_programs').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('users').select('id, full_name, email, nim, is_active, avatar_url, created_at').eq('role', 'student').order('created_at', { ascending: false }).limit(5),
      periodStart
        ? supabase.from('whatsapp_logs').select('id, phone_number, message, status, error_message, sent_at, created_at').gte('created_at', periodStart).order('created_at', { ascending: false }).limit(50)
        : supabase.from('whatsapp_logs').select('id, phone_number, message, status, error_message, sent_at, created_at').order('created_at', { ascending: false }).limit(50),
      supabase.from('advisor_students').select('id, lecturer_id, users!advisor_students_lecturer_id_fkey(id, full_name, avatar_url)', { count: 'exact' }).limit(100),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student').gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'lecturer').gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'company').gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student').gte('created_at', thisMonthStart),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'lecturer').gte('created_at', thisMonthStart),
      supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'company').gte('created_at', thisMonthStart),
    ])

  function calcTrend(thisMonth: number, lastMonth: number): string {
    if (lastMonth === 0 && thisMonth === 0) return '0 baru bulan ini'
    if (lastMonth === 0) return `+${thisMonth} baru bulan ini`
    const diff = thisMonth - lastMonth
    const pct = Math.round((diff / lastMonth) * 100)
    if (diff === 0) return '0% dari bulan lalu'
    return `${diff > 0 ? '+' : ''}${pct}% dari bulan lalu`
  }

  const studentTrend = calcTrend(studentsThisMonth.count ?? 0, studentsLastMonth.count ?? 0)
  const lecturerTrend = calcTrend(lecturersThisMonth.count ?? 0, lecturersLastMonth.count ?? 0)
  const companyTrend = calcTrend(companiesThisMonth.count ?? 0, companiesLastMonth.count ?? 0)

  const stats = [
    { title: 'Total Mahasiswa', value: studentsRes.count ?? 0, description: 'Mahasiswa aktif', icon: GraduationCap, trend: studentTrend, iconClass: 'text-blue-500' },
    { title: 'Dosen Wali', value: lecturersRes.count ?? 0, description: 'Dosen aktif', icon: Users, trend: lecturerTrend, iconClass: 'text-violet-500' },
    { title: 'Program Studi', value: programsRes.count ?? 0, description: 'Prodi aktif', icon: BookOpen, trend: null, iconClass: 'text-emerald-500' },
    { title: 'Perusahaan Mitra', value: companiesRes.count ?? 0, description: 'Perusahaan terdaftar', icon: Building2, trend: companyTrend, iconClass: 'text-orange-500' },
  ]

  const quickActions = [
    { label: 'Tambah Mahasiswa', href: '/admin/users/students/new', icon: UserPlus, description: 'Daftarkan mahasiswa baru', iconClass: 'text-blue-500' },
    { label: 'Tambah Dosen Wali', href: '/admin/users/lecturers/new', icon: UserPlus, description: 'Daftarkan dosen wali baru', iconClass: 'text-violet-500' },
    { label: 'Aturan Akademik', href: '/admin/academic-rules', icon: ClipboardList, description: 'Kelola aturan akademik', iconClass: 'text-emerald-500' },
    { label: 'Import CSV', href: '/admin/users/import', icon: FileUp, description: 'Import data dari file CSV', iconClass: 'text-orange-500' },
  ]

  const systemStatus = [
    { label: 'Database', status: 'Aktif' },
    { label: 'Autentikasi', status: 'Aktif' },
    { label: 'Notifikasi WhatsApp', status: 'Aktif' },
  ]

  const students = recentStudentsRes.data ?? []
  const wahaLogs = (wahaLogsRes.data ?? []) as WhatsappLog[]

  // Advisor stats
  const advisorRows = advisorRes.data ?? []
  const totalAdvisorConnections = advisorRes.count ?? 0
  const activeLecturerIds = new Set(advisorRows.map((a) => a.lecturer_id))
  const activeLecturersCount = activeLecturerIds.size

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
              <stat.icon className={`h-4 w-4 ${stat.iconClass}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              {stat.trend !== null && (
                <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  <span>{stat.trend}</span>
                </div>
              )}
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

      {/* Status Akademik Chart */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StudentStatusChart />
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Keterangan Status</CardTitle>
            <CardDescription>Kategori status akademik mahasiswa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { color: '#16a34a', label: 'Unggul', desc: 'SKS melebihi target' },
              { color: '#2563eb', label: 'Sesuai Target', desc: 'Progres sesuai rencana' },
              { color: '#ca8a04', label: 'Perlu Perhatian', desc: 'SKS sedikit di bawah target' },
              { color: '#ea580c', label: 'Butuh Pemulihan', desc: 'SKS jauh di bawah target' },
              { color: '#dc2626', label: 'Darurat Akademik', desc: 'IPK/SKS kritis atau melebihi semester maks' },
            ].map((item, i, arr) => (
              <div key={item.label}>
                <div className="flex items-start gap-2.5 py-1.5">
                  <div className="mt-0.5 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                  <div>
                    <p className="text-sm font-medium leading-tight">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
                {i < arr.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Advisor Connections */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Koneksi</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalAdvisorConnections}</div>
            <p className="text-xs text-muted-foreground mt-1">Mahasiswa terhubung ke dosen wali</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dosen Aktif</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeLecturersCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Dosen wali sudah punya mahasiswa</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Mahasiswa Belum Terhubung</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Math.max(0, (studentsRes.count ?? 0) - totalAdvisorConnections)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Belum memiliki dosen wali</p>
          </CardContent>
        </Card>
      </div>

      {/* Aksi Cepat */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aksi Cepat</CardTitle>
          <CardDescription>Pintasan ke fitur yang sering digunakan</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col gap-2 rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted group-hover:bg-background">
                  <action.icon className={`h-4 w-4 ${action.iconClass}`} />
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div>
                <p className="text-sm font-medium leading-tight">{action.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{action.description}</p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Mahasiswa Terbaru + Riwayat WhatsApp */}
      <div className="grid gap-4 lg:grid-cols-2">
      {/* Mahasiswa Terbaru */}
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

      {/* Riwayat WhatsApp dengan filter periode */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between pb-0">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-emerald-500" />
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
                  <TableHead className="pl-4 sm:pl-6 min-w-[120px]">No. HP</TableHead>
                  <TableHead className="min-w-[160px]">Pesan</TableHead>
                  <TableHead className="min-w-[90px]">Status</TableHead>
                  <TableHead className="pr-4 sm:pr-6 min-w-[120px]">Waktu</TableHead>
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
                        <p className="truncate max-w-[180px] text-muted-foreground">{log.message}</p>
                        {log.error_message && (
                          <p className="text-xs text-destructive mt-0.5 truncate max-w-[180px]">{log.error_message}</p>
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
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Users, BookOpen, Building2, GraduationCap, TrendingUp,
  ArrowRight, FileUp, UserPlus, ClipboardList,
} from 'lucide-react'
import Link from 'next/link'
import { DashboardChart } from '@/components/admin/dashboard-chart'
import { StudentStatusChart } from '@/components/admin/student-status-chart'
import { SendLecturerDialog } from '@/components/admin/send-lecturer-dialog'
import { SystemStatusCard } from '@/components/admin/system-status-card'
import { WhatsAppLogsCard } from '@/components/admin/whatsapp-logs-card'
import { getInitials } from '@/lib/utils'

type Period = '24h' | '1w' | 'all'

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: { period?: string; s_page?: string; l_page?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const VALID_PERIODS = ['24h', '1w', 'all'] as const
  const rawPeriod = searchParams.period ?? '24h'
  const period: Period = (VALID_PERIODS as readonly string[]).includes(rawPeriod)
    ? (rawPeriod as Period) : '24h'

  const PAGE_SIZE_STUDENTS = 5
  const PAGE_SIZE_LECTURERS = 8
  const sPage = Math.max(1, parseInt(searchParams.s_page ?? '1', 10))
  const lPage = Math.max(1, parseInt(searchParams.l_page ?? '1', 10))

  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

  const [
    studentsRes, lecturersRes, companiesRes, programsRes,
    recentStudentsRes, advisorRes,
    studentsLastMonth, lecturersLastMonth, companiesLastMonth,
    studentsThisMonth, lecturersThisMonth, companiesThisMonth,
    lecturersListRes,
    totalStudentsCount, totalLecturersCount,
  ] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student').eq('is_active', true),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'lecturer').eq('is_active', true),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'company').eq('is_active', true),
    supabase.from('study_programs').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('users')
      .select('id, full_name, email, nim, is_active, avatar_url, created_at')
      .eq('role', 'student').order('created_at', { ascending: false })
      .range((sPage - 1) * PAGE_SIZE_STUDENTS, sPage * PAGE_SIZE_STUDENTS - 1),
    supabase.from('advisor_students').select('lecturer_id'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student').gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'lecturer').gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'company').gte('created_at', lastMonthStart).lte('created_at', lastMonthEnd),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student').gte('created_at', thisMonthStart),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'lecturer').gte('created_at', thisMonthStart),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'company').gte('created_at', thisMonthStart),
    supabase.from('users')
      .select('id, full_name, email, phone, avatar_url')
      .eq('role', 'lecturer').eq('is_active', true)
      .order('full_name', { ascending: true })
      .range((lPage - 1) * PAGE_SIZE_LECTURERS, lPage * PAGE_SIZE_LECTURERS - 1),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    supabase.from('users').select('id', { count: 'exact', head: true }).eq('role', 'lecturer').eq('is_active', true),
  ])

  function calcTrend(thisMonth: number, lastMonth: number): string {
    if (lastMonth === 0 && thisMonth === 0) return '0 baru bulan ini'
    if (lastMonth === 0) return `+${thisMonth} baru bulan ini`
    const diff = thisMonth - lastMonth
    const pct = Math.round((diff / lastMonth) * 100)
    if (diff === 0) return 'Sama dengan bulan lalu'
    return `${diff > 0 ? '+' : ''}${pct}% dari bulan lalu`
  }

  const stats = [
    {
      title: 'Total Mahasiswa',
      value: studentsRes.count ?? 0,
      description: 'Mahasiswa aktif',
      icon: GraduationCap,
      trend: calcTrend(studentsThisMonth.count ?? 0, studentsLastMonth.count ?? 0),
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
    },
    {
      title: 'Dosen Wali',
      value: lecturersRes.count ?? 0,
      description: 'Dosen aktif',
      icon: Users,
      trend: calcTrend(lecturersThisMonth.count ?? 0, lecturersLastMonth.count ?? 0),
      color: 'text-violet-500',
      bg: 'bg-violet-50 dark:bg-violet-950/40',
    },
    {
      title: 'Program Studi',
      value: programsRes.count ?? 0,
      description: 'Prodi aktif',
      icon: BookOpen,
      trend: null,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      title: 'Perusahaan Mitra',
      value: companiesRes.count ?? 0,
      description: 'Perusahaan terdaftar',
      icon: Building2,
      trend: calcTrend(companiesThisMonth.count ?? 0, companiesLastMonth.count ?? 0),
      color: 'text-orange-500',
      bg: 'bg-orange-50 dark:bg-orange-950/40',
    },
  ]

  const quickActions = [
    { label: 'Tambah Mahasiswa', href: '/admin/users/students/new', icon: UserPlus, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/40', desc: 'Daftarkan mahasiswa baru' },
    { label: 'Tambah Dosen Wali', href: '/admin/users/lecturers/new', icon: UserPlus, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/40', desc: 'Daftarkan dosen baru' },
    { label: 'Aturan Akademik', href: '/admin/academic-rules', icon: ClipboardList, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40', desc: 'Kelola aturan akademik' },
    { label: 'Import CSV', href: '/admin/users/import', icon: FileUp, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/40', desc: 'Import data dari CSV' },
  ]

  const students = recentStudentsRes.data ?? []
  const totalStudents = totalStudentsCount.count ?? 0
  const totalLecturers = totalLecturersCount.count ?? 0
  const totalSPages = Math.max(1, Math.ceil(totalStudents / PAGE_SIZE_STUDENTS))
  const totalLPages = Math.max(1, Math.ceil(totalLecturers / PAGE_SIZE_LECTURERS))

  const advisorRows = advisorRes.data ?? []
  const lecturersList = (lecturersListRes.data ?? []) as Array<{
    id: string; full_name: string; email: string; phone: string | null; avatar_url: string | null
  }>
  const adviseeCountMap = advisorRows.reduce<Record<string, number>>((acc, row) => {
    acc[row.lecturer_id] = (acc[row.lecturer_id] ?? 0) + 1
    return acc
  }, {})

  const periodLabels: Record<Period, string> = {
    '24h': '24 Jam Terakhir',
    '1w': '7 Hari Terakhir',
    'all': 'Semua Waktu',
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-screen-2xl mx-auto w-full">

      {/* Header */}
      <div className="flex flex-col gap-0.5">
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Ringkasan data platform Gradely</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="shadow-none">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground font-medium truncate">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1 tabular-nums">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{stat.description}</p>
                  {stat.trend && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="h-3 w-3 shrink-0" />
                      <span className="truncate">{stat.trend}</span>
                    </div>
                  )}
                </div>
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardChart />
        </div>
        <SystemStatusCard />
      </div>

      {/* Student Status + Legend */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <StudentStatusChart />
        </div>
        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Keterangan Status</CardTitle>
            <CardDescription className="text-xs">Kategori status akademik</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-0.5">
              {[
                { color: '#16a34a', label: 'Unggul', desc: 'SKS melebihi target' },
                { color: '#2563eb', label: 'Sesuai Target', desc: 'Progres sesuai rencana' },
                { color: '#ca8a04', label: 'Perlu Perhatian', desc: 'SKS sedikit di bawah target' },
                { color: '#ea580c', label: 'Butuh Pemulihan', desc: 'SKS jauh di bawah target' },
                { color: '#dc2626', label: 'Darurat Akademik', desc: 'IPK/SKS kritis' },
              ].map((item, i, arr) => (
                <div key={item.label}>
                  <div className="flex items-start gap-2.5 py-2">
                    <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                    <div>
                      <p className="text-sm font-medium leading-tight">{item.label}</p>
                      <p className="text-xs text-muted-foreground leading-snug">{item.desc}</p>
                    </div>
                  </div>
                  {i < arr.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <div className="mb-3">
          <h2 className="text-sm font-semibold">Aksi Cepat</h2>
          <p className="text-xs text-muted-foreground">Pintasan ke fitur yang sering digunakan</p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-none transition-all hover:shadow-sm hover:border-border/80 hover:bg-accent"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${action.bg}`}>
                <action.icon className={`h-4 w-4 ${action.color}`} />
              </div>
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-sm font-medium leading-tight">{action.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{action.desc}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* WhatsApp Logs (full width, client-side pagination) */}
      <WhatsAppLogsCard period={period} />

      {/* Period filter untuk WhatsApp logs */}
      <div className="-mt-3 flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Filter:</span>
        {(['24h', '1w', 'all'] as Period[]).map((p) => (
          <Link
            key={p}
            href={`?period=${p}&s_page=${sPage}&l_page=${lPage}`}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              period === p
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {periodLabels[p]}
          </Link>
        ))}
      </div>

      {/* Mahasiswa Terbaru + Dosen Wali */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Mahasiswa Terbaru */}
        <Card className="shadow-none overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold">Mahasiswa Terbaru</CardTitle>
              <CardDescription className="text-xs">Pendaftaran terbaru</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" asChild>
              <Link href="/admin/users/students">
                Semua <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {students.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                Belum ada data mahasiswa
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-5 text-xs">Mahasiswa</TableHead>
                      <TableHead className="text-xs">NIM</TableHead>
                      <TableHead className="pr-5 text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="pl-5">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={s.avatar_url ?? ''} />
                              <AvatarFallback className="text-xs">{getInitials(s.full_name)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate max-w-[120px]">{s.full_name}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[120px]">{s.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground">{s.nim ?? '-'}</TableCell>
                        <TableCell className="pr-5">
                          <Badge
                            variant="outline"
                            className={`text-xs ${s.is_active
                              ? 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                              : 'text-muted-foreground'}`}
                          >
                            {s.is_active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalSPages > 1 && (
                  <div className="flex items-center justify-between border-t px-5 py-3">
                    <span className="text-xs text-muted-foreground">Hal. {sPage} / {totalSPages}</span>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs" asChild disabled={sPage <= 1}>
                        <Link href={`?period=${period}&s_page=${sPage - 1}&l_page=${lPage}`}>Prev</Link>
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs" asChild disabled={sPage >= totalSPages}>
                        <Link href={`?period=${period}&s_page=${sPage + 1}&l_page=${lPage}`}>Next</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Dosen Wali */}
        <Card className="shadow-none overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-semibold">Dosen Wali</CardTitle>
              <CardDescription className="text-xs">Daftar dosen wali aktif</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" asChild>
              <Link href="/admin/users/lecturers">
                Semua <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {lecturersList.length === 0 ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                Belum ada data dosen
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-5 text-xs">Dosen</TableHead>
                      <TableHead className="text-xs">Kontak</TableHead>
                      <TableHead className="text-xs text-right">Mahasiswa</TableHead>
                      <TableHead className="pr-5 text-xs text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lecturersList.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="pl-5">
                          <div className="flex items-center gap-2.5">
                            <Avatar className="h-7 w-7">
                              <AvatarImage src={l.avatar_url ?? ''} />
                              <AvatarFallback className="text-xs">{getInitials(l.full_name)}</AvatarFallback>
                            </Avatar>
                            <p className="text-xs font-medium truncate max-w-[110px]">{l.full_name}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate max-w-[100px]">
                          {l.phone ?? l.email}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary" className="text-xs tabular-nums">
                            {adviseeCountMap[l.id] ?? 0}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-5 text-right">
                          <SendLecturerDialog
                            lecturerId={l.id}
                            lecturerName={l.full_name}
                            lecturerPhone={l.phone ?? null}
                            adviseeCount={adviseeCountMap[l.id] ?? 0}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalLPages > 1 && (
                  <div className="flex items-center justify-between border-t px-5 py-3">
                    <span className="text-xs text-muted-foreground">Hal. {lPage} / {totalLPages}</span>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs" asChild disabled={lPage <= 1}>
                        <Link href={`?period=${period}&s_page=${sPage}&l_page=${lPage - 1}`}>Prev</Link>
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs" asChild disabled={lPage >= totalLPages}>
                        <Link href={`?period=${period}&s_page=${sPage}&l_page=${lPage + 1}`}>Next</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

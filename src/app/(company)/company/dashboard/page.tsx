'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Users, Briefcase, Layers, Search, ArrowRight, BarChart2, GraduationCap, Building2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, Cell, PieChart, Pie } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

interface StudentResult {
  id: string
  full_name: string
  avatar_url: string | null
  gpa?: number
  study_programs: { id: string; name: string; short_name: string | null; degree_level: string } | null
  universities: { id: string; name: string; short_name: string | null } | null
  student_portfolios: { id: string; title: string; skills: string[]; is_public: boolean; status: string }[]
  career_interests: { interest: string }[]
}

const PALETTE = ['#6366f1','#8b5cf6','#a78bfa','#c4b5fd','#818cf8','#93c5fd','#7dd3fc','#67e8f9','#6ee7b7','#86efac','#fda4af','#fcd34d']
const CAREER_PALETTE = ['#f59e0b','#f97316','#ef4444','#ec4899','#a855f7','#6366f1','#3b82f6','#06b6d4','#10b981','#84cc16']

function StatCard({ title, value, desc, icon: Icon, isLoading }: {
  title: string; value: number | string; desc: string; icon: React.ElementType; isLoading: boolean
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20 mb-1" />
        ) : (
          <div className="text-3xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1">{desc}</p>
      </CardContent>
    </Card>
  )
}

export default function CompanyDashboardPage() {
  const [students, setStudents] = useState<StudentResult[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchStudents = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/company/students?pageSize=50')
      const data = await res.json()
      if (data.success) {
        setStudents(data.data ?? [])
        setTotal(data.total ?? 0)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  const publicPortfoliosCount = students.reduce((acc, s) => acc + (s.student_portfolios ?? []).filter(p => p.is_public).length, 0)
  const uniqueSkillsCount = new Set(students.flatMap(s => s.student_portfolios?.flatMap(p => p.skills ?? []) ?? [])).size

  const skillMap = new Map<string, number>()
  for (const s of students) {
    const seen = new Set<string>()
    for (const p of s.student_portfolios ?? []) {
      for (const sk of p.skills ?? []) {
        if (!seen.has(sk)) { seen.add(sk); skillMap.set(sk, (skillMap.get(sk) ?? 0) + 1) }
      }
    }
  }
  const topSkills = Array.from(skillMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8)
    .map(([name, count], i) => ({ name, count, fill: PALETTE[i % PALETTE.length] }))

  const careerMap = new Map<string, number>()
  for (const s of students) {
    const seen = new Set<string>()
    for (const c of s.career_interests ?? []) {
      if (!seen.has(c.interest)) { seen.add(c.interest); careerMap.set(c.interest, (careerMap.get(c.interest) ?? 0) + 1) }
    }
  }
  const topCareers = Array.from(careerMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([name, count], i) => ({ name, count, fill: CAREER_PALETTE[i % CAREER_PALETTE.length] }))

  const skillChartConfig = Object.fromEntries(topSkills.map((d, i) => [`item${i}`, { label: d.name, color: PALETTE[i % PALETTE.length] }]))
  const careerChartConfig = Object.fromEntries(topCareers.map((d, i) => [`item${i}`, { label: d.name, color: CAREER_PALETTE[i % CAREER_PALETTE.length] }]))

  const quickLinks = [
    { href: '/company/students', label: 'Cari Mahasiswa', desc: 'Filter & temukan talenta', icon: Search },
    { href: '/company/profile', label: 'Profil Perusahaan', desc: 'Kelola informasi perusahaan', icon: Building2 },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Ringkasan talent pool mahasiswa</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          title="Total Mahasiswa"
          value={total}
          desc="Total profil terindeks di platform"
          icon={Users}
          isLoading={isLoading}
        />
        <StatCard
          title="Portofolio Publik"
          value={publicPortfoliosCount}
          desc="Dari mahasiswa terlihat"
          icon={Briefcase}
          isLoading={isLoading}
        />
        <StatCard
          title="Skill Unik"
          value={uniqueSkillsCount}
          desc="Dari seluruh portofolio"
          icon={Layers}
          isLoading={isLoading}
        />
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Pintasan Cepat</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {quickLinks.map((link) => (
            <Card key={link.href} className="hover:bg-accent/40 transition-colors">
              <CardContent className="p-4">
                <Link href={link.href} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <link.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{link.label}</p>
                    <p className="text-xs text-muted-foreground">{link.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Top Skill Mahasiswa</CardTitle>
            </div>
            <CardDescription>8 skill terbanyak dari portofolio publik</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
              </div>
            ) : topSkills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <GraduationCap className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground text-center">Belum ada data skill</p>
              </div>
            ) : (
              <ChartContainer config={skillChartConfig} className="h-[260px] w-full">
                <BarChart data={topSkills} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" name="Mahasiswa" radius={[0, 4, 4, 0]}>
                    {topSkills.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Distribusi Minat Karier</CardTitle>
            </div>
            <CardDescription>6 minat karier terbanyak</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Skeleton className="h-40 w-40 rounded-full" />
              </div>
            ) : topCareers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <Briefcase className="h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground text-center">Belum ada data minat karier</p>
              </div>
            ) : (
              <div className="space-y-3">
                <ChartContainer config={careerChartConfig} className="h-[180px] w-full">
                  <PieChart>
                    <Pie data={topCareers} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                      {topCareers.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {topCareers.map((c) => (
                    <Badge key={c.name} variant="secondary" className="text-xs gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: c.fill }} />
                      {c.name}
                      <span className="font-bold">{c.count}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
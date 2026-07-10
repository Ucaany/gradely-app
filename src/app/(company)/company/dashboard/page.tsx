'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Search, Filter, Users, GraduationCap, ExternalLink, ChevronDown, ChevronUp, X, Check, BarChart2, Briefcase, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, Cell } from 'recharts'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getInitials, formatGPA } from '@/lib/utils'
import { CAREER_OPTIONS } from '@/lib/constants/career'

interface StudyProgram {
  id: string
  name: string
  short_name: string | null
  degree_level: string
}

interface PortfolioLink {
  label: string
  url: string
}

interface PortfolioItem {
  id: string
  title: string
  description: string | null
  skills: string[]
  links: PortfolioLink[]
  is_public: boolean
  status: 'completed' | 'ongoing'
}

interface StudentResult {
  id: string
  full_name: string
  avatar_url: string | null
  gpa?: number
  study_programs: { id: string; name: string; short_name: string | null; degree_level: string } | null
  universities: { id: string; name: string; short_name: string | null } | null
  student_portfolios: PortfolioItem[]
  career_interests: { interest: string }[]
}

function MultiSelectDropdown({
  label,
  options,
  selected,
  onToggle,
  onClear,
}: {
  label: string
  options: { key: string; label: string }[]
  selected: string[]
  onToggle: (key: string) => void
  onClear: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex h-9 w-full items-center justify-between rounded-md border px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
          selected.length > 0 ? 'border-primary bg-primary/5' : 'border-input bg-background'
        }`}
      >
        <span className={selected.length > 0 ? 'text-foreground' : 'text-muted-foreground'}>
          {selected.length === 0 ? label : `${label} (${selected.length})`}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[200px] rounded-md border bg-popover shadow-md">
          <div className="max-h-60 overflow-y-auto p-1">
            {options.map((opt) => {
              const isSelected = selected.includes(opt.key)
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => onToggle(opt.key)}
                  className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent cursor-pointer"
                >
                  <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40'}`}>
                    {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
                  </div>
                  <span className="text-left">{opt.label}</span>
                </button>
              )
            })}
          </div>
          {selected.length > 0 && (
            <div className="border-t p-1">
              <button
                type="button"
                onClick={() => { onClear(); setOpen(false) }}
                className="flex w-full items-center gap-1.5 rounded-sm px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent cursor-pointer"
              >
                <X className="h-3 w-3" />
                Hapus semua
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const PALETTE = ['#6366f1','#8b5cf6','#a78bfa','#c4b5fd','#818cf8','#93c5fd','#7dd3fc','#67e8f9','#6ee7b7','#86efac','#fda4af','#fcd34d']
const CAREER_PALETTE = ['#f59e0b','#f97316','#ef4444','#ec4899','#a855f7','#6366f1','#3b82f6','#06b6d4','#10b981','#84cc16']

function buildChartConfig(data: { name: string }[], palette: string[]) {
  return Object.fromEntries(data.map((d, i) => [
    `item${i}`, { label: d.name, color: palette[i % palette.length] }
  ]))
}

function SkillsChart({ students }: { students: StudentResult[] }) {
  const skillMap = new Map<string, number>()
  for (const s of students) {
    const seen = new Set<string>()
    for (const p of s.student_portfolios ?? []) {
      for (const sk of p.skills ?? []) {
        if (!seen.has(sk)) { seen.add(sk); skillMap.set(sk, (skillMap.get(sk) ?? 0) + 1) }
      }
    }
  }
  const data = Array.from(skillMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 12)
    .map(([name, count], i) => ({ name, count, fill: PALETTE[i % PALETTE.length] }))

  if (data.length === 0) return (
    <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
      Belum ada data. Cari mahasiswa dulu di tab Cari.
    </div>
  )
  return (
    <ChartContainer config={buildChartConfig(data, PALETTE)} className="h-[300px] w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" name="Mahasiswa" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

function CareerChart({ students }: { students: StudentResult[] }) {
  const careerMap = new Map<string, number>()
  for (const s of students) {
    const seen = new Set<string>()
    for (const c of s.career_interests ?? []) {
      if (!seen.has(c.interest)) { seen.add(c.interest); careerMap.set(c.interest, (careerMap.get(c.interest) ?? 0) + 1) }
    }
  }
  const data = Array.from(careerMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([name, count], i) => ({ name, count, fill: CAREER_PALETTE[i % CAREER_PALETTE.length] }))

  if (data.length === 0) return (
    <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
      Belum ada data minat karier.
    </div>
  )
  return (
    <ChartContainer config={buildChartConfig(data, CAREER_PALETTE)} className="h-[300px] w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
        <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={150} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" name="Mahasiswa" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}

export default function CompanyDashboardPage() {
  const [students, setStudents] = useState<StudentResult[]>([])
  const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [selectedStudyPrograms, setSelectedStudyPrograms] = useState<string[]>([])
  const [minGpa, setMinGpa] = useState('')
  const [selectedCareers, setSelectedCareers] = useState<string[]>([])
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')

  const fetchStudyPrograms = useCallback(async () => {
    const res = await fetch('/api/company/study-programs')
    const data = await res.json()
    if (data.success) setStudyPrograms(data.data ?? [])
  }, [])

  const fetchStudents = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      selectedStudyPrograms.forEach(id => params.append('study_program_id', id))
      if (minGpa) params.set('min_gpa', minGpa)
      selectedCareers.forEach(c => params.append('career_interest', c))
      selectedSkills.forEach(s => params.append('skill', s))
      params.set('pageSize', '50')

      const res = await fetch(`/api/company/students?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setStudents(data.data ?? [])
        setTotal(data.total ?? 0)
      }
    } finally {
      setIsLoading(false)
    }
  }, [search, selectedStudyPrograms, minGpa, selectedCareers, selectedSkills])

  useEffect(() => { fetchStudyPrograms() }, [fetchStudyPrograms])

  useEffect(() => {
    const t = setTimeout(() => fetchStudents(), 300)
    return () => clearTimeout(t)
  }, [fetchStudents])

  function addSkill() {
    const trimmed = skillInput.trim()
    if (trimmed && !selectedSkills.includes(trimmed)) {
      setSelectedSkills(prev => [...prev, trimmed])
    }
    setSkillInput('')
  }

  const hasFilters = search || selectedStudyPrograms.length > 0 || minGpa || selectedCareers.length > 0 || selectedSkills.length > 0

  function resetFilters() {
    setSearch('')
    setSelectedStudyPrograms([])
    setMinGpa('')
    setSelectedCareers([])
    setSelectedSkills([])
    setSkillInput('')
  }

  function getAllSkills(student: StudentResult) {
    const skills = new Set<string>()
    for (const p of student.student_portfolios ?? []) {
      for (const s of p.skills ?? []) skills.add(s)
    }
    return Array.from(skills)
  }

  const studyProgramOptions = studyPrograms.map(sp => ({
    key: sp.id,
    label: `${sp.short_name ?? sp.name} (${sp.degree_level})`,
  }))

  const careerOptions = CAREER_OPTIONS.map(c => ({ key: c, label: c }))

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard Talent Scouting</h1>
        <p className="text-sm text-muted-foreground">Temukan dan analisis talenta mahasiswa</p>
      </div>

      <Tabs defaultValue="cari">
        <TabsList>
          <TabsTrigger value="cari" className="gap-1.5">
            <Users className="h-4 w-4" />
            Cari Mahasiswa
          </TabsTrigger>
          <TabsTrigger value="analitik" className="gap-1.5">
            <BarChart2 className="h-4 w-4" />
            Analitik Skill
          </TabsTrigger>
        </TabsList>

        {/* TAB: Cari Mahasiswa */}
        <TabsContent value="cari" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                Filter Pencarian
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari nama mahasiswa..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <div className="relative">
                  <GraduationCap className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Min IPK (mis: 3.0)"
                    value={minGpa}
                    onChange={(e) => setMinGpa(e.target.value)}
                    className="pl-8"
                    type="number"
                    min={0}
                    max={4}
                    step={0.1}
                  />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <MultiSelectDropdown
                  label="Program Studi"
                  options={studyProgramOptions}
                  selected={selectedStudyPrograms}
                  onToggle={(key) => setSelectedStudyPrograms(prev =>
                    prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]
                  )}
                  onClear={() => setSelectedStudyPrograms([])}
                />
                <MultiSelectDropdown
                  label="Minat Karier"
                  options={careerOptions}
                  selected={selectedCareers}
                  onToggle={(key) => setSelectedCareers(prev =>
                    prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]
                  )}
                  onClear={() => setSelectedCareers([])}
                />
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Tambah filter skill (mis: Figma, React)..."
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                      className="pl-8"
                    />
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={addSkill} disabled={!skillInput.trim()}>
                    Tambah
                  </Button>
                </div>
                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSkills.map(skill => (
                      <Badge key={skill} variant="secondary" className="gap-1 pr-1">
                        {skill}
                        <button type="button" onClick={() => setSelectedSkills(prev => prev.filter(s => s !== skill))} className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {hasFilters && (
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs h-7">
                    <X className="h-3 w-3 mr-1" />
                    Reset Semua Filter
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {isLoading ? 'Mencari...' : `${total} mahasiswa ditemukan`}
            </span>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : students.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
                <Users className="h-10 w-10 text-muted-foreground/30" />
                <p className="text-muted-foreground text-sm text-center">
                  Tidak ada mahasiswa yang sesuai filter.<br />
                  <span className="text-xs">Hanya mahasiswa yang mengaktifkan visibilitas profil yang muncul di sini.</span>
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {students.map((student) => {
                const skills = getAllSkills(student)
                const interests = (student.career_interests ?? []).map((c) => c.interest)
                const isExpanded = expandedId === student.id
                const publicPortfolios = (student.student_portfolios ?? []).filter(p => p.is_public)
                const allLinks = publicPortfolios.flatMap(p => p.links ?? [])
                const uniqueLinks = Array.from(new Map(allLinks.map(l => [l.url, l])).values()).slice(0, 4)

                return (
                  <Card key={student.id} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={student.avatar_url ?? ''} />
                          <AvatarFallback className="text-sm font-semibold">
                            {getInitials(student.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm">{student.full_name}</CardTitle>
                          <CardDescription className="text-xs mt-0.5">
                            {student.study_programs?.short_name ?? student.study_programs?.name ?? '-'}
                            {student.study_programs?.degree_level ? ` · ${student.study_programs.degree_level}` : ''}
                          </CardDescription>
                          {student.universities && (
                            <p className="text-xs text-muted-foreground/70 mt-0.5">{student.universities.short_name ?? student.universities.name}</p>
                          )}
                        </div>
                        {student.gpa !== undefined && student.gpa > 0 && (
                          <div className="shrink-0 text-right">
                            <div className="flex items-center gap-1 text-xs font-semibold">
                              <GraduationCap className="h-3 w-3 text-muted-foreground" />
                              <span>{formatGPA(student.gpa)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">IPK</p>
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0 flex flex-col gap-2 flex-1">
                      {interests.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {interests.slice(0, 3).map((interest) => (
                            <Badge key={interest} variant="outline" className="text-xs px-1.5 py-0">{interest}</Badge>
                          ))}
                          {interests.length > 3 && <Badge variant="outline" className="text-xs px-1.5 py-0">+{interests.length - 3}</Badge>}
                        </div>
                      )}

                      {skills.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {skills.slice(0, isExpanded ? skills.length : 4).map((s) => (
                            <Badge key={s} variant="secondary" className="text-xs px-1.5 py-0">{s}</Badge>
                          ))}
                          {!isExpanded && skills.length > 4 && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">+{skills.length - 4}</Badge>
                          )}
                        </div>
                      )}

                      {isExpanded && publicPortfolios.length > 0 && (
                        <>
                          <Separator />
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground">Portofolio ({publicPortfolios.length} item)</p>
                            {publicPortfolios.map((p) => (
                              <div key={p.id} className="space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-medium truncate">{p.title}</p>
                                  <Badge variant={p.status === 'ongoing' ? 'default' : 'secondary'} className="text-xs px-1.5 py-0 shrink-0">
                                    {p.status === 'ongoing' ? 'Berlangsung' : 'Selesai'}
                                  </Badge>
                                </div>
                                {p.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                                )}
                                {p.skills?.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {p.skills.slice(0, 4).map(sk => (
                                      <Badge key={sk} variant="outline" className="text-xs px-1 py-0">{sk}</Badge>
                                    ))}
                                  </div>
                                )}
                                {(p.links ?? []).length > 0 && (
                                  <div className="flex flex-wrap gap-2">
                                    {p.links.map((link) => (
                                      <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                                        <ExternalLink className="h-3 w-3" />
                                        {link.label}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      {!isExpanded && uniqueLinks.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-auto pt-1">
                          {uniqueLinks.map((link) => (
                            <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                              <ExternalLink className="h-3 w-3" />
                              {link.label}
                            </a>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-end mt-auto pt-2">
                        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs"
                          onClick={() => setExpandedId(isExpanded ? null : student.id)}>
                          {isExpanded
                            ? <><ChevronUp className="h-3 w-3 mr-1" />Ringkas</>
                            : <><ChevronDown className="h-3 w-3 mr-1" />Lihat Portofolio</>
                          }
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB: Analitik */}
        <TabsContent value="analitik" className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mahasiswa Terlihat</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{total}</div>
                <p className="text-xs text-muted-foreground mt-1">Profil aktif &amp; consent aktif</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Portofolio Publik</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {students.reduce((acc, s) => acc + (s.student_portfolios ?? []).filter(p => p.is_public).length, 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Dari hasil pencarian aktif</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Skill Unik</CardTitle>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {new Set(students.flatMap(s => s.student_portfolios?.flatMap(p => p.skills ?? []) ?? [])).size}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Dari hasil pencarian aktif</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Skill Mahasiswa</CardTitle>
                <CardDescription>Skill paling banyak dimiliki dari hasil filter</CardDescription>
              </CardHeader>
              <CardContent>
                <SkillsChart students={students} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribusi Minat Karier</CardTitle>
                <CardDescription>Minat karier terbanyak dari hasil filter</CardDescription>
              </CardHeader>
              <CardContent>
                <CareerChart students={students} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

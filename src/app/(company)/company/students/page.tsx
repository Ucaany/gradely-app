'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Search, Users, GraduationCap, ExternalLink, ChevronDown, ChevronUp, X, Check, Filter, RefreshCw } from 'lucide-react'
import { LinkPreview } from '@/components/shared/link-preview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { getInitials, formatGPA } from '@/lib/utils'
import { CAREER_OPTIONS } from '@/lib/constants/career'
import { toast } from 'sonner'

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
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="relative" ref={ref}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(o => !o)}
        className={`w-full justify-between font-normal h-9 ${selected.length > 0 ? 'border-primary bg-primary/5' : ''}`}
      >
        <span className={`truncate ${selected.length === 0 ? 'text-muted-foreground' : ''}`}>
          {selected.length === 0 ? label : `${label} (${selected.length})`}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
      </Button>
      {open && (
        <div className="absolute z-50 mt-1 w-full min-w-[220px] rounded-md border bg-popover shadow-md">
          <div className="p-2 border-b">
            <Input
              placeholder={`Cari ${label.toLowerCase()}...`}
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="h-7 text-xs"
              autoFocus
            />
          </div>
          <div className="max-h-52 overflow-y-auto p-1">
            {filtered.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">Tidak ditemukan.</p>
            ) : filtered.map((opt) => {
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
                onClick={() => { onClear(); setQuery(''); setOpen(false) }}
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

export default function CompanyStudentsPage() {
  const [students, setStudents] = useState<StudentResult[]>([])
  const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
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
      if (data.success) { setStudents(data.data ?? []); setTotal(data.total ?? 0) }
    } finally {
      setIsLoading(false)
    }
  }, [search, selectedStudyPrograms, minGpa, selectedCareers, selectedSkills])

  useEffect(() => { fetchStudyPrograms() }, [fetchStudyPrograms])
  useEffect(() => {
    const t = setTimeout(() => fetchStudents(), 300)
    return () => clearTimeout(t)
  }, [fetchStudents])

  async function handleSync() {
    setIsSyncing(true)
    try {
      const res = await fetch('/api/company/sync-students')
      const data = await res.json()
      if (data.success) {
        await fetchStudents()
        toast.success(`Sinkronisasi selesai — ${data.data.total} mahasiswa tersedia`)
      }
    } finally {
      setIsSyncing(false)
    }
  }

  function addSkill() {
    const trimmed = skillInput.trim()
    if (trimmed && !selectedSkills.includes(trimmed)) setSelectedSkills(prev => [...prev, trimmed])
    setSkillInput('')
  }

  const hasFilters = search || selectedStudyPrograms.length > 0 || minGpa || selectedCareers.length > 0 || selectedSkills.length > 0

  function resetFilters() {
    setSearch(''); setSelectedStudyPrograms([]); setMinGpa('')
    setSelectedCareers([]); setSelectedSkills([]); setSkillInput('')
  }

  function getAllSkills(student: StudentResult) {
    const skills = new Set<string>()
    for (const p of student.student_portfolios ?? []) for (const s of p.skills ?? []) skills.add(s)
    return Array.from(skills)
  }

  const studyProgramOptions = studyPrograms.map(sp => ({
    key: sp.id,
    label: `${sp.short_name ?? sp.name} (${sp.degree_level})`,
  }))
  const careerOptions = CAREER_OPTIONS.map(c => ({ key: c, label: c }))

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cari Mahasiswa</h1>
          <p className="text-sm text-muted-foreground">Temukan talenta sesuai kebutuhan perusahaan</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing} className="gap-1.5 shrink-0">
          <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
          Sinkronisasi
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Filter Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama mahasiswa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <MultiSelectDropdown
              label="Program Studi"
              options={studyProgramOptions}
              selected={selectedStudyPrograms}
              onToggle={(key) => setSelectedStudyPrograms(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key])}
              onClear={() => setSelectedStudyPrograms([])}
            />
            <MultiSelectDropdown
              label="Minat Karier"
              options={careerOptions}
              selected={selectedCareers}
              onToggle={(key) => setSelectedCareers(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key])}
              onClear={() => setSelectedCareers([])}
            />
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

          <div className="flex gap-2 flex-wrap items-center">
            <div className="flex gap-2 flex-1 min-w-0 max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tambah filter skill (mis: React)..."
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
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs h-7 ml-auto">
                <X className="h-3 w-3 mr-1" />
                Reset Filter
              </Button>
            )}
          </div>
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
                      <AvatarFallback className="text-sm font-semibold">{getInitials(student.full_name)}</AvatarFallback>
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
                            {p.description && <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>}
                            {p.skills?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {p.skills.slice(0, 4).map(sk => (
                                  <Badge key={sk} variant="outline" className="text-xs px-1 py-0">{sk}</Badge>
                                ))}
                              </div>
                            )}
                            {(p.links ?? []).length > 0 && (
                              <div className="flex flex-col gap-2">
                                {p.links.map((link) => (
                                  <LinkPreview key={link.url} url={link.url} label={link.label} />
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {!isExpanded && uniqueLinks.length > 0 && (
                    <div className="flex flex-col gap-2 mt-auto pt-1">
                      {uniqueLinks.map((link) => (
                        <LinkPreview key={link.url} url={link.url} label={link.label} />
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
    </div>
  )
}
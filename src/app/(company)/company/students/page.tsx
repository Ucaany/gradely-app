'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Filter, Users, GraduationCap, ExternalLink, GitBranch, ChevronDown, ChevronUp, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { getInitials, formatGPA } from '@/lib/utils'
import { CAREER_OPTIONS } from '@/lib/constants/career'

interface StudyProgram {
  id: string
  name: string
  short_name: string | null
  degree_level: string
}

interface PortfolioItem {
  id: string
  title: string
  skills: string[]
  url_github: string | null
  url_behance: string | null
  url_website: string | null
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

function MultiSelectBadges({
  options,
  selected,
  onToggle,
  placeholder,
}: {
  options: string[]
  selected: string[]
  onToggle: (val: string) => void
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full min-h-9 items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {selected.length === 0 ? (
          <span className="text-muted-foreground truncate">{placeholder}</span>
        ) : (
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {selected.map((s) => (
              <Badge key={s} variant="secondary" className="text-xs px-1.5 py-0 gap-1">
                {s}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); onToggle(s) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onToggle(s) } }}
                  className="cursor-pointer hover:text-destructive"
                >
                  <X className="h-2.5 w-2.5" />
                </span>
              </Badge>
            ))}
          </div>
        )}
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-auto" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-md border bg-popover shadow-md">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={`flex w-full items-center px-3 py-2 text-sm hover:bg-accent ${selected.includes(opt) ? 'bg-accent font-medium' : ''}`}
            >
              <span className="flex-1 text-left">{opt}</span>
              {selected.includes(opt) && <X className="h-3 w-3 text-muted-foreground shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function StudyProgramMultiSelect({
  programs,
  selected,
  onToggle,
}: {
  programs: StudyProgram[]
  selected: string[]
  onToggle: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const selectedNames = programs.filter((p) => selected.includes(p.id)).map((p) => p.short_name ?? p.name)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full min-h-9 items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {selected.length === 0 ? (
          <span className="text-muted-foreground truncate">Semua Program Studi</span>
        ) : (
          <div className="flex flex-wrap gap-1 flex-1 min-w-0">
            {selectedNames.map((name) => (
              <Badge key={name} variant="secondary" className="text-xs px-1.5 py-0 gap-1">
                {name}
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation()
                    const prog = programs.find((p) => (p.short_name ?? p.name) === name)
                    if (prog) onToggle(prog.id)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.stopPropagation()
                      const prog = programs.find((p) => (p.short_name ?? p.name) === name)
                      if (prog) onToggle(prog.id)
                    }
                  }}
                  className="cursor-pointer hover:text-destructive"
                >
                  <X className="h-2.5 w-2.5" />
                </span>
              </Badge>
            ))}
          </div>
        )}
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-auto" />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-52 overflow-y-auto rounded-md border bg-popover shadow-md">
          {programs.map((prog) => (
            <button
              key={prog.id}
              type="button"
              onClick={() => onToggle(prog.id)}
              className={`flex w-full items-center px-3 py-2 text-sm hover:bg-accent ${selected.includes(prog.id) ? 'bg-accent font-medium' : ''}`}
            >
              <span className="flex-1 text-left">
                {prog.short_name ?? prog.name}
                <span className="text-muted-foreground ml-1 font-normal">({prog.degree_level})</span>
              </span>
              {selected.includes(prog.id) && <X className="h-3 w-3 text-muted-foreground shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function CompanyStudentsPage() {
  const [students, setStudents] = useState<StudentResult[]>([])
  const [studyPrograms, setStudyPrograms] = useState<StudyProgram[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([])
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
      if (minGpa) params.set('min_gpa', minGpa)
      selectedPrograms.forEach((id) => params.append('study_program_id', id))
      selectedCareers.forEach((c) => params.append('career_interest', c))
      selectedSkills.forEach((s) => params.append('skill', s))
      params.set('pageSize', '24')

      const res = await fetch(`/api/company/students?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setStudents(data.data ?? [])
        setTotal(data.total ?? 0)
      }
    } finally {
      setIsLoading(false)
    }
  }, [search, selectedPrograms, minGpa, selectedCareers, selectedSkills])

  useEffect(() => { fetchStudyPrograms() }, [fetchStudyPrograms])

  useEffect(() => {
    const t = setTimeout(() => { fetchStudents() }, 300)
    return () => clearTimeout(t)
  }, [fetchStudents])

  function toggleProgram(id: string) {
    setSelectedPrograms((prev) => prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id])
  }

  function toggleCareer(c: string) {
    setSelectedCareers((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c])
  }

  function toggleSkill(s: string) {
    setSelectedSkills((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  function addSkillFromInput() {
    const val = skillInput.trim()
    if (val && !selectedSkills.includes(val)) {
      setSelectedSkills((prev) => [...prev, val])
    }
    setSkillInput('')
  }

  function resetFilters() {
    setSearch('')
    setSelectedPrograms([])
    setMinGpa('')
    setSelectedCareers([])
    setSelectedSkills([])
    setSkillInput('')
  }

  const hasFilters = search || selectedPrograms.length > 0 || minGpa || selectedCareers.length > 0 || selectedSkills.length > 0

  function getAllSkills(student: StudentResult) {
    const skills = new Set<string>()
    for (const p of student.student_portfolios ?? []) {
      for (const s of p.skills ?? []) skills.add(s)
    }
    return Array.from(skills)
  }

  function getPortfolioLinks(student: StudentResult) {
    const links: { url: string; label: string; icon: typeof GitBranch }[] = []
    for (const p of student.student_portfolios ?? []) {
      if (p.url_github) links.push({ url: p.url_github, label: 'GitHub', icon: GitBranch })
      if (p.url_behance) links.push({ url: p.url_behance, label: 'Behance', icon: ExternalLink })
      if (p.url_website) links.push({ url: p.url_website, label: 'Website', icon: ExternalLink })
    }
    return Array.from(new Map(links.map((l) => [l.url, l])).values()).slice(0, 3)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cari Mahasiswa</h1>
        <p className="text-sm text-muted-foreground">
          Temukan talenta mahasiswa yang sesuai dengan kebutuhan perusahaan kamu
        </p>
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

            <StudyProgramMultiSelect
              programs={studyPrograms}
              selected={selectedPrograms}
              onToggle={toggleProgram}
            />

            <MultiSelectBadges
              options={CAREER_OPTIONS}
              selected={selectedCareers}
              onToggle={toggleCareer}
              placeholder="Semua Minat Karier"
            />

            <Input
              placeholder="Min IPK (mis: 3.0)"
              value={minGpa}
              onChange={(e) => setMinGpa(e.target.value)}
              type="number"
              min={0}
              max={4}
              step={0.1}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-2 flex-1 min-w-0 max-w-sm">
              <Input
                placeholder="Tambah filter skill (mis: Figma)"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkillFromInput() } }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addSkillFromInput} disabled={!skillInput.trim()}>
                Tambah
              </Button>
            </div>
            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedSkills.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs gap-1">
                    {s}
                    <button type="button" onClick={() => toggleSkill(s)} className="hover:text-destructive">
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="shrink-0">
                Reset Filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {isLoading ? 'Mencari...' : `${total} mahasiswa ditemukan`}
            </span>
          </div>
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
              const links = getPortfolioLinks(student)
              const interests = (student.career_interests ?? []).map((c) => c.interest)
              const isExpanded = expandedId === student.id

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
                          <Badge key={interest} variant="outline" className="text-xs px-1.5 py-0">
                            {interest}
                          </Badge>
                        ))}
                        {interests.length > 3 && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0">
                            +{interests.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {skills.slice(0, isExpanded ? skills.length : 4).map((s) => (
                          <Badge key={s} variant="secondary" className="text-xs px-1.5 py-0">
                            {s}
                          </Badge>
                        ))}
                        {!isExpanded && skills.length > 4 && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            +{skills.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}

                    {isExpanded && (
                      <>
                        <Separator />
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            Portofolio ({student.student_portfolios?.length ?? 0} item)
                          </p>
                          {(student.student_portfolios ?? []).slice(0, 3).map((p) => (
                            <p key={p.id} className="text-xs truncate text-foreground">{p.title}</p>
                          ))}
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-between mt-auto pt-2">
                      {links.length > 0 ? (
                        <div className="flex gap-2">
                          {links.map(({ url, label, icon: Icon }) => (
                            <a
                              key={url}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                            >
                              <Icon className="h-3 w-3" />
                              {label}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setExpandedId(isExpanded ? null : student.id)}
                      >
                        {isExpanded ? (
                          <><ChevronUp className="h-3 w-3 mr-1" />Ringkas</>
                        ) : (
                          <><ChevronDown className="h-3 w-3 mr-1" />Detail</>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

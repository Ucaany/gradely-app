'use client'

import { useState } from 'react'
import { LayoutGrid, List, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AcademicRuleActions } from '@/components/admin/academic-rule-actions'
import type { AcademicRule, StudyProgram } from '@/types'

interface Props {
  programRules: (AcademicRule & { study_programs: { name: string; short_name: string | null } | null })[]
  programs: Pick<StudyProgram, 'id' | 'name' | 'short_name'>[]
  universityId: string
}

export function AcademicRulesView({ programRules, programs, universityId }: Props) {
  const [view, setView] = useState<'grid' | 'list'>('grid')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Aturan per Program Studi</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{programRules.length} aturan khusus dikonfigurasi</p>
        </div>
        <div className="flex items-center rounded-lg border p-0.5 gap-0.5">
          <Button
            variant={view === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setView('grid')}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={view === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setView('list')}
          >
            <List className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {programRules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-2 text-center">
            <GraduationCap className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium">Belum ada aturan khusus</p>
            <p className="text-xs text-muted-foreground">Program studi akan menggunakan aturan default kampus</p>
          </CardContent>
        </Card>
      ) : view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {programRules.map((rule) => (
            <GridCard key={rule.id} rule={rule} programs={programs} universityId={universityId} />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y">
            {programRules.map((rule) => (
              <ListRow key={rule.id} rule={rule} programs={programs} universityId={universityId} />
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function GridCard({ rule, programs, universityId }: {
  rule: AcademicRule & { study_programs: { name: string; short_name: string | null } | null }
  programs: Pick<StudyProgram, 'id' | 'name' | 'short_name'>[]
  universityId: string
}) {
  const programName = rule.study_programs?.name ?? 'Program Studi'
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </div>
            <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">{programName}</CardTitle>
          </div>
          <div className="shrink-0">
            <AcademicRuleActions mode="edit" rule={rule} studyPrograms={programs} universityId={universityId} />
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-col gap-1.5">
          {[
            { label: 'Total SKS', value: `${rule.total_sks_graduation} SKS` },
            { label: 'Semester Normal / Maks', value: `${rule.normal_semester} / ${rule.max_semester} Sem` },
            { label: 'IPK Minimum', value: rule.min_gpa.toString() },
            { label: 'SKS per Semester', value: `${rule.min_sks_per_semester}–${rule.max_sks_per_semester} SKS` },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-0.5">
              <span className="text-xs text-muted-foreground">{item.label}</span>
              <span className="text-xs font-medium">{item.value}</span>
            </div>
          ))}
          <Separator className="my-1" />
          <div className="flex items-center justify-between py-0.5">
            <span className="text-xs text-muted-foreground">Nilai Lulus Min</span>
            <Badge variant="secondary" className="text-xs font-semibold">{rule.passing_grade}</Badge>
          </div>
          {rule.grade_scale && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {Object.entries(rule.grade_scale as unknown as Record<string, number>).map(([g, v]) => (
                <div key={g} className="flex items-center gap-1 rounded border bg-muted/40 px-2 py-0.5">
                  <span className="text-xs font-semibold">{g}</span>
                  <span className="text-xs text-muted-foreground">={v.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ListRow({ rule, programs, universityId }: {
  rule: AcademicRule & { study_programs: { name: string; short_name: string | null } | null }
  programs: Pick<StudyProgram, 'id' | 'name' | 'short_name'>[]
  universityId: string
}) {
  const programName = rule.study_programs?.name ?? 'Program Studi'
  return (
    <div className="flex items-center gap-4 px-4 py-3 sm:px-6 hover:bg-muted/30 transition-colors">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <GraduationCap className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{programName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {rule.total_sks_graduation} SKS · Sem {rule.normal_semester}/{rule.max_semester} · IPK min {rule.min_gpa}
        </p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Lulus Min</span>
          <Badge variant="secondary" className="text-xs font-semibold">{rule.passing_grade}</Badge>
        </div>
        <AcademicRuleActions mode="edit" rule={rule} studyPrograms={programs} universityId={universityId} />
      </div>
    </div>
  )
}

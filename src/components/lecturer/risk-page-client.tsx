'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { AlertTriangle, ArrowRight, CheckCircle2, LayoutGrid, List } from 'lucide-react'
import { getInitials, formatGPA } from '@/lib/utils'
import { ACADEMIC_STATUS_CONFIG } from '@/lib/utils/academic'
import { SendMessageDialog } from '@/components/lecturer/send-message-dialog'
import type { AcademicStatus } from '@/types'

interface Student {
  id: string
  full_name: string
  nim: string | null
  avatar_url: string | null
  current_semester: number | null
  study_programs: { name: string; short_name: string | null } | null
}

interface RiskIndicator {
  label: string
  active: boolean
}

interface StudentSummaryItem {
  student: Student
  summary: {
    academic_status: AcademicStatus
    gpa: number
    courses_retake: number
    sks_percentage: number
    predicted_graduation_semester: number
  }
  riskIndicators: RiskIndicator[]
}

interface Section {
  title: string
  items: StudentSummaryItem[]
  emptyMsg: string
  colorClass: string
}

interface RiskPageClientProps {
  sections: Section[]
  totalStudents: number
  atRiskCount: number
}

export function RiskPageClient({ sections, totalStudents, atRiskCount }: RiskPageClientProps) {
  const [mode, setMode] = useState<'grid' | 'list'>('grid')

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Monitoring Risiko</h1>
          <p className="text-sm text-muted-foreground">
            {atRiskCount} mahasiswa berisiko dari {totalStudents} total bimbingan
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-1 shrink-0">
          <Button
            variant={mode === 'grid' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setMode('grid')}
            title="Grid view"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant={mode === 'list' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-7 w-7"
            onClick={() => setMode('list')}
            title="List view"
          >
            <List className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {totalStudents === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Belum ada mahasiswa bimbingan</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/lecturer/join-code">Buat Kode Bergabung</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {sections.map(({ title, items, emptyMsg, colorClass }) => (
        <div key={title}>
          <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            {title} ({items.length})
          </h2>
          {items.length === 0 ? (
            <div className={`rounded-xl border px-4 py-6 text-center text-sm text-muted-foreground ${colorClass}`}>
              {emptyMsg}
            </div>
          ) : mode === 'grid' ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map(({ student, summary, riskIndicators }) => {
                const cfg = ACADEMIC_STATUS_CONFIG[summary.academic_status]
                const prog = (student.study_programs && typeof student.study_programs === 'object' && !Array.isArray(student.study_programs))
                  ? (student.study_programs as { name: string; short_name: string | null }).short_name ?? (student.study_programs as { name: string }).name
                  : null
                const activeRisks = riskIndicators.filter((r) => r.active)

                return (
                  <Card key={student.id} className={`border ${colorClass}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={student.avatar_url ?? ''} />
                          <AvatarFallback className="text-xs">{getInitials(student.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm truncate">{student.full_name}</CardTitle>
                          <CardDescription className="text-xs">{student.nim ?? '-'} · {prog} · Sem {student.current_semester}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={`text-xs ${cfg.color} border-current`}>
                          {cfg.label}
                        </Badge>
                        <span className="text-sm font-semibold tabular-nums">IPK {formatGPA(summary.gpa)}</span>
                      </div>
                      {activeRisks.length > 0 && (
                        <div className="space-y-1">
                          {activeRisks.map((r) => (
                            <div key={r.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <AlertTriangle className="h-3 w-3 text-orange-500 shrink-0" />
                              {r.label}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <SendMessageDialog studentId={student.id} studentName={student.full_name} trigger={
                          <Button variant="outline" size="sm" className="flex-1 text-xs">
                            Kirim Pesan WA
                          </Button>
                        } />
                        <Button variant="outline" size="sm" className="flex-1 text-xs" asChild>
                          <Link href={`/lecturer/students/${student.id}`}>
                            Detail <ArrowRight className="h-3 w-3 ml-1" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0 pb-2">
                {items.map(({ student, summary, riskIndicators }, i) => {
                  const cfg = ACADEMIC_STATUS_CONFIG[summary.academic_status]
                  const prog = (student.study_programs && typeof student.study_programs === 'object' && !Array.isArray(student.study_programs))
                    ? (student.study_programs as { name: string; short_name: string | null }).short_name ?? (student.study_programs as { name: string }).name
                    : null
                  const activeRisks = riskIndicators.filter((r) => r.active)

                  return (
                    <div key={student.id}>
                      {i > 0 && <div className="mx-4 border-t" />}
                      <div className="flex items-center gap-3 px-4 py-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={student.avatar_url ?? ''} />
                          <AvatarFallback className="text-xs">{getInitials(student.full_name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{student.full_name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {student.nim ?? '-'} · {prog} · Sem {student.current_semester}
                            {activeRisks.length > 0 && (
                              <span className="ml-2 text-orange-500">· {activeRisks.length} indikator</span>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-sm font-semibold tabular-nums hidden sm:inline">{formatGPA(summary.gpa)}</span>
                          <Badge variant="outline" className={`text-xs hidden md:inline-flex ${cfg.color} border-current`}>
                            {cfg.label}
                          </Badge>
                          <SendMessageDialog studentId={student.id} studentName={student.full_name} trigger={
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">WA</Button>
                          } />
                          <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                            <Link href={`/lecturer/students/${student.id}`}>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )}
        </div>
      ))}
    </div>
  )
}

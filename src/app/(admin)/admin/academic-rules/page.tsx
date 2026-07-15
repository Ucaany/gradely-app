import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AcademicRuleActions } from '@/components/admin/academic-rule-actions'
import { AcademicRulesView } from '@/components/admin/academic-rules-view'
import { BookOpen } from 'lucide-react'
import type { SKSRulesByIPK } from '@/types'

export default async function AcademicRulesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: rules }, { data: programs }, { data: universities }] = await Promise.all([
    supabase.from('academic_rules').select('*, study_programs(id, name, short_name)').order('created_at'),
    supabase.from('study_programs').select('id, name, short_name').eq('is_active', true).order('name'),
    supabase.from('universities').select('id, name, short_name').limit(1).single(),
  ])

  const defaultRule = rules?.find((r) => !r.study_program_id)
  const programRules = rules?.filter((r) => r.study_program_id) ?? []
  const universityId = (universities as { id: string } | null)?.id ?? ''

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Aturan Akademik</h1>
          <p className="text-sm text-muted-foreground">Konfigurasi aturan akademik per program studi</p>
        </div>
        <div className="shrink-0 self-start sm:self-auto">
          <AcademicRuleActions mode="create" studyPrograms={programs ?? []} universityId={universityId} />
        </div>
      </div>

      {/* Default Rule */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Aturan Default Kampus</CardTitle>
                <CardDescription className="text-xs mt-0.5">Digunakan apabila program studi tidak memiliki aturan khusus</CardDescription>
              </div>
            </div>
            {defaultRule && (
              <div className="shrink-0">
                <AcademicRuleActions mode="edit" rule={defaultRule} studyPrograms={programs ?? []} universityId={universityId} />
              </div>
            )}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-5">
          {defaultRule ? (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                <RuleItem label="Total SKS" value={`${defaultRule.total_sks_graduation} SKS`} />
                <RuleItem label="Semester Normal" value={`${defaultRule.normal_semester} Sem`} />
                <RuleItem label="Semester Maks" value={`${defaultRule.max_semester} Sem`} />
                <RuleItem label="IPK Minimum" value={defaultRule.min_gpa.toString()} />
                <RuleItem label="SKS Maks/Sem" value={`${defaultRule.max_sks_per_semester} SKS`} />
                <RuleItem label="Nilai Lulus Min" value={
                  <Badge variant="secondary" className="text-xs font-semibold w-fit">{defaultRule.passing_grade}</Badge>
                } />
              </div>

              {/* Tabel Batas SKS Berdasarkan IPK */}
              {defaultRule.sks_rules_by_ipk && (
                <>
                  <Separator />
                  <SKSTiersTable sksRules={defaultRule.sks_rules_by_ipk as SKSRulesByIPK} />
                </>
              )}

              {defaultRule.grade_scale && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Skala Nilai</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(defaultRule.grade_scale as Record<string, number>).map(([g, v]) => (
                        <div key={g} className="flex items-center gap-1.5 rounded-lg border bg-muted/40 px-3 py-1.5">
                          <span className="text-sm font-semibold">{g}</span>
                          <span className="text-xs text-muted-foreground">= {v.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
              <p className="text-sm text-muted-foreground">Aturan default belum dikonfigurasi.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Per Program Studi */}
      <AcademicRulesView
        programRules={programRules}
        programs={programs ?? []}
        universityId={universityId}
      />
    </div>
  )
}

function RuleItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      {typeof value === 'string'
        ? <p className="text-sm font-semibold">{value}</p>
        : value
      }
    </div>
  )
}

function SKSTiersTable({ sksRules }: { sksRules: SKSRulesByIPK }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
         Batas SKS Berdasarkan IPK
      </p>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
          <span className="text-xs text-muted-foreground">Semester 1 &amp; 2 (sistem paket):</span>
          <span className="text-sm font-semibold">Maks {sksRules.semester_1_2_max} SKS</span>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Semester 3 ke atas (berdasarkan IPK):</p>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Rentang IPK</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">SKS yang Diizinkan</th>
                </tr>
              </thead>
              <tbody>
                {sksRules.tiers.map((tier, i) => (
                  <tr key={i} className={i < sksRules.tiers.length - 1 ? 'border-b' : ''}>
                    <td className="px-3 py-2 font-medium text-sm">{tier.ipk_min.toFixed(2)} – {tier.ipk_max.toFixed(2)}</td>
                    <td className="px-3 py-2 text-sm">{tier.sks_min} – {tier.sks_max} SKS</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}


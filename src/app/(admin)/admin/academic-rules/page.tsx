import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AcademicRuleActions } from '@/components/admin/academic-rule-actions'
import { AcademicRulesView } from '@/components/admin/academic-rules-view'
import { BookOpen, GraduationCap, Clock, TrendingUp, AlertTriangle } from 'lucide-react'
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
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Aturan Akademik</h1>
          <p className="text-sm text-muted-foreground">Konfigurasi aturan kelulusan dan batas SKS per program studi</p>
        </div>
        <div className="shrink-0 self-start sm:self-auto">
          <AcademicRuleActions mode="create" studyPrograms={programs ?? []} universityId={universityId} />
        </div>
      </div>

      {/* Info banner jika belum ada aturan default */}
      {!defaultRule && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">Aturan default belum dikonfigurasi</p>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80 mt-0.5">
              Tanpa aturan default, sistem akan menggunakan nilai bawaan. Tambahkan aturan default kampus untuk akurasi perhitungan status akademik.
            </p>
          </div>
        </div>
      )}

      {/* Default Rule */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Aturan Default Kampus</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Berlaku untuk semua prodi yang tidak punya aturan khusus
                </CardDescription>
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
            <div className="flex flex-col gap-6">
              {/* Stat cards ringkas */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                <StatCard
                  icon={GraduationCap}
                  label="Total SKS"
                  value={`${defaultRule.total_sks_graduation}`}
                  unit="SKS"
                  color="text-blue-600 bg-blue-50 dark:bg-blue-950/30"
                />
                <StatCard
                  icon={Clock}
                  label="Sem Normal"
                  value={`${defaultRule.normal_semester}`}
                  unit="Semester"
                  color="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
                />
                <StatCard
                  icon={Clock}
                  label="Sem Maks"
                  value={`${defaultRule.max_semester}`}
                  unit="Semester"
                  color="text-orange-600 bg-orange-50 dark:bg-orange-950/30"
                />
                <StatCard
                  icon={TrendingUp}
                  label="IPK Min"
                  value={`${defaultRule.min_gpa}`}
                  unit="IPK"
                  color="text-violet-600 bg-violet-50 dark:bg-violet-950/30"
                />
                <StatCard
                  icon={BookOpen}
                  label="SKS Maks/Sem"
                  value={`${defaultRule.max_sks_per_semester}`}
                  unit="SKS"
                  color="text-cyan-600 bg-cyan-50 dark:bg-cyan-950/30"
                />
                <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">Nilai Lulus Min</p>
                  <Badge variant="secondary" className="text-sm font-bold w-fit mt-0.5">{defaultRule.passing_grade}</Badge>
                </div>
              </div>

              {/* Batas SKS berdasarkan IPS */}
              {defaultRule.sks_rules_by_ipk && (
                <>
                  <Separator />
                  <SKSTiersTable sksRules={defaultRule.sks_rules_by_ipk as SKSRulesByIPK} />
                </>
              )}

              {/* Skala Nilai */}
              {defaultRule.grade_scale && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Skala Nilai</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(defaultRule.grade_scale as Record<string, number>).map(([g, v]) => (
                        <div key={g} className="flex items-center gap-1.5 rounded-lg border bg-muted/40 px-3 py-1.5">
                          <span className="text-sm font-bold">{g}</span>
                          <span className="text-xs text-muted-foreground">= {v.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Belum ada aturan default</p>
                <p className="text-xs text-muted-foreground mt-1">Klik &ldquo;Tambah Aturan&rdquo; untuk memulai konfigurasi</p>
              </div>
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

function StatCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  unit: string
  color: string
}) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        <div className={`flex h-5 w-5 items-center justify-center rounded ${color}`}>
          <Icon className="h-3 w-3" />
        </div>
        <p className="text-xs text-muted-foreground truncate">{label}</p>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold">{value}</span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
    </div>
  )
}

function SKSTiersTable({ sksRules }: { sksRules: SKSRulesByIPK }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
        Batas SKS Berdasarkan IPS
      </p>
      <div className="flex flex-col gap-3">
        {/* Semester 1-2 */}
        <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2.5">
          <div>
            <p className="text-sm font-medium">Semester 1 & 2</p>
            <p className="text-xs text-muted-foreground">Sistem paket, tidak bergantung IPS</p>
          </div>
          <Badge variant="outline" className="font-semibold text-sm">
            Maks {sksRules.semester_1_2_max} SKS
          </Badge>
        </div>

        {/* Semester 3+ */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">Semester 3 ke atas — berdasarkan IPS semester sebelumnya:</p>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">Rentang IPS</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">SKS yang Diizinkan</th>
                </tr>
              </thead>
              <tbody>
                {sksRules.tiers.map((tier, i) => (
                  <tr key={i} className={i < sksRules.tiers.length - 1 ? 'border-b' : ''}>
                    <td className="px-4 py-2.5 font-medium">{tier.ipk_min.toFixed(2)} – {tier.ipk_max.toFixed(2)}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="secondary" className="font-mono text-xs">
                        {tier.sks_min} – {tier.sks_max} SKS
                      </Badge>
                    </td>
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

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AcademicRuleActions } from '@/components/admin/academic-rule-actions'

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

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base">Aturan Default Kampus</CardTitle>
              <CardDescription>Digunakan apabila program studi tidak memiliki aturan khusus</CardDescription>
            </div>
            {defaultRule && (
              <div className="shrink-0">
                <AcademicRuleActions mode="edit" rule={defaultRule} studyPrograms={programs ?? []} universityId={universityId} />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {defaultRule ? (
            <div className="grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3">
              <RuleItem label="Total SKS Kelulusan" value={`${defaultRule.total_sks_graduation} SKS`} />
              <RuleItem label="Semester Normal" value={`${defaultRule.normal_semester} Semester`} />
              <RuleItem label="Semester Maksimal" value={`${defaultRule.max_semester} Semester`} />
              <RuleItem label="IPK Minimum" value={defaultRule.min_gpa.toString()} />
              <RuleItem label="SKS Maks/Semester" value={`${defaultRule.max_sks_per_semester} SKS`} />
              <RuleItem label="Nilai Lulus Minimum" value={defaultRule.passing_grade} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Aturan default belum dikonfigurasi.</p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Aturan per Program Studi</h2>
        {programRules.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {programRules.map((rule) => (
              <Card key={rule.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-semibold leading-tight line-clamp-1">
                      {(rule.study_programs as { name: string } | null)?.name ?? 'Program Studi'}
                    </CardTitle>
                    <div className="shrink-0">
                      <AcademicRuleActions mode="edit" rule={rule} studyPrograms={programs ?? []} universityId={universityId} />
                    </div>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4 pb-4">
                  <div className="space-y-2">
                    {[
                      { label: 'Total SKS', value: `${rule.total_sks_graduation} SKS` },
                      { label: 'Semester Normal', value: `${rule.normal_semester} Semester` },
                      { label: 'Semester Maksimal', value: `${rule.max_semester} Semester` },
                      { label: 'IPK Minimum', value: `${rule.min_gpa}` },
                      { label: 'Nilai Lulus Min.', value: rule.passing_grade },
                      { label: 'SKS Maks/Semester', value: `${rule.max_sks_per_semester} SKS` },
                    ].map((item, i, arr) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-xs text-muted-foreground">{item.label}</span>
                          <span className="text-sm font-medium">{item.value}</span>
                        </div>
                        {i < arr.length - 1 && <Separator className="opacity-50" />}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Belum ada aturan khusus per program studi. Program studi akan menggunakan aturan default.
          </p>
        )}
      </div>
    </div>
  )
}

function RuleItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}

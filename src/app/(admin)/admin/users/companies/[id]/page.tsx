import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { formatDate } from '@/lib/utils'
import { CompanyDetailActions } from '@/components/admin/company-detail-actions'
import { Globe, Building2 } from 'lucide-react'

export default async function CompanyDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('*, users(id, full_name, email, phone, is_active)')
    .eq('id', params.id)
    .single()

  if (!company) notFound()

  const account = (company.users as { id: string; full_name: string; email: string; phone: string | null; is_active: boolean } | null)

  const infoRows = [
    { label: 'Nama Perusahaan', value: company.company_name },
    { label: 'Industri', value: company.industry ?? '-' },
    { label: 'Website', value: company.website ?? '-' },
    { label: 'Akun Email', value: account?.email ?? '-' },
    { label: 'Nama Kontak', value: account?.full_name ?? '-' },
    { label: 'No. HP', value: account?.phone ?? '-' },
    { label: 'Status', value: company.is_active ? 'Aktif' : 'Nonaktif' },
    { label: 'Terdaftar', value: formatDate(company.created_at) },
  ]

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div className="mb-2">
        <h1 className="text-2xl font-semibold tracking-tight">Detail Perusahaan</h1>
        <p className="text-sm text-muted-foreground">Informasi lengkap mitra perusahaan</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Building2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-lg">{company.company_name}</CardTitle>
                  <Badge variant="outline" className={`shrink-0 text-xs ${company.is_active ? 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800' : 'text-muted-foreground'}`}>
                    {company.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>
                <CardDescription className="mt-1">{company.industry ?? 'Industri tidak diatur'}</CardDescription>
                {company.website && (
                  <a href={company.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                    <Globe className="h-3 w-3" />
                    {company.website}
                  </a>
                )}
              </div>
            </div>
            <div className="shrink-0 self-start">
              <CompanyDetailActions companyId={company.id} userId={account?.id ?? ''} isActive={company.is_active} />
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-6">
          {company.description && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Deskripsi</p>
              <p className="text-sm">{company.description}</p>
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {infoRows.map((row) => (
              <div key={row.label} className="space-y-0.5">
                <p className="text-xs text-muted-foreground">{row.label}</p>
                <p className="text-sm font-medium">{row.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

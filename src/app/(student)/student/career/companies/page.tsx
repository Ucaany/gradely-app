'use client'

import { useEffect, useState, useCallback } from 'react'
import { Building2, Globe, Heart, Loader2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface Company {
  id: string
  company_name: string
  industry: string | null
  description: string | null
  website: string | null
  logo_url: string | null
  is_interested: boolean
  company_categories: { category: string }[]
}

export default function StudentCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [interests, setInterests] = useState<string[]>([])
  const [industries, setIndustries] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/student/companies')
      const data = await res.json()
      if (data.success) {
        setCompanies(data.data.companies ?? [])
        setInterests(data.data.interests ?? [])
        setIndustries(data.data.relevant_industries ?? [])
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function toggleInterest(companyId: string, currentState: boolean) {
    setTogglingId(companyId)
    try {
      const res = await fetch('/api/student/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId, interested: !currentState }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) {
        toast.error(result.error ?? 'Gagal memperbarui')
        return
      }
      setCompanies(prev => prev.map(c =>
        c.id === companyId ? { ...c, is_interested: !currentState } : c
      ))
    } finally {
      setTogglingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Perusahaan Relevan</h1>
        <p className="text-sm text-muted-foreground">
          Perusahaan mitra yang relevan berdasarkan minat karier kamu
        </p>
      </div>

      {interests.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-muted-foreground">Berdasarkan minat:</span>
          {interests.map(i => (
            <Badge key={i} variant="secondary" className="text-xs">{i}</Badge>
          ))}
        </div>
      )}

      {industries.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-muted-foreground">Industri relevan:</span>
          {industries.map(i => (
            <Badge key={i} variant="outline" className="text-xs">{i}</Badge>
          ))}
        </div>
      )}

      {companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Building2 className="h-10 w-10 text-muted-foreground/30" />
            <div className="text-center">
              <p className="text-sm font-medium text-muted-foreground">Belum ada perusahaan relevan</p>
              <p className="text-xs text-muted-foreground mt-1">
                {interests.length === 0
                  ? 'Atur minat karier kamu di halaman Profil Karier agar kami bisa menampilkan perusahaan yang relevan.'
                  : 'Belum ada perusahaan mitra yang sesuai dengan minat karier kamu saat ini.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 rounded-lg shrink-0">
                    <AvatarImage src={company.logo_url ?? ''} />
                    <AvatarFallback className="rounded-lg text-sm font-bold bg-muted">
                      {company.company_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm">{company.company_name}</CardTitle>
                    {company.industry && (
                      <CardDescription className="text-xs mt-0.5">{company.industry}</CardDescription>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`h-8 w-8 shrink-0 ${company.is_interested ? 'text-rose-500 hover:text-rose-600' : 'text-muted-foreground hover:text-rose-400'}`}
                    onClick={() => toggleInterest(company.id, company.is_interested)}
                    disabled={togglingId === company.id}
                  >
                    {togglingId === company.id
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Heart className={`h-4 w-4 ${company.is_interested ? 'fill-current' : ''}`} />
                    }
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-0 flex flex-col gap-2 flex-1">
                {company.description && (
                  <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {company.description}
                  </p>
                )}

                {company.company_categories?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {company.company_categories.slice(0, 3).map(c => (
                      <Badge key={c.category} variant="secondary" className="text-xs px-1.5 py-0">
                        {c.category}
                      </Badge>
                    ))}
                  </div>
                )}

                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-auto"
                  >
                    <Globe className="h-3 w-3" />
                    Website
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

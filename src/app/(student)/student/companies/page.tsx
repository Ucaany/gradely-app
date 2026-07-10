'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Building2, Globe, Heart, HeartOff, Loader2, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface CompanyItem {
  id: string
  company_name: string
  industry: string | null
  description: string | null
  website: string | null
  logo_url: string | null
  is_interested: boolean
  company_categories: { category: string }[]
}

interface CompaniesData {
  companies: CompanyItem[]
  interests: string[]
  relevant_industries: string[]
}

export default function StudentCompaniesPage() {
  const [data, setData] = useState<CompaniesData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/student/companies')
      const result = await res.json()
      if (result.success) setData(result.data)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function toggleInterest(company: CompanyItem) {
    setTogglingId(company.id)
    try {
      const res = await fetch('/api/student/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: company.id, interested: !company.is_interested }),
      })
      const result = await res.json()
      if (!res.ok || !result.success) {
        toast.error(result.error ?? 'Gagal memperbarui')
        return
      }
      setData((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          companies: prev.companies.map((c) =>
            c.id === company.id ? { ...c, is_interested: !c.is_interested } : c
          ),
        }
      })
      toast.success(company.is_interested ? 'Dihapus dari daftar minat' : 'Ditambahkan ke daftar minat')
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

  const companies = data?.companies ?? []
  const interests = data?.interests ?? []
  const relevantIndustries = data?.relevant_industries ?? []

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Perusahaan Mitra</h1>
        <p className="text-sm text-muted-foreground">
          Perusahaan yang relevan dengan minat karier kamu
        </p>
      </div>

      {interests.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <Building2 className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground text-center">
              Kamu belum memilih minat karier.<br />
              <a href="/student/career" className="text-primary underline underline-offset-2">
                Atur minat karier
              </a>{' '}
              untuk melihat perusahaan yang relevan.
            </p>
          </CardContent>
        </Card>
      )}

      {interests.length > 0 && relevantIndustries.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Industri relevan:</span>
          {relevantIndustries.map((ind) => (
            <Badge key={ind} variant="outline" className="text-xs">
              {ind}
            </Badge>
          ))}
        </div>
      )}

      {companies.length === 0 && interests.length > 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-3">
            <Building2 className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground text-center">
              Belum ada perusahaan mitra yang terdaftar untuk industri ini.<br />
              <span className="text-xs">Admin kampus akan menambahkan perusahaan mitra secara berkala.</span>
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => (
            <Card key={company.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
                    {company.logo_url ? (
                      <Image
                        src={company.logo_url}
                        alt={company.company_name}
                        width={40}
                        height={40}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      company.company_name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm">{company.company_name}</CardTitle>
                    {company.industry && (
                      <CardDescription className="text-xs mt-0.5">{company.industry}</CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 flex flex-col gap-2 flex-1">
                {company.company_categories.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {company.company_categories.slice(0, 3).map((c) => (
                      <Badge key={c.category} variant="secondary" className="text-xs px-1.5 py-0">
                        {c.category}
                      </Badge>
                    ))}
                    {company.company_categories.length > 3 && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0">
                        +{company.company_categories.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {company.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {company.description}
                  </p>
                )}

                <div className="flex items-center justify-between mt-auto pt-2 gap-2">
                  {company.website ? (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Globe className="h-3 w-3" />
                      Website
                      <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  ) : (
                    <span />
                  )}

                  <Button
                    variant={company.is_interested ? 'default' : 'outline'}
                    size="sm"
                    className="h-7 px-2 text-xs gap-1"
                    disabled={togglingId === company.id}
                    onClick={() => toggleInterest(company)}
                  >
                    {togglingId === company.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : company.is_interested ? (
                      <><Heart className="h-3 w-3 fill-current" />Diminati</>
                    ) : (
                      <><HeartOff className="h-3 w-3" />Minati</>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import { Loader2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SkillOption {
  id: string
  name: string
}

export default function StudentCareerPage() {
  const [availableSkills, setAvailableSkills] = useState<SkillOption[]>([])
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [careerRes, skillsRes] = await Promise.all([
        fetch('/api/student/career').then(r => r.json()),
        fetch('/api/student/skills').then(r => r.json()),
      ])
      if (careerRes.success) {
        setSelectedInterests((careerRes.data ?? []).map((c: { interest: string }) => c.interest))
      }
      if (skillsRes.success) {
        setAvailableSkills(skillsRes.data ?? [])
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function toggleInterest(interest: string) {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    )
  }

  async function handleSave() {
    if (selectedInterests.length === 0) {
      toast.error('Pilih minimal 1 minat karier')
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch('/api/student/career', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interests: selectedInterests }),
      })
      const result = await res.json()
      if (!res.ok) { toast.error(result.error ?? 'Gagal menyimpan'); return }
      toast.success('Minat karier diperbarui')
    } finally {
      setIsSaving(false)
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
        <h1 className="text-2xl font-semibold tracking-tight">Profil Karier</h1>
        <p className="text-sm text-muted-foreground">Kelola minat karier kamu</p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-base">Minat Karier</CardTitle>
          <CardDescription>
            Pilih karier yang sesuai dengan minat dan kemampuanmu
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {availableSkills.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Belum ada pilihan karier yang tersedia. Hubungi admin untuk menambahkan pilihan.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableSkills.map((skill) => {
                const selected = selectedInterests.includes(skill.name)
                return (
                  <button
                    key={skill.id}
                    type="button"
                    onClick={() => toggleInterest(skill.name)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer ${
                      selected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:bg-muted'
                    }`}
                  >
                    {selected && <Check className="h-3.5 w-3.5" />}
                    {skill.name}
                  </button>
                )
              })}
            </div>
          )}

          {selectedInterests.length > 0 && (
            <div className="pt-2 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">{selectedInterests.length} minat dipilih:</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedInterests.map((interest) => (
                  <Badge key={interest} variant="secondary" className="gap-1 pr-1">
                    {interest}
                    <button
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={isSaving || selectedInterests.length === 0}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Menyimpan...' : 'Simpan Minat Karier'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

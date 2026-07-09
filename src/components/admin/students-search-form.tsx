'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Program {
  id: string
  name: string
  short_name: string | null
}

interface StudentsSearchFormProps {
  programs: Program[]
  defaultSearch?: string
  defaultProgram?: string
}

export function StudentsSearchForm({ programs, defaultSearch, defaultProgram }: StudentsSearchFormProps) {
  const router = useRouter()
  const [search, setSearch] = useState(defaultSearch ?? '')
  const [program, setProgram] = useState(defaultProgram ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (program) params.set('program', program)
    router.push(`/admin/users/students?${params.toString()}`)
  }

  function handleReset() {
    setSearch('')
    setProgram('')
    router.push('/admin/users/students')
  }

  const hasFilter = !!(defaultSearch || defaultProgram)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari nama, email, atau NIM..."
        className="w-full sm:max-w-xs"
      />
      <Select value={program || '__all__'} onValueChange={(v) => setProgram(v === '__all__' ? '' : v)}>
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Semua Program Studi" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">Semua Program Studi</SelectItem>
          {programs.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.short_name ?? p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex gap-2">
        <Button type="submit" size="sm">Cari</Button>
        {hasFilter && (
          <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
            Reset
          </Button>
        )}
      </div>
    </form>
  )
}

'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
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
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(defaultSearch ?? '')
  const [program, setProgram] = useState(defaultProgram ?? '')
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (search) {
        params.set('search', search)
      } else {
        params.delete('search')
      }
      params.delete('page')
      router.replace(`${pathname}?${params.toString()}`)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (isFirstRender.current) return
    const params = new URLSearchParams(searchParams.toString())
    if (program) {
      params.set('program', program)
    } else {
      params.delete('program')
    }
    params.delete('page')
    router.replace(`${pathname}?${params.toString()}`)
  }, [program])

  function handleReset() {
    setSearch('')
    setProgram('')
    router.replace(pathname)
  }

  const hasFilter = !!(search || program)

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative flex items-center w-full sm:max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama, email, atau NIM..."
          className="pl-8 pr-8"
        />
        {search && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => setSearch('')}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
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
      {hasFilter && (
        <Button type="button" variant="ghost" size="sm" onClick={handleReset}>
          Reset
        </Button>
      )}
    </div>
  )
}

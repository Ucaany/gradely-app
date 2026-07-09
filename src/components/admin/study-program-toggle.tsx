'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'

interface StudyProgramToggleProps {
  programId: string
  isActive: boolean
}

export function StudyProgramToggle({ programId, isActive }: StudyProgramToggleProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(isActive)

  async function handleToggle(value: boolean) {
    setChecked(value)
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/study-programs/${programId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: value }),
      })
      const result = await res.json()
      if (!res.ok) {
        setChecked(!value)
        toast.error(result.error ?? 'Gagal mengubah status')
        return
      }
      toast.success(value ? 'Program studi diaktifkan' : 'Program studi dinonaktifkan')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Switch
      checked={checked}
      onCheckedChange={handleToggle}
      disabled={loading}
      aria-label={checked ? 'Nonaktifkan program studi' : 'Aktifkan program studi'}
    />
  )
}

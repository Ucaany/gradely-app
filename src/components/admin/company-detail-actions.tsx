'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

interface Props {
  companyId: string
  userId: string
  isActive: boolean
}

export function CompanyDetailActions({ companyId, userId, isActive }: Props) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  async function handleToggleActive() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error ?? 'Gagal mengubah status')
        return
      }
      toast.success(isActive ? 'Perusahaan dinonaktifkan' : 'Perusahaan diaktifkan')
      router.refresh()
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete() {
    setIsLoading(true)
    try {
      // Hapus user account (cascade ke companies)
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error ?? 'Gagal menghapus perusahaan')
        return
      }
      toast.success('Perusahaan berhasil dihapus')
      router.push('/admin/users/companies')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleToggleActive}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : isActive ? (
          <ToggleRight className="h-4 w-4 mr-2 text-emerald-600" />
        ) : (
          <ToggleLeft className="h-4 w-4 mr-2 text-muted-foreground" />
        )}
        {isActive ? 'Nonaktifkan' : 'Aktifkan'}
      </Button>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild>
          <Button variant="destructive" size="sm" disabled={isLoading}>
            <Trash2 className="h-4 w-4 mr-2" />
            Hapus
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Perusahaan</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus perusahaan ini? Semua data terkait akan ikut terhapus. Tindakan ini tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={isLoading}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

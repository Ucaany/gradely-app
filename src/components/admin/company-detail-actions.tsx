'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Trash2, ToggleLeft, ToggleRight, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'

interface Props {
  companyId: string
  userId: string
  isActive: boolean
  initialIndustry?: string | null
  initialCategories: { id: string; category: string }[]
}

export function CompanyDetailActions({
  companyId,
  userId,
  isActive,
  initialIndustry = null,
  initialCategories,
}: Props) {
  const router = useRouter()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [categories, setCategories] = useState<{ id: string; category: string }[]>(initialCategories)
  const [newCategory, setNewCategory] = useState('')
  const [isSavingCategories, setIsSavingCategories] = useState(false)
  const [industry, setIndustry] = useState(initialIndustry ?? '')
  const [industryOptions, setIndustryOptions] = useState<{ id: string; name: string }[]>([])
  const [isSavingIndustry, setIsSavingIndustry] = useState(false)

  useEffect(() => {
    fetch('/api/admin/industries')
      .then(r => r.json())
      .then(r => {
        if (r.success) {
          setIndustryOptions((r.data as { id: string; name: string; is_active: boolean }[])
            .filter(i => i.is_active)
            .map(i => ({ id: i.id, name: i.name })))
        }
      })
      .catch(() => {})
  }, [])

  async function handleToggleActive() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !isActive }),
        credentials: 'include',
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
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE', credentials: 'include' })
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

  async function saveIndustry() {
    setIsSavingIndustry(true)
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: industry || null }),
        credentials: 'include',
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error ?? 'Gagal menyimpan industri')
        return
      }
      toast.success('Industri perusahaan disimpan')
      router.refresh()
    } finally {
      setIsSavingIndustry(false)
    }
  }

  function addCategory() {
    const val = newCategory.trim()
    if (!val) return
    if (categories.some((c) => c.category.toLowerCase() === val.toLowerCase())) {
      toast.error('Kategori sudah ada')
      return
    }
    setCategories(prev => [...prev, { id: crypto.randomUUID(), category: val }])
    setNewCategory('')
  }

  function removeCategory(id: string) {
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  async function saveCategories() {
    setIsSavingCategories(true)
    try {
      const res = await fetch(`/api/admin/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: categories.map((c) => c.category) }),
        credentials: 'include',
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error ?? 'Gagal menyimpan kategori')
        return
      }
      toast.success('Kategori berhasil disimpan')
      router.refresh()
    } finally {
      setIsSavingCategories(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
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

      <div className="border rounded-lg p-4 space-y-3">
        <p className="text-sm font-medium">Industri Perusahaan</p>
        <p className="text-xs text-muted-foreground">
          Harus cocok dengan opsi industri di Skill &amp; Karir agar matching onboarding akurat.
        </p>
        <Select value={industry || undefined} onValueChange={setIndustry}>
          <SelectTrigger className="w-full h-9 text-sm">
            <SelectValue placeholder="Pilih industri..." />
          </SelectTrigger>
          <SelectContent>
            {industryOptions.map((ind) => (
              <SelectItem key={ind.id} value={ind.name}>
                {ind.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {industry && !industryOptions.some(i => i.name === industry) && (
          <p className="text-[11px] text-amber-600">
            Nilai saat ini: &ldquo;{industry}&rdquo; (tidak ada di opsi admin — pilih ulang agar matching bekerja)
          </p>
        )}
        <Button size="sm" onClick={saveIndustry} disabled={isSavingIndustry} className="w-full">
          {isSavingIndustry && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan Industri
        </Button>
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <p className="text-sm font-medium">Kategori Perusahaan</p>
        <p className="text-xs text-muted-foreground">
          Digunakan untuk mencocokkan perusahaan dengan minat karier mahasiswa.
        </p>

        <div className="flex flex-wrap gap-1.5 min-h-8">
          {categories.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">Belum ada kategori</p>
          ) : (
            categories.map((c) => (
              <Badge key={c.id} variant="secondary" className="gap-1 pr-1">
                {c.category}
                <button type="button" onClick={() => removeCategory(c.id)} className="ml-0.5 rounded-full hover:bg-muted p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="Tambah kategori..."
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCategory() } }}
            className="text-sm h-8"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCategory}
            disabled={!newCategory.trim()}
            className="h-8 px-2"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <Button
          size="sm"
          onClick={saveCategories}
          disabled={isSavingCategories}
          className="w-full"
        >
          {isSavingCategories && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Simpan Kategori
        </Button>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Plus, FolderOpen, Filter, Globe, Lock,
  Pencil, Trash2, Loader2,
} from 'lucide-react'
import { LinkPreview } from '@/components/shared/link-preview'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { formatDateShort } from '@/lib/utils'
import { CATEGORY_LABEL } from '@/components/student/portfolio-form'
import type { StudentPortfolioWithCategory, PortfolioCategory } from '@/types'


export default function StudentPortfolioPage() {
  const router = useRouter()
  const [items, setItems] = useState<StudentPortfolioWithCategory[]>([])
  const [categories, setCategories] = useState<PortfolioCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterVisibility, setFilterVisibility] = useState<string>('all')

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const [portfolioRes, catRes] = await Promise.all([
        fetch('/api/student/portfolio'),
        fetch('/api/student/portfolio/categories'),
      ])
      const [portfolioData, catData] = await Promise.all([portfolioRes.json(), catRes.json()])
      if (portfolioData.success) setItems(portfolioData.data ?? [])
      else setFetchError(portfolioData.error ?? 'Gagal memuat portofolio.')
      if (catData.success) setCategories(catData.data ?? [])
    } catch {
      setFetchError('Gagal memuat data. Periksa koneksi internet Anda.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/student/portfolio/${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (!res.ok) { toast.error(result.error ?? 'Gagal menghapus'); return }
      toast.success('Portofolio dihapus')
      fetchData()
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = items.filter((i) => {
    if (filterCategory !== 'all' && i.category_id !== filterCategory) return false
    if (filterVisibility === 'public' && !i.is_public) return false
    if (filterVisibility === 'private' && i.is_public) return false
    return true
  })

  const grouped = categories.reduce<Record<string, StudentPortfolioWithCategory[]>>((acc, cat) => {
    const catItems = filtered.filter((i) => i.portfolio_categories?.code === cat.code)
    if (catItems.length > 0) acc[cat.id] = catItems
    return acc
  }, {})

  const publicCount = items.filter((i) => i.is_public).length
  const privateCount = items.filter((i) => !i.is_public).length

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Semua Portofolio</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-muted-foreground">{items.length} item total</p>
            <span className="text-muted-foreground/40">·</span>
            <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
              <Globe className="h-3 w-3" />
              {publicCount} publik
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              {privateCount} privat
            </span>
          </div>
        </div>
        <Button size="sm" onClick={() => router.push('/student/portfolio/new')}>
          <Plus className="h-4 w-4 mr-1.5" />
          Tambah Portofolio
        </Button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="h-8 w-44 text-sm">
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {CATEGORY_LABEL[cat.code] ?? cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterVisibility} onValueChange={setFilterVisibility}>
          <SelectTrigger className="h-8 w-36 text-sm">
            <SelectValue placeholder="Semua" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="public">
              <span className="flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-emerald-500" />
                Publik
              </span>
            </SelectItem>
            <SelectItem value="private">
              <span className="flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5" />
                Privat
              </span>
            </SelectItem>
          </SelectContent>
        </Select>

        {(filterCategory !== 'all' || filterVisibility !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs"
            onClick={() => { setFilterCategory('all'); setFilterVisibility('all') }}
          >
            Reset
          </Button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : fetchError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm text-destructive">{fetchError}</p>
            <Button variant="outline" size="sm" onClick={fetchData}>Coba Lagi</Button>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <FolderOpen className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">Belum ada portofolio.</p>
            <p className="text-xs text-muted-foreground">Klik &quot;Tambah Portofolio&quot; di atas untuk mulai.</p>
          </CardContent>
        </Card>
      ) : Object.keys(grouped).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-2">
            <FolderOpen className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">Tidak ada portofolio untuk filter ini.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-10">
          {categories
            .filter((cat) => grouped[cat.id])
            .map((cat) => (
              <div key={cat.id}>
                {/* Section header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-semibold">
                      {CATEGORY_LABEL[cat.code] ?? cat.name}
                    </h2>
                    <Badge variant="secondary" className="text-xs">
                      {grouped[cat.id].length}
                    </Badge>
                  </div>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {grouped[cat.id].map((item) => (
                    <PortfolioCard
                      key={item.id}
                      item={item}
                      onEdit={() => router.push(`/student/portfolio/${item.id}/edit`)}
                      onDelete={() => handleDelete(item.id)}
                      isDeleting={deletingId === item.id}
                    />
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

function PortfolioCard({
  item,
  onEdit,
  onDelete,
  isDeleting,
}: {
  item: StudentPortfolioWithCategory
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  return (
    <Card className="flex flex-col group">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm leading-snug">{item.title}</CardTitle>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              {/* Public/Private badge */}
              {item.is_public ? (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <Globe className="h-3 w-3" />
                  Publik
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  Privat
                </span>
              )}
              <span className="text-muted-foreground/40 text-xs">·</span>
              {/* Status badge */}
              <Badge
                variant="outline"
                className={item.status === 'ongoing'
                  ? 'text-blue-600 border-blue-300 bg-blue-50 dark:bg-blue-950/40 text-xs px-1.5 py-0'
                  : 'text-muted-foreground text-xs px-1.5 py-0'}
              >
                {item.status === 'ongoing' ? 'Berlangsung' : 'Selesai'}
              </Badge>
            </div>
          </div>
          {/* Actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  disabled={isDeleting}
                >
                  {isDeleting
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <Trash2 className="h-3.5 w-3.5" />
                  }
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Hapus Portofolio</AlertDialogTitle>
                  <AlertDialogDescription>
                    Portofolio &quot;{item.title}&quot; akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={onDelete}
                  >
                    Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex flex-col gap-2 flex-1">
        {item.description && (
          <CardDescription className="text-xs line-clamp-2">
            {item.description}
          </CardDescription>
        )}

        {/* Periode */}
        {item.start_date && (
          <p className="text-xs text-muted-foreground">
            {formatDateShort(item.start_date)}
            {item.end_date
              ? ` — ${formatDateShort(item.end_date)}`
              : item.status === 'ongoing' ? ' — sekarang' : ''}
          </p>
        )}

        {/* Skills */}
        {(item.skills ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.skills.slice(0, 4).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs px-1.5 py-0">
                {skill}
              </Badge>
            ))}
            {item.skills.length > 4 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                +{item.skills.length - 4}
              </Badge>
            )}
          </div>
        )}

        {/* Links */}
        {(item.links ?? []).length > 0 && (
          <div className="flex flex-col gap-2 mt-auto pt-1">
            {item.links.map((link, i) => (
              <LinkPreview key={i} url={link.url} label={link.label} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, Check, X, Sparkles, Briefcase, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Option {
  id: string
  name: string
  is_active: boolean
  created_at: string
}

function OptionTable({
  items,
  onAdd,
  onRename,
  onToggle,
  onDelete,
  addPlaceholder,
  emptyText,
}: {
  items: Option[]
  onAdd: (name: string) => Promise<void>
  onRename: (id: string, name: string) => Promise<void>
  onToggle: (id: string, active: boolean) => Promise<void>
  onDelete: (id: string) => Promise<void>
  addPlaceholder: string
  emptyText: string
}) {
  const [newName, setNewName] = React.useState("")
  const [adding, setAdding] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [editValue, setEditValue] = React.useState("")
  const [deleteTarget, setDeleteTarget] = React.useState<Option | null>(null)
  const [loadingId, setLoadingId] = React.useState<string | null>(null)

  async function handleAdd() {
    if (!newName.trim()) return
    setAdding(true)
    try { await onAdd(newName.trim()); setNewName("") }
    finally { setAdding(false) }
  }

  async function handleRename(id: string) {
    if (!editValue.trim()) return
    setLoadingId(id)
    try { await onRename(id, editValue.trim()); setEditingId(null) }
    finally { setLoadingId(null) }
  }

  async function handleToggle(id: string, current: boolean) {
    setLoadingId(id)
    try { await onToggle(id, !current) }
    finally { setLoadingId(null) }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setLoadingId(deleteTarget.id)
    try { await onDelete(deleteTarget.id) }
    finally { setLoadingId(null); setDeleteTarget(null) }
  }

  const activeCount = items.filter(i => i.is_active).length
  const inactiveCount = items.filter(i => !i.is_active).length

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); handleAdd() }}>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={addPlaceholder}
            className="w-64"
            disabled={adding}
          />
          <Button type="submit" size="sm" disabled={adding || !newName.trim()}>
            {adding
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Plus className="h-4 w-4" />
            }
            <span className="ml-1.5">Tambah</span>
          </Button>
        </form>
        <p className="text-xs text-muted-foreground shrink-0">
          {activeCount} aktif · {inactiveCount} nonaktif
        </p>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4 w-full">Nama</TableHead>
              <TableHead className="w-[130px]">Status</TableHead>
              <TableHead className="w-[100px] pr-4 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-12">
                  {emptyText}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="pl-4">
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-8 text-sm max-w-[280px]"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(item.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0 text-emerald-600"
                          onClick={() => handleRename(item.id)} disabled={loadingId === item.id}>
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0"
                          onClick={() => setEditingId(null)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <span className={`text-sm font-medium ${!item.is_active ? 'line-through text-muted-foreground' : ''}`}>
                        {item.name}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.is_active}
                        onCheckedChange={() => handleToggle(item.id, item.is_active)}
                        disabled={loadingId === item.id}
                      />
                      <Badge variant="outline" className={`text-xs ${item.is_active
                        ? 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                        : 'text-muted-foreground'}`}>
                        {item.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8"
                        onClick={() => { setEditingId(item.id); setEditValue(item.name) }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(item)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus &ldquo;{deleteTarget?.name}&rdquo;?</DialogTitle>
            <DialogDescription>
              Tindakan ini tidak dapat dibatalkan. Data mahasiswa yang sudah memilih item ini tidak akan terpengaruh.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Batal</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={!!loadingId}>
              {loadingId && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

type Section = "skills" | "industries"

export default function SkillsCareerPage() {
  const [active, setActive] = React.useState<Section>("skills")
  const [skills, setSkills] = React.useState<Option[]>([])
  const [industries, setIndustries] = React.useState<Option[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    Promise.all([
      fetch('/api/admin/skills').then(r => r.json()),
      fetch('/api/admin/industries').then(r => r.json()),
    ]).then(([s, i]) => {
      if (s.success) setSkills(s.data)
      if (i.success) setIndustries(i.data)
    }).finally(() => setLoading(false))
  }, [])

  async function addSkill(name: string) {
    const res = await fetch('/api/admin/skills', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    const result = await res.json()
    if (!result.success) { toast.error(result.error ?? 'Gagal menambah skill'); return }
    setSkills(prev => [...prev, result.data].sort((a, b) => a.name.localeCompare(b.name)))
    toast.success('Skill ditambahkan')
  }

  async function renameSkill(id: string, name: string) {
    const res = await fetch(`/api/admin/skills/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    const result = await res.json()
    if (!result.success) { toast.error(result.error ?? 'Gagal mengubah skill'); return }
    setSkills(prev => prev.map(s => s.id === id ? result.data : s).sort((a, b) => a.name.localeCompare(b.name)))
    toast.success('Skill diperbarui')
  }

  async function toggleSkill(id: string, is_active: boolean) {
    const res = await fetch(`/api/admin/skills/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active }) })
    const result = await res.json()
    if (!result.success) { toast.error(result.error ?? 'Gagal mengubah status'); return }
    setSkills(prev => prev.map(s => s.id === id ? result.data : s))
    toast.success(is_active ? 'Skill diaktifkan' : 'Skill dinonaktifkan')
  }

  async function deleteSkill(id: string) {
    const res = await fetch(`/api/admin/skills/${id}`, { method: 'DELETE' })
    const result = await res.json()
    if (!result.success) { toast.error(result.error ?? 'Gagal menghapus skill'); return }
    setSkills(prev => prev.filter(s => s.id !== id))
    toast.success('Skill dihapus')
  }

  async function addIndustry(name: string) {
    const res = await fetch('/api/admin/industries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    const result = await res.json()
    if (!result.success) { toast.error(result.error ?? 'Gagal menambah industri'); return }
    setIndustries(prev => [...prev, result.data].sort((a, b) => a.name.localeCompare(b.name)))
    toast.success('Industri ditambahkan')
  }

  async function renameIndustry(id: string, name: string) {
    const res = await fetch(`/api/admin/industries/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    const result = await res.json()
    if (!result.success) { toast.error(result.error ?? 'Gagal mengubah industri'); return }
    setIndustries(prev => prev.map(i => i.id === id ? result.data : i).sort((a, b) => a.name.localeCompare(b.name)))
    toast.success('Industri diperbarui')
  }

  async function toggleIndustry(id: string, is_active: boolean) {
    const res = await fetch(`/api/admin/industries/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_active }) })
    const result = await res.json()
    if (!result.success) { toast.error(result.error ?? 'Gagal mengubah status'); return }
    setIndustries(prev => prev.map(i => i.id === id ? result.data : i))
    toast.success(is_active ? 'Industri diaktifkan' : 'Industri dinonaktifkan')
  }

  async function deleteIndustry(id: string) {
    const res = await fetch(`/api/admin/industries/${id}`, { method: 'DELETE' })
    const result = await res.json()
    if (!result.success) { toast.error(result.error ?? 'Gagal menghapus industri'); return }
    setIndustries(prev => prev.filter(i => i.id !== id))
    toast.success('Industri dihapus')
  }

  const sections = [
    {
      key: "skills" as Section,
      label: "Skill",
      icon: Sparkles,
      iconClass: "text-violet-500",
      count: skills.filter(s => s.is_active).length,
      total: skills.length,
      description: "Skill yang bisa dipilih mahasiswa saat onboarding dan di halaman karir. Nonaktifkan untuk menyembunyikan tanpa menghapus.",
    },
    {
      key: "industries" as Section,
      label: "Industri & Bidang Pekerjaan",
      icon: Briefcase,
      iconClass: "text-blue-500",
      count: industries.filter(i => i.is_active).length,
      total: industries.length,
      description: "Industri digunakan untuk mengelompokkan perusahaan dan mencocokkan skill mahasiswa saat onboarding.",
    },
  ]

  const current = sections.find(s => s.key === active)!

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Skill & Karir</h1>
        <p className="text-sm text-muted-foreground">
          Kelola daftar skill dan industri yang tampil di onboarding mahasiswa dan halaman karir
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="flex gap-3">
            {sections.map((s) => {
              const Icon = s.icon
              const isActive = active === s.key
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setActive(s.key)}
                  className={`flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-card text-foreground hover:bg-accent hover:border-accent-foreground/20'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-primary-foreground' : s.iconClass}`} />
                  {s.label}
                  <Badge
                    variant={isActive ? "secondary" : "outline"}
                    className={`ml-0.5 text-xs ${isActive ? 'bg-primary-foreground/20 text-primary-foreground border-transparent' : ''}`}
                  >
                    {s.count}
                  </Badge>
                </button>
              )
            })}
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <current.icon className={`h-4 w-4 ${current.iconClass}`} />
                <CardTitle className="text-base">{current.label}</CardTitle>
              </div>
              <CardDescription>{current.description}</CardDescription>
            </CardHeader>
            <Separator />
            <CardContent className="pt-4">
              {active === "skills" ? (
                <OptionTable
                  items={skills}
                  onAdd={addSkill}
                  onRename={renameSkill}
                  onToggle={toggleSkill}
                  onDelete={deleteSkill}
                  addPlaceholder="Nama skill baru, contoh: 3D Modeling"
                  emptyText="Belum ada skill. Tambahkan skill pertama di atas."
                />
              ) : (
                <OptionTable
                  items={industries}
                  onAdd={addIndustry}
                  onRename={renameIndustry}
                  onToggle={toggleIndustry}
                  onDelete={deleteIndustry}
                  addPlaceholder="Nama industri baru, contoh: Pendidikan"
                  emptyText="Belum ada industri. Tambahkan industri pertama di atas."
                />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

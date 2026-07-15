"use client"

import * as React from "react"
import { Plus, Pencil, Trash2, Check, X, Sparkles, Briefcase, Loader2, Link2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
    try { await onDelete(deleteTarget.id); setDeleteTarget(null) }
    finally { setLoadingId(null) }
  }

  return (
    <>
      <div className="flex gap-2 mb-4">
        <Input
          placeholder={addPlaceholder}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd() } }}
          className="max-w-sm"
        />
        <Button onClick={handleAdd} disabled={adding || !newName.trim()} size="sm">
          {adding ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : <Plus className="h-4 w-4 mr-1.5" />}
          Tambah
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead className="w-28">Status</TableHead>
              <TableHead className="w-28 text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-10">
                  {emptyText}
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    {editingId === item.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleRename(item.id) }}
                          className="h-8 max-w-xs"
                          autoFocus
                        />
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleRename(item.id)} disabled={loadingId === item.id}>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm font-medium">{item.name}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={item.is_active}
                        onCheckedChange={() => handleToggle(item.id, item.is_active)}
                        disabled={loadingId === item.id}
                      />
                      <Badge variant={item.is_active ? "default" : "secondary"} className="text-[10px]">
                        {item.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
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

function MappingPanel({
  skills,
  industries,
  mapping,
  onSave,
}: {
  skills: Option[]
  industries: Option[]
  mapping: Record<string, string[]>
  onSave: (skillId: string, industryIds: string[]) => Promise<void>
}) {
  const [selectedSkillId, setSelectedSkillId] = React.useState<string | null>(null)
  const [draft, setDraft] = React.useState<string[]>([])
  const [saving, setSaving] = React.useState(false)

  const activeSkills = skills.filter(s => s.is_active)
  const activeIndustries = industries.filter(i => i.is_active)

  React.useEffect(() => {
    if (selectedSkillId) {
      setDraft(mapping[selectedSkillId] ?? [])
    }
  }, [selectedSkillId, mapping])

  function toggleIndustry(id: string) {
    setDraft(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  async function handleSave() {
    if (!selectedSkillId) return
    setSaving(true)
    try {
      await onSave(selectedSkillId, draft)
    } finally {
      setSaving(false)
    }
  }

  if (activeSkills.length === 0 || activeIndustries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-14 text-center">
        <Link2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm font-medium">Belum bisa mengatur mapping</p>
        <p className="text-xs text-muted-foreground mt-1">
          Pastikan ada skill dan industri aktif terlebih dahulu.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pilih Skill</p>
        <div className="rounded-md border max-h-80 overflow-y-auto divide-y">
          {activeSkills.map((skill) => {
            const count = (mapping[skill.id] ?? []).length
            const selected = selectedSkillId === skill.id
            return (
              <button
                key={skill.id}
                type="button"
                onClick={() => setSelectedSkillId(skill.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors ${
                  selected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50'
                }`}
              >
                <span className="font-medium">{skill.name}</span>
                <Badge variant={count > 0 ? 'default' : 'secondary'} className="text-[10px]">
                  {count} industri
                </Badge>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {selectedSkillId
            ? `Industri untuk: ${activeSkills.find(s => s.id === selectedSkillId)?.name ?? ''}`
            : 'Pilih skill di kiri'}
        </p>
        {!selectedSkillId ? (
          <div className="rounded-lg border border-dashed py-16 text-center text-xs text-muted-foreground">
            Pilih skill untuk mengatur industri terkait
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 rounded-md border p-3 min-h-[200px] content-start">
              {activeIndustries.map((ind) => {
                const selected = draft.includes(ind.id)
                return (
                  <button
                    key={ind.id}
                    type="button"
                    onClick={() => toggleIndustry(ind.id)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-all ${
                      selected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border hover:border-primary/60'
                    }`}
                  >
                    {ind.name}
                  </button>
                )
              })}
            </div>
            <Button size="sm" onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              Simpan Mapping
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

type Section = "skills" | "industries" | "mapping"

export default function SkillsCareerPage() {
  const [active, setActive] = React.useState<Section>("skills")
  const [skills, setSkills] = React.useState<Option[]>([])
  const [industries, setIndustries] = React.useState<Option[]>([])
  const [mapping, setMapping] = React.useState<Record<string, string[]>>({})
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    Promise.all([
      fetch('/api/admin/skills').then(r => r.json()),
      fetch('/api/admin/industries').then(r => r.json()),
      fetch('/api/admin/skill-industry-map').then(r => r.json()),
    ]).then(([s, i, m]) => {
      if (s.success) setSkills(s.data)
      if (i.success) setIndustries(i.data)
      if (m.success) setMapping(m.data ?? {})
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
    setMapping(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
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
    setMapping(prev => {
      const next: Record<string, string[]> = {}
      for (const [skillId, ids] of Object.entries(prev)) {
        next[skillId] = ids.filter(x => x !== id)
      }
      return next
    })
    toast.success('Industri dihapus')
  }

  async function saveMapping(skillId: string, industryIds: string[]) {
    const res = await fetch('/api/admin/skill-industry-map', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill_id: skillId, industry_ids: industryIds }),
    })
    const result = await res.json()
    if (!result.success) { toast.error(result.error ?? 'Gagal menyimpan mapping'); return }
    setMapping(prev => ({ ...prev, [skillId]: industryIds }))
    toast.success('Mapping skill–industri disimpan')
  }

  const sections = [
    {
      key: "skills" as Section,
      label: "Skill",
      icon: Sparkles,
      iconClass: "text-violet-500",
      count: skills.filter(s => s.is_active).length,
      total: skills.length,
      description: "Skill yang bisa dipilih mahasiswa saat onboarding dan di halaman target. Nonaktifkan untuk menyembunyikan tanpa menghapus.",
    },
    {
      key: "industries" as Section,
      label: "Industri",
      icon: Briefcase,
      iconClass: "text-blue-500",
      count: industries.filter(i => i.is_active).length,
      total: industries.length,
      description: "Industri digunakan di onboarding mahasiswa dan harus cocok dengan field industri perusahaan mitra.",
    },
    {
      key: "mapping" as Section,
      label: "Mapping",
      icon: Link2,
      iconClass: "text-emerald-500",
      count: Object.values(mapping).filter(ids => ids.length > 0).length,
      total: skills.filter(s => s.is_active).length,
      description: "Hubungkan skill ke industri. Digunakan untuk merekomendasikan perusahaan yang relevan saat onboarding.",
    },
  ]

  const current = sections.find(s => s.key === active)!

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Skill & Karir</h1>
        <p className="text-sm text-muted-foreground">
          Kelola skill, industri, dan mapping yang tampil di onboarding mahasiswa
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
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
                      : 'border-border bg-card text-foreground hover:border-primary/40'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? '' : s.iconClass}`} />
                  <span>{s.label}</span>
                  <Badge variant={isActive ? 'secondary' : 'outline'} className="text-[10px]">
                    {s.count}/{s.total}
                  </Badge>
                </button>
              )
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{current.label}</CardTitle>
              <CardDescription>{current.description}</CardDescription>
            </CardHeader>
            <CardContent>
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
              ) : active === "industries" ? (
                <OptionTable
                  items={industries}
                  onAdd={addIndustry}
                  onRename={renameIndustry}
                  onToggle={toggleIndustry}
                  onDelete={deleteIndustry}
                  addPlaceholder="Nama industri baru, contoh: Pendidikan"
                  emptyText="Belum ada industri. Tambahkan industri pertama di atas."
                />
              ) : (
                <MappingPanel
                  skills={skills}
                  industries={industries}
                  mapping={mapping}
                  onSave={saveMapping}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

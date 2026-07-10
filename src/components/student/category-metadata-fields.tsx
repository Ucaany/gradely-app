'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface MetadataFieldsProps {
  categoryCode: string
  metadata: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  disabled?: boolean
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  )
}

export function CategoryMetadataFields({ categoryCode, metadata, onChange, disabled }: MetadataFieldsProps) {
  function val(key: string): string {
    return (metadata[key] as string) ?? ''
  }
  function numVal(key: string): string {
    const v = metadata[key]
    return v !== undefined && v !== null ? String(v) : ''
  }
  function boolVal(key: string): boolean {
    return (metadata[key] as boolean) ?? false
  }

  switch (categoryCode) {
    case 'certificate':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldRow label="Lembaga Penerbit">
            <Input
              placeholder="Contoh: Coursera, BNSP, Google"
              value={val('issuer')}
              onChange={(e) => onChange('issuer', e.target.value)}
              disabled={disabled}
            />
          </FieldRow>
          <FieldRow label="Nomor Sertifikat">
            <Input
              placeholder="Contoh: UC-12345678"
              value={val('certificate_number')}
              onChange={(e) => onChange('certificate_number', e.target.value)}
              disabled={disabled}
            />
          </FieldRow>
          <FieldRow label="Tanggal Expired">
            <Input
              type="date"
              value={val('expired_date')}
              onChange={(e) => onChange('expired_date', e.target.value)}
              disabled={disabled}
            />
          </FieldRow>
        </div>
      )

    case 'internship':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldRow label="Nama Perusahaan">
            <Input
              placeholder="Contoh: PT Tokopedia"
              value={val('company_name')}
              onChange={(e) => onChange('company_name', e.target.value)}
              disabled={disabled}
            />
          </FieldRow>
          <FieldRow label="Posisi / Jabatan">
            <Input
              placeholder="Contoh: UI/UX Designer Intern"
              value={val('position')}
              onChange={(e) => onChange('position', e.target.value)}
              disabled={disabled}
            />
          </FieldRow>
          <div className="sm:col-span-2">
            <FieldRow label="Deskripsi Pekerjaan">
              <Textarea
                placeholder="Jelaskan tugas dan tanggung jawab kamu selama magang..."
                rows={3}
                value={val('work_description')}
                onChange={(e) => onChange('work_description', e.target.value)}
                disabled={disabled}
              />
            </FieldRow>
          </div>
        </div>
      )

    case 'volunteer':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldRow label="Nama Organisasi">
            <Input
              placeholder="Contoh: WWF Indonesia"
              value={val('organization_name')}
              onChange={(e) => onChange('organization_name', e.target.value)}
              disabled={disabled}
            />
          </FieldRow>
          <FieldRow label="Peran">
            <Input
              placeholder="Contoh: Event Coordinator"
              value={val('role')}
              onChange={(e) => onChange('role', e.target.value)}
              disabled={disabled}
            />
          </FieldRow>
          <FieldRow label="Jumlah Jam Relawan">
            <Input
              type="number"
              min={0}
              placeholder="Contoh: 40"
              value={numVal('hours')}
              onChange={(e) => onChange('hours', e.target.value ? Number(e.target.value) : undefined)}
              disabled={disabled}
            />
          </FieldRow>
        </div>
      )

    case 'organization':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldRow label="Nama Organisasi">
            <Input
              placeholder="Contoh: BEM Fakultas Seni"
              value={val('organization_name')}
              onChange={(e) => onChange('organization_name', e.target.value)}
              disabled={disabled}
            />
          </FieldRow>
          <FieldRow label="Jabatan">
            <Input
              placeholder="Contoh: Ketua Divisi Kreatif"
              value={val('position')}
              onChange={(e) => onChange('position', e.target.value)}
              disabled={disabled}
            />
          </FieldRow>
        </div>
      )

    case 'achievement':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldRow label="Tingkat">
            <Select
              value={val('level')}
              onValueChange={(v) => onChange('level', v)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih tingkat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lokal">Lokal</SelectItem>
                <SelectItem value="nasional">Nasional</SelectItem>
                <SelectItem value="internasional">Internasional</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label="Penyelenggara">
            <Input
              placeholder="Contoh: Kementerian Pendidikan"
              value={val('organizer')}
              onChange={(e) => onChange('organizer', e.target.value)}
              disabled={disabled}
            />
          </FieldRow>
          <FieldRow label="Peringkat / Penghargaan">
            <Input
              placeholder="Contoh: Juara 1, Best Design Award"
              value={val('rank')}
              onChange={(e) => onChange('rank', e.target.value)}
              disabled={disabled}
            />
          </FieldRow>
        </div>
      )

    case 'competition':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldRow label="Nama Kompetisi">
            <Input
              placeholder="Contoh: Gemastik 2024"
              value={val('competition_name')}
              onChange={(e) => onChange('competition_name', e.target.value)}
              disabled={disabled}
            />
          </FieldRow>
          <FieldRow label="Penyelenggara">
            <Input
              placeholder="Contoh: Kemendikbud"
              value={val('organizer')}
              onChange={(e) => onChange('organizer', e.target.value)}
              disabled={disabled}
            />
          </FieldRow>
          <FieldRow label="Tingkat">
            <Select
              value={val('level')}
              onValueChange={(v) => onChange('level', v)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih tingkat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lokal">Lokal</SelectItem>
                <SelectItem value="nasional">Nasional</SelectItem>
                <SelectItem value="internasional">Internasional</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label="Peringkat / Hasil">
            <Input
              placeholder="Contoh: Juara 2, Finalis"
              value={val('rank')}
              onChange={(e) => onChange('rank', e.target.value)}
              disabled={disabled}
            />
          </FieldRow>
        </div>
      )

    case 'workshop':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldRow label="Penyelenggara">
            <Input
              placeholder="Contoh: Dicoding, IDCamp"
              value={val('organizer')}
              onChange={(e) => onChange('organizer', e.target.value)}
              disabled={disabled}
            />
          </FieldRow>
          <FieldRow label="Durasi (jam)">
            <Input
              type="number"
              min={0}
              placeholder="Contoh: 8"
              value={numVal('duration_hours')}
              onChange={(e) => onChange('duration_hours', e.target.value ? Number(e.target.value) : undefined)}
              disabled={disabled}
            />
          </FieldRow>
          <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
            <div>
              <p className="text-sm font-medium">Ada Sertifikat</p>
              <p className="text-xs text-muted-foreground">Workshop ini memberikan sertifikat kelulusan</p>
            </div>
            <Switch
              checked={boolVal('has_certificate')}
              onCheckedChange={(v) => onChange('has_certificate', v)}
              disabled={disabled}
            />
          </div>
        </div>
      )

    case 'training':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldRow label="Penyelenggara">
            <Input
              placeholder="Contoh: BPJS Ketenagakerjaan, Prakerja"
              value={val('organizer')}
              onChange={(e) => onChange('organizer', e.target.value)}
              disabled={disabled}
            />
          </FieldRow>
          <FieldRow label="Durasi (jam)">
            <Input
              type="number"
              min={0}
              placeholder="Contoh: 20"
              value={numVal('duration_hours')}
              onChange={(e) => onChange('duration_hours', e.target.value ? Number(e.target.value) : undefined)}
              disabled={disabled}
            />
          </FieldRow>
          <FieldRow label="Metode">
            <Select
              value={val('method')}
              onValueChange={(v) => onChange('method', v)}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih metode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
        </div>
      )

    case 'project':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldRow label="Peran dalam Proyek">
            <Input
              placeholder="Contoh: Frontend Developer, UI Designer"
              value={val('role')}
              onChange={(e) => onChange('role', e.target.value)}
              disabled={disabled}
            />
          </FieldRow>
          <FieldRow label="Tech Stack (pisahkan koma)">
            <Input
              placeholder="Contoh: React, Tailwind, Supabase"
              value={Array.isArray(metadata['tech_stack']) ? (metadata['tech_stack'] as string[]).join(', ') : ''}
              onChange={(e) => onChange('tech_stack', e.target.value ? e.target.value.split(',').map((s) => s.trim()).filter(Boolean) : [])}
              disabled={disabled}
            />
          </FieldRow>
        </div>
      )

    case 'work':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldRow label="Medium / Platform">
            <Input
              placeholder="Contoh: Figma, Procreate, Adobe Illustrator"
              value={val('medium')}
              onChange={(e) => onChange('medium', e.target.value)}
              disabled={disabled}
            />
          </FieldRow>
          <FieldRow label="Format / Dimensi">
            <Input
              placeholder="Contoh: A3, Digital, 1920x1080"
              value={val('format')}
              onChange={(e) => onChange('format', e.target.value)}
              disabled={disabled}
            />
          </FieldRow>
          <FieldRow label="Klien (jika ada)">
            <Input
              placeholder="Contoh: PT Maju Jaya"
              value={val('client')}
              onChange={(e) => onChange('client', e.target.value)}
              disabled={disabled}
            />
          </FieldRow>
        </div>
      )

    case 'experience':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <FieldRow label="Nama Tempat / Institusi">
            <Input
              placeholder="Contoh: Studio Animasi X, Dinas Kebudayaan"
              value={val('place_name')}
              onChange={(e) => onChange('place_name', e.target.value)}
              disabled={disabled}
            />
          </FieldRow>
          <FieldRow label="Peran">
            <Input
              placeholder="Contoh: Asisten Kurator, Co-Creator"
              value={val('role')}
              onChange={(e) => onChange('role', e.target.value)}
              disabled={disabled}
            />
          </FieldRow>
          <div className="sm:col-span-2">
            <FieldRow label="Konteks / Keterangan">
              <Textarea
                placeholder="Jelaskan pengalaman ini secara singkat..."
                rows={2}
                value={val('context')}
                onChange={(e) => onChange('context', e.target.value)}
                disabled={disabled}
              />
            </FieldRow>
          </div>
        </div>
      )

    default:
      return null
  }
}

export function getCategoryMetadataLabel(categoryCode: string): string | null {
  const labels: Record<string, string> = {
    certificate: 'Detail Sertifikat',
    internship: 'Detail Magang',
    volunteer: 'Detail Volunteer',
    organization: 'Detail Organisasi',
    achievement: 'Detail Prestasi',
    competition: 'Detail Kompetisi',
    workshop: 'Detail Workshop',
    training: 'Detail Pelatihan',
    project: 'Detail Proyek',
    work: 'Detail Karya',
    experience: 'Detail Pengalaman',
  }
  return labels[categoryCode] ?? null
}

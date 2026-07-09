'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Upload, Download, Loader2, CheckCircle2, XCircle, FileText, AlertCircle } from 'lucide-react'
import Papa from 'papaparse'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { ImportResult } from '@/types'

interface Props {
  universityId: string
}

const REQUIRED_COLS = ['full_name', 'email', 'role']
const OPTIONAL_COLS = ['nim', 'phone', 'study_program_id', 'current_semester']
const VALID_ROLES = ['student', 'lecturer', 'admin']

export function ImportCsvForm({ universityId }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)
  const [fileName, setFileName] = useState('')
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = useCallback((file: File) => {
    setFileName(file.name)
    setResult(null)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parsed) => {
        setPreview(parsed.data as Record<string, string>[])
      },
      error: () => {
        toast.error('Gagal membaca file CSV')
      },
    })
  }, [])

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) handleFile(file)
    else toast.error('Hanya file CSV yang didukung')
  }

  function onFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  async function handleImport() {
    if (preview.length === 0) {
      toast.error('Tidak ada data untuk diimport')
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: preview,
          university_id: universityId,
          default_password: 'Gradely@2024',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error ?? 'Import gagal')
        return
      }

      setResult(data.data)
      setPreview([])
      setFileName('')
      router.refresh()

      if (data.data.success > 0) {
        toast.success(`${data.data.success} akun berhasil dibuat`)
      }
      if (data.data.failed > 0) {
        toast.error(`${data.data.failed} akun gagal dibuat`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  function downloadTemplate() {
    const csv = Papa.unparse([
      {
        full_name: 'Nama Lengkap',
        email: 'email@isi.ac.id',
        role: 'student',
        nim: '2021015001',
        phone: '08123456789',
        study_program_id: '',
        current_semester: '1',
      },
    ])
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template-import-user.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleReset() {
    setPreview([])
    setFileName('')
    setResult(null)
  }

  const headers = preview.length > 0 ? Object.keys(preview[0]) : []

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Import Akun via CSV</h1>
          <p className="text-sm text-muted-foreground">
            Upload file CSV untuk membuat banyak akun sekaligus
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate} className="shrink-0 self-start sm:self-auto">
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left col — format info + drop zone */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Format info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                Format CSV
              </CardTitle>
              <CardDescription>Kolom yang diperlukan dalam file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs font-medium text-foreground mb-1.5">Wajib</p>
                <div className="flex flex-wrap gap-1.5">
                  {REQUIRED_COLS.map((col) => (
                    <code key={col} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded font-mono">
                      {col}
                    </code>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-foreground mb-1.5">Opsional</p>
                <div className="flex flex-wrap gap-1.5">
                  {OPTIONAL_COLS.map((col) => (
                    <code key={col} className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded font-mono">
                      {col}
                    </code>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-foreground mb-1.5">Nilai role</p>
                <div className="flex flex-wrap gap-1.5">
                  {VALID_ROLES.map((r) => (
                    <code key={r} className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded font-mono">
                      {r}
                    </code>
                  ))}
                </div>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-3 py-2.5 mt-1">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Password default: <strong>Gradely@2024</strong>. Minta pengguna mengubah setelah login pertama.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Result */}
          {result && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Hasil Import</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 py-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mb-1" />
                    <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{result.success}</span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">Berhasil</span>
                  </div>
                  <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 py-3">
                    <XCircle className="h-5 w-5 text-destructive mb-1" />
                    <span className="text-xl font-bold text-destructive">{result.failed}</span>
                    <span className="text-xs text-destructive">Gagal</span>
                  </div>
                </div>
                {result.errors.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-destructive">Detail Error:</p>
                    <div className="max-h-48 overflow-y-auto space-y-1.5">
                      {result.errors.map((err, i) => (
                        <div key={i} className="text-xs p-2 bg-destructive/10 rounded-lg">
                          <span className="font-medium">Baris {err.row}</span>
                          {err.email && <span className="text-muted-foreground"> ({err.email})</span>}
                          <span className="text-destructive">: {err.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full" onClick={handleReset}>
                  Import Lagi
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right col — drop zone + preview */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Drop zone */}
          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => document.getElementById('csv-input')?.click()}
            className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
              isDragging
                ? 'border-primary bg-primary/5'
                : fileName
                  ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/20'
                  : 'border-border hover:border-primary/50 hover:bg-muted/30'
            }`}
          >
            {fileName ? (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                  <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{fileName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{preview.length} baris data ditemukan</p>
                </div>
                <p className="text-xs text-muted-foreground">Klik untuk ganti file</p>
              </>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Drag & drop file CSV di sini</p>
                  <p className="text-xs text-muted-foreground mt-0.5">atau klik untuk memilih file</p>
                </div>
                <Badge variant="outline" className="text-xs">Hanya file .csv</Badge>
              </>
            )}
            <input
              id="csv-input"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={onFileInput}
            />
          </div>

          {/* Preview table */}
          {preview.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader className="px-4 py-3 sm:px-6 border-b flex flex-row items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-sm">Preview Data</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Menampilkan 5 dari {preview.length} baris
                  </CardDescription>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {preview.length} baris
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="w-full overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {headers.map((h) => (
                          <TableHead key={h} className="text-xs font-medium whitespace-nowrap first:pl-4 sm:first:pl-6 last:pr-4 sm:last:pr-6">
                            <span className={REQUIRED_COLS.includes(h) ? 'text-primary' : ''}>
                              {h}
                            </span>
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.slice(0, 5).map((row, i) => (
                        <TableRow key={i}>
                          {Object.values(row).map((v, j) => (
                            <TableCell key={j} className="text-xs py-2 truncate max-w-[140px] first:pl-4 sm:first:pl-6 last:pr-4 sm:last:pr-6">
                              {v || <span className="text-muted-foreground/50">—</span>}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          {preview.length > 0 && (
            <div className="flex items-center justify-between gap-3 pt-1">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isLoading}
              >
                Batal
              </Button>
              <Button onClick={handleImport} disabled={isLoading}>
                {isLoading
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Mengimport...</>
                  : <><Upload className="mr-2 h-4 w-4" />Import {preview.length} Akun</>
                }
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Upload, Download, Loader2, CheckCircle2, XCircle, FileText, AlertCircle, X, FileUp, Info } from 'lucide-react'
import Papa from 'papaparse'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { ImportResult } from '@/types'

interface Props {
  universityId: string
}

const REQUIRED_COLS = ['full_name', 'email', 'role']
const OPTIONAL_COLS = ['nim', 'phone', 'study_program_id', 'current_semester']
const VALID_ROLES = ['student', 'lecturer', 'admin']

const TEMPLATE_ROWS = [
  { full_name: 'Budi Santoso', email: 'budi@kampus.ac.id', role: 'student', nim: '2021001001', phone: '081234567890', study_program_id: '', current_semester: '3' },
  { full_name: 'Siti Rahayu', email: 'siti@kampus.ac.id', role: 'student', nim: '2021001002', phone: '081234567891', study_program_id: '', current_semester: '3' },
  { full_name: 'Dr. Ahmad', email: 'ahmad@kampus.ac.id', role: 'lecturer', nim: '', phone: '081234567892', study_program_id: '', current_semester: '' },
]

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
        body: JSON.stringify({ rows: preview, university_id: universityId }),
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Gagal mengimport data')
        return
      }
      setResult(data.data)
      toast.success(`Import selesai — ${data.data?.imported ?? 0} akun berhasil`)
      router.refresh()
    } catch {
      toast.error('Terjadi kesalahan saat mengimport')
    } finally {
      setIsLoading(false)
    }
  }

  function handleReset() {
    setPreview([])
    setResult(null)
    setFileName('')
  }

  function downloadTemplate() {
    const headers = [...REQUIRED_COLS, ...OPTIONAL_COLS]
    const rows = TEMPLATE_ROWS.map(r => headers.map(h => (r as Record<string, string>)[h] ?? '').join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template-import-akun.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const allCols = preview.length > 0 ? Object.keys(preview[0]) : []
  const missingCols = REQUIRED_COLS.filter(c => !allCols.includes(c))

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Import Akun via CSV</h1>
        <p className="text-sm text-muted-foreground">Daftarkan mahasiswa, dosen wali, atau admin secara massal</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left — panduan & template */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                Panduan Format
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Kolom Wajib</p>
                <div className="space-y-1.5">
                  {REQUIRED_COLS.map(col => (
                    <div key={col} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{col}</code>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Kolom Opsional</p>
                <div className="space-y-1.5">
                  {OPTIONAL_COLS.map(col => (
                    <div key={col} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                      <code className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{col}</code>
                    </div>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Nilai Role Valid</p>
                <div className="flex flex-wrap gap-1.5">
                  {VALID_ROLES.map(r => (
                    <Badge key={r} variant="secondary" className="text-xs font-mono">{r}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full gap-2" onClick={downloadTemplate}>
            <Download className="h-4 w-4" />
            Unduh Template CSV
          </Button>
        </div>

        {/* Right — upload & preview */}
        <div className="lg:col-span-2 space-y-4">
          {/* Upload area */}
          {!preview.length && !result && (
            <Card>
              <CardContent className="pt-6">
                <label
                  htmlFor="csv-upload"
                  onDrop={onDrop}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-12 cursor-pointer transition-colors ${
                    isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/30'
                  }`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${isDragging ? 'bg-primary/10' : 'bg-muted'}`}>
                    <FileUp className={`h-6 w-6 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {isDragging ? 'Lepaskan file di sini' : 'Seret file CSV ke sini'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">atau klik untuk pilih file</p>
                  </div>
                  <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={onFileInput} />
                </label>
              </CardContent>
            </Card>
          )}

          {/* Preview tabel */}
          {preview.length > 0 && !result && (
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
                <div>
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    {fileName}
                  </CardTitle>
                  <CardDescription>{preview.length} baris data ditemukan</CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleReset}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>

              {missingCols.length > 0 && (
                <div className="mx-4 mb-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-destructive">Kolom wajib tidak ditemukan</p>
                    <p className="text-xs text-destructive/80 mt-0.5">
                      {missingCols.map(c => <code key={c} className="font-mono mr-1">{c}</code>)}
                    </p>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4 w-8 text-muted-foreground">#</TableHead>
                      {allCols.map(col => (
                        <TableHead key={col} className={REQUIRED_COLS.includes(col) ? 'font-semibold' : ''}>
                          {col}
                          {REQUIRED_COLS.includes(col) && <span className="text-destructive ml-0.5">*</span>}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.slice(0, 10).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="pl-4 text-muted-foreground text-xs">{i + 1}</TableCell>
                        {allCols.map(col => (
                          <TableCell key={col} className="text-sm max-w-[150px] truncate">
                            {row[col] || <span className="text-muted-foreground/50 text-xs italic">kosong</span>}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {preview.length > 10 && (
                <p className="text-xs text-muted-foreground text-center py-2 border-t">
                  Menampilkan 10 dari {preview.length} baris
                </p>
              )}

              <div className="flex items-center justify-between gap-3 px-4 py-3 border-t">
                <Button variant="outline" size="sm" onClick={handleReset} disabled={isLoading}>
                  <X className="h-4 w-4 mr-1.5" />
                  Batal
                </Button>
                <Button
                  size="sm"
                  onClick={handleImport}
                  disabled={isLoading || missingCols.length > 0}
                  className="gap-1.5"
                >
                  {isLoading
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Mengimport...</>
                    : <><Upload className="h-4 w-4" />Import {preview.length} Akun</>
                  }
                </Button>
              </div>
            </Card>
          )}

          {/* Hasil import */}
          {result && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Hasil Import</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{result.success ?? 0}</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">Berhasil</p>
                  </div>
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-center">
                    <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{result.failed ?? 0}</p>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">Gagal</p>
                  </div>
                  <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-3 text-center">
                    <p className="text-2xl font-bold text-destructive">{result.errors?.length ?? 0}</p>
                    <p className="text-xs text-destructive/70 mt-0.5">Error</p>
                  </div>
                </div>

                {result.errors && result.errors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Detail Error</p>
                    <div className="rounded-lg border divide-y max-h-48 overflow-y-auto">
                      {result.errors.map((err, i) => (
                        <div key={i} className="flex items-start gap-2 px-3 py-2">
                          <XCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                          <p className="text-xs text-muted-foreground">
                            Baris {err.row} · {err.email} — {err.reason}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5">
                    <FileUp className="h-4 w-4" />
                    Import File Lain
                  </Button>
                  <Button size="sm" onClick={() => router.push('/admin/users/students')} className="gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    Lihat Data Mahasiswa
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

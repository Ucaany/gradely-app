'use client'

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import {
  FileUp,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  X,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { GRADE_COLORS } from '@/components/student/grade-form-dialog'

interface ParsedGrade {
  course_name: string
  credits: number
  grade: string
  semester_number: number
  semester_type: string
  academic_year: string
}

interface ImportResult {
  imported: number
  skipped: number
  errors: string[]
}

export default function ImportKHSPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [parsedGrades, setParsedGrades] = useState<ParsedGrade[] | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(selected: File) {
    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowed.includes(selected.type)) {
      toast.error('Format tidak didukung. Gunakan PDF, PNG, JPG, atau WebP.')
      return
    }
    if (selected.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10 MB.')
      return
    }
    setFile(selected)
    setParsedGrades(null)
    setResult(null)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }

  async function handleParse() {
    if (!file) return
    setIsParsing(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/student/khs-import/parse', {
        method: 'POST',
        body: formData,
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error ?? 'Gagal membaca dokumen')
        return
      }
      if (!result.data?.length) {
        toast.error('Tidak ada data nilai yang berhasil diekstrak dari dokumen.')
        return
      }
      setParsedGrades(result.data)
      toast.success(`${result.data.length} mata kuliah berhasil dibaca dari dokumen`)
    } finally {
      setIsParsing(false)
    }
  }

  async function handleImport() {
    if (!parsedGrades?.length) return
    setIsImporting(true)
    try {
      const res = await fetch('/api/student/khs-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: parsedGrades }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Gagal mengimpor nilai')
        return
      }
      setResult(data)
      toast.success(`${data.imported} nilai berhasil diimpor`)
    } finally {
      setIsImporting(false)
    }
  }

  function handleReset() {
    setFile(null)
    setParsedGrades(null)
    setResult(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import KHS</h1>
        <p className="text-sm text-muted-foreground">
          Upload dokumen KHS dan AI akan mengekstrak data nilai secara otomatis
        </p>
      </div>

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Import Selesai
            </CardTitle>
            <CardDescription>Hasil proses import nilai dari KHS</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4">
                <p className="text-xs text-muted-foreground">Berhasil Diimpor</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{result.imported}</p>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-xs text-muted-foreground">Dilewati</p>
                <p className="text-2xl font-bold">{result.skipped}</p>
              </div>
              {result.errors.length > 0 && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-4">
                  <p className="text-xs text-muted-foreground">Error</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-400">{result.errors.length}</p>
                </div>
              )}
            </div>
            {result.errors.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 p-3 space-y-1">
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-700 dark:text-red-400">{e}</p>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/student/grades">Lihat Semua Nilai</Link>
              </Button>
              <Button variant="outline" onClick={handleReset}>Import Lagi</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-violet-500" />
                Upload Dokumen KHS
              </CardTitle>
              <CardDescription>
                Mendukung file PDF, PNG, JPG, WebP — maksimal 10 MB
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!file ? (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? 'border-primary bg-primary/5'
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/40'
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
                    <FileUp className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Klik atau seret file ke sini</p>
                    <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG, WebP · Maks. 10 MB</p>
                  </div>
                  <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleFile(f)
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(0)} KB · {file.type.split('/')[1].toUpperCase()}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleReset}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {file && !parsedGrades && (
                <Button onClick={handleParse} disabled={isParsing} className="w-full">
                  {isParsing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      AI sedang membaca dokumen...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Baca dengan AI
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>

          {parsedGrades && parsedGrades.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">Hasil Ekstraksi AI</CardTitle>
                  <CardDescription>
                    {parsedGrades.length} mata kuliah ditemukan — periksa sebelum mengimpor
                  </CardDescription>
                </div>
                <Badge variant="outline" className="shrink-0 text-violet-600 border-violet-300 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400">
                  {parsedGrades.length} MK
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4 sm:pl-6">Mata Kuliah</TableHead>
                        <TableHead className="w-14 text-center">SKS</TableHead>
                        <TableHead className="w-16 text-center">Nilai</TableHead>
                        <TableHead className="w-20 text-center">Semester</TableHead>
                        <TableHead className="pr-4 sm:pr-6 w-28">Tahun Ajaran</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedGrades.map((g, i) => (
                        <TableRow key={i}>
                          <TableCell className="pl-4 sm:pl-6 text-sm font-medium">{g.course_name}</TableCell>
                          <TableCell className="text-center text-sm">{g.credits}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className={`text-xs font-semibold ${GRADE_COLORS[g.grade] ?? ''}`}>
                              {g.grade}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-sm text-muted-foreground">{g.semester_number}</TableCell>
                          <TableCell className="pr-4 sm:pr-6 text-sm text-muted-foreground">{g.academic_year}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex gap-2 p-4 border-t">
                  <Button onClick={handleImport} disabled={isImporting}>
                    {isImporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mengimpor...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Import {parsedGrades.length} Nilai
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleReset} disabled={isImporting}>
                    Batal
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!parsedGrades && (
            <Card className="border-dashed">
              <CardContent className="py-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Cara penggunaan</p>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                       <li>Upload file KHS dalam format PDF atau gambar</li>
                       <li>AI akan membaca dan mengekstrak data mata kuliah, SKS, dan nilai</li>
                       <li>Periksa hasil ekstraksi sebelum mengimpor ke sistem</li>
                     </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

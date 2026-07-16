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
  Pencil,
  Check,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
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

const VALID_GRADES = ['A', 'A-', 'BA', 'B+', 'B', 'B-', 'C', 'D', 'E']

const SEMESTER_TYPE: Record<number, string> = {
  1: 'ganjil', 2: 'genap', 3: 'ganjil', 4: 'genap', 5: 'ganjil',
  6: 'genap', 7: 'ganjil', 8: 'genap', 9: 'ganjil', 10: 'genap',
  11: 'ganjil', 12: 'genap', 13: 'ganjil', 14: 'genap',
}

export default function ImportKHSPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [parsedGrades, setParsedGrades] = useState<ParsedGrade[] | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editRow, setEditRow] = useState<ParsedGrade | null>(null)
  const [overrideSemester, setOverrideSemester] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(selected: File) {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowed.includes(selected.type)) {
      toast.error('Format tidak didukung. Gunakan PNG, JPG, atau WebP.')
      return
    }
    if (selected.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10 MB.')
      return
    }
    setFile(selected)
    setParsedGrades(null)
    setResult(null)
    setOverrideSemester('')
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

  function applyOverrideSemester(grades: ParsedGrade[], semNum: number): ParsedGrade[] {
    return grades.map((g) => ({
      ...g,
      semester_number: semNum,
      semester_type: SEMESTER_TYPE[semNum] ?? (semNum % 2 === 1 ? 'ganjil' : 'genap'),
    }))
  }

  function handleStartEdit(index: number) {
    if (!parsedGrades) return
    setEditingIndex(index)
    setEditRow({ ...parsedGrades[index] })
  }

  function handleSaveEdit() {
    if (editingIndex === null || !editRow || !parsedGrades) return
    const updated = [...parsedGrades]
    updated[editingIndex] = {
      ...editRow,
      semester_type: SEMESTER_TYPE[editRow.semester_number] ?? (editRow.semester_number % 2 === 1 ? 'ganjil' : 'genap'),
    }
    setParsedGrades(updated)
    setEditingIndex(null)
    setEditRow(null)
  }

  function handleCancelEdit() {
    setEditingIndex(null)
    setEditRow(null)
  }

  function handleDeleteRow(index: number) {
    if (!parsedGrades) return
    setParsedGrades(parsedGrades.filter((_, i) => i !== index))
  }

  async function handleImport() {
    if (!parsedGrades?.length) return
    let gradesToImport = parsedGrades
    if (overrideSemester) {
      gradesToImport = applyOverrideSemester(parsedGrades, parseInt(overrideSemester))
    }
    setIsImporting(true)
    try {
      const res = await fetch('/api/student/khs-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: gradesToImport }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Gagal mengimpor nilai')
        return
      }
      setResult(data.data)
      toast.success(`${data.data.imported} nilai berhasil diimpor`)
    } finally {
      setIsImporting(false)
    }
  }

  function handleReset() {
    setFile(null)
    setParsedGrades(null)
    setResult(null)
    setEditingIndex(null)
    setEditRow(null)
    setOverrideSemester('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import KHS</h1>
        <p className="text-sm text-muted-foreground">
          Upload foto KHS dan AI akan mengekstrak data nilai secara otomatis
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
                Upload Foto KHS
              </CardTitle>
              <CardDescription>
                Mendukung file PNG, JPG, WebP — maksimal 10 MB
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
                    <p className="font-medium text-sm">Klik atau seret foto ke sini</p>
                    <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP · Maks. 10 MB</p>
                  </div>
                  <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept=".png,.jpg,.jpeg,.webp"
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
                      AI sedang membaca foto...
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
                    {parsedGrades.length} mata kuliah ditemukan — periksa dan edit sebelum mengimpor
                  </CardDescription>
                </div>
                <Badge variant="outline" className="shrink-0 text-violet-600 border-violet-300 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400">
                  {parsedGrades.length} MK
                </Badge>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Semester KHS ini untuk semester berapa?</Label>
                    <p className="text-xs text-muted-foreground">
                      Opsional. Jika diisi, semua baris akan diset ke semester yang dipilih.
                    </p>
                  </div>
                  <Select value={overrideSemester} onValueChange={setOverrideSemester}>
                    <SelectTrigger className="w-full sm:w-64">
                      <SelectValue placeholder="Gunakan semester dari AI (default)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Gunakan semester dari AI (default)</SelectItem>
                      {Array.from({ length: 14 }, (_, i) => i + 1).map((s) => (
                        <SelectItem key={s} value={String(s)}>
                          Semester {s} ({SEMESTER_TYPE[s]})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-4">Mata Kuliah</TableHead>
                        <TableHead className="w-14 text-center">SKS</TableHead>
                        <TableHead className="w-20 text-center">Nilai</TableHead>
                        <TableHead className="w-24 text-center">Semester</TableHead>
                        <TableHead className="w-28">Tahun Ajaran</TableHead>
                        <TableHead className="w-20 pr-4 text-center">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedGrades.map((g, i) => (
                        <TableRow key={i}>
                          {editingIndex === i && editRow ? (
                            <>
                              <TableCell className="pl-4">
                                <Input
                                  value={editRow.course_name}
                                  onChange={(e) => setEditRow({ ...editRow, course_name: e.target.value })}
                                  className="h-7 text-xs"
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Input
                                  type="number"
                                  min={1}
                                  max={6}
                                  value={editRow.credits}
                                  onChange={(e) => setEditRow({ ...editRow, credits: parseInt(e.target.value) || 1 })}
                                  className="h-7 text-xs w-14 text-center mx-auto"
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Select value={editRow.grade} onValueChange={(v) => setEditRow({ ...editRow, grade: v })}>
                                  <SelectTrigger className="h-7 text-xs w-16 mx-auto">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {VALID_GRADES.map((gr) => (
                                      <SelectItem key={gr} value={gr}>{gr}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-center">
                                <Input
                                  type="number"
                                  min={1}
                                  max={14}
                                  value={overrideSemester ? parseInt(overrideSemester) : editRow.semester_number}
                                  onChange={(e) => {
                                    if (!overrideSemester) setEditRow({ ...editRow, semester_number: parseInt(e.target.value) || 1 })
                                  }}
                                  disabled={!!overrideSemester}
                                  className="h-7 text-xs w-16 text-center mx-auto disabled:opacity-50"
                                  title={overrideSemester ? 'Semester dikontrol oleh pilihan override di atas' : undefined}
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={editRow.academic_year}
                                  onChange={(e) => setEditRow({ ...editRow, academic_year: e.target.value })}
                                  className="h-7 text-xs w-24"
                                />
                              </TableCell>
                              <TableCell className="pr-4">
                                <div className="flex items-center justify-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-emerald-600" onClick={handleSaveEdit}>
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCancelEdit}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell className="pl-4 text-sm font-medium">{g.course_name}</TableCell>
                              <TableCell className="text-center text-sm">{g.credits}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className={`text-xs font-semibold ${GRADE_COLORS[g.grade] ?? ''}`}>
                                  {g.grade}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center text-sm text-muted-foreground">
                                {overrideSemester ? parseInt(overrideSemester) : g.semester_number}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{g.academic_year}</TableCell>
                              <TableCell className="pr-4">
                                <div className="flex items-center justify-center gap-1">
                                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStartEdit(i)}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteRow(i)}>
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleImport} disabled={isImporting || editingIndex !== null}>
                    {isImporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mengimpor...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Import {parsedGrades.length} Nilai
                        {overrideSemester ? ` ke Semester ${overrideSemester}` : ''}
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
                      <li>Upload foto KHS dalam format PNG, JPG, atau WebP</li>
                      <li>AI akan membaca dan mengekstrak data mata kuliah, SKS, dan nilai</li>
                      <li>Pilih semester yang sesuai, edit data jika perlu, lalu konfirmasi import</li>
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

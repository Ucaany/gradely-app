'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Upload, Download, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import Papa from 'papaparse'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { ImportResult } from '@/types'

interface Props {
  universityId: string
}

export function ImportCsvForm({ universityId }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [result, setResult] = useState<ImportResult | null>(null)
  const [fileName, setFileName] = useState('')

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

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Import Akun via CSV</h1>
          <p className="text-muted-foreground">
            Upload file CSV untuk membuat banyak akun sekaligus
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </Button>
      </div>

      {/* Format info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Format CSV yang diperlukan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Kolom wajib: <code className="bg-muted px-1 rounded">full_name</code>, <code className="bg-muted px-1 rounded">email</code>, <code className="bg-muted px-1 rounded">role</code></p>
            <p>Kolom opsional: <code className="bg-muted px-1 rounded">nim</code>, <code className="bg-muted px-1 rounded">phone</code>, <code className="bg-muted px-1 rounded">study_program_id</code>, <code className="bg-muted px-1 rounded">current_semester</code></p>
            <p>Nilai role: <code className="bg-muted px-1 rounded">student</code> | <code className="bg-muted px-1 rounded">lecturer</code> | <code className="bg-muted px-1 rounded">admin</code></p>
            <p className="text-amber-600">Password default: <strong>Gradely@2024</strong> (minta pengguna mengubah setelah login pertama)</p>
          </div>
        </CardContent>
      </Card>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
        onClick={() => document.getElementById('csv-input')?.click()}
      >
        <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium">
          {fileName ? fileName : 'Drag & drop file CSV atau klik untuk pilih'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">Hanya file .csv</p>
        <input
          id="csv-input"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={onFileInput}
        />
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              Preview — {preview.length} baris data
            </CardTitle>
            <CardDescription>5 baris pertama ditampilkan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr className="border-b">
                    {Object.keys(preview[0]).map((k) => (
                      <th key={k} className="text-left py-1 pr-4 font-medium text-muted-foreground">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      {Object.values(row).map((v, j) => (
                        <td key={j} className="py-1 pr-4 truncate max-w-[120px]">{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => { setPreview([]); setFileName('') }}
              >
                Batal
              </Button>
              <Button size="sm" onClick={handleImport} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Mengimport...' : `Import ${preview.length} Akun`}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {result && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Hasil Import</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">{result.success} berhasil</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium">{result.failed} gagal</span>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-destructive">Detail Error:</p>
                {result.errors.map((err, i) => (
                  <div key={i} className="text-xs p-2 bg-destructive/10 rounded">
                    <span className="font-medium">Baris {err.row}</span> ({err.email}): {err.reason}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

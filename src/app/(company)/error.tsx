'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function CompanyError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-semibold">Terjadi Kesalahan</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Gagal memuat halaman. Silakan coba lagi.
        </p>
      </div>
      <Button onClick={reset} variant="outline" size="sm">
        Coba Lagi
      </Button>
    </div>
  )
}

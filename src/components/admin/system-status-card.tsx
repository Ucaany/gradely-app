'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, XCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react'

interface HealthItem {
  label: string
  status: string
  ok: boolean
}

export function SystemStatusCard() {
  const [items, setItems] = useState<HealthItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const fetchStatus = useCallback(() => {
    setIsLoading(true)
    fetch('/api/admin/health')
      .then((r) => r.json())
      .then((d) => { if (d.success) setItems(d.data ?? []) })
      .catch(() => {})
      .finally(() => {
        setIsLoading(false)
        setLastChecked(new Date())
      })
  }, [])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 60000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Status Sistem</CardTitle>
            <CardDescription>
              {lastChecked
                ? `Dicek ${lastChecked.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
                : 'Kondisi layanan saat ini'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchStatus} disabled={isLoading}>
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            Tidak dapat memuat status sistem
          </div>
        ) : (
          items.map((item, i) => (
            <div key={item.label}>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  {item.ok
                    ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                    : <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                  }
                  <span className="text-sm">{item.label}</span>
                </div>
                <Badge
                  variant="outline"
                  className={`shrink-0 text-xs ${item.ok
                    ? 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
                    : 'text-destructive border-destructive/30 bg-destructive/5'
                  }`}
                >
                  {item.status}
                </Badge>
              </div>
              {i < items.length - 1 && <Separator />}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

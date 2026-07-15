'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  CheckCircle2, XCircle, Clock, MessageCircle, ChevronLeft, ChevronRight, Loader2, RefreshCw,
} from 'lucide-react'

interface WahaLog {
  id: string
  phone_number: string
  message: string
  status: string
  error_message: string | null
  sent_at: string | null
  created_at: string
}

interface Props {
  period: string
}

const PAGE_SIZE = 10

export function WhatsAppLogsCard({ period }: Props) {
  const [logs, setLogs] = useState<WahaLog[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const fetchLogs = useCallback((p: number) => {
    setIsLoading(true)
    fetch(`/api/admin/whatsapp-logs?page=${p}&pageSize=${PAGE_SIZE}&period=${period}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) {
          setLogs(d.data.logs)
          setTotal(d.data.total)
          setTotalPages(d.data.totalPages)
          setPage(d.data.page)
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [period])

  useEffect(() => {
    setPage(1)
    fetchLogs(1)
  }, [period, fetchLogs])

  function handlePrev() {
    if (page <= 1) return
    fetchLogs(page - 1)
  }

  function handleNext() {
    if (page >= totalPages) return
    fetchLogs(page + 1)
  }

  function statusBadge(status: string) {
    if (status === 'sent' || status === 'delivered') {
      return (
        <Badge variant="outline" className="text-xs gap-1 text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
          <CheckCircle2 className="h-3 w-3" />
          {status === 'delivered' ? 'Terkirim' : 'Dikirim'}
        </Badge>
      )
    }
    if (status === 'failed' || status === 'error') {
      return (
        <Badge variant="outline" className="text-xs gap-1 text-destructive border-destructive/30 bg-destructive/5">
          <XCircle className="h-3 w-3" />
          Gagal
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="text-xs gap-1 text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    )
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <MessageCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <CardTitle className="text-base">Riwayat Pesan WhatsApp</CardTitle>
              <CardDescription>
                {total > 0 ? `${total} pesan ditemukan` : 'Belum ada pesan'}
              </CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => fetchLogs(page)} disabled={isLoading}>
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
            <MessageCircle className="h-8 w-8 opacity-30" />
            <p className="text-sm">Belum ada riwayat pesan</p>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6 text-xs">Nomor</TableHead>
                  <TableHead className="text-xs">Pesan</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="pr-6 text-xs text-right">Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="pl-6 font-mono text-xs text-muted-foreground whitespace-nowrap">
                      {log.phone_number}
                    </TableCell>
                    <TableCell className="max-w-[220px]">
                      <p className="text-xs line-clamp-2 text-foreground">{log.message}</p>
                      {log.error_message && (
                        <p className="text-xs text-destructive mt-0.5 line-clamp-1">{log.error_message}</p>
                      )}
                    </TableCell>
                    <TableCell>{statusBadge(log.status)}</TableCell>
                    <TableCell className="pr-6 text-xs text-muted-foreground text-right whitespace-nowrap">
                      {formatDate(log.sent_at ?? log.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t px-6 py-3">
                <p className="text-xs text-muted-foreground">
                  Halaman {page} dari {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handlePrev}
                    disabled={page <= 1 || isLoading}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleNext}
                    disabled={page >= totalPages || isLoading}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

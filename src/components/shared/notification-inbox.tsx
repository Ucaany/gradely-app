'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Bell, CheckCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Notification } from '@/types'

function formatRelative(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Baru saja'
  if (mins < 60) return `${mins} menit lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  return `${days} hari lalu`
}

export function NotificationInbox() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [marking, setMarking] = useState(false)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  async function fetchNotifications() {
    setLoading(true)
    try {
      const res = await fetch('/api/student/notifications', { credentials: 'include' })
      const result = await res.json()
      if (result.success) setNotifications(result.data ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) fetchNotifications()
  }, [open])

  async function markAllRead() {
    if (unreadCount === 0) return
    setMarking(true)
    try {
      await fetch('/api/student/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
        credentials: 'include',
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
      toast.success('Semua notifikasi ditandai telah dibaca')
    } finally {
      setMarking(false)
    }
  }

  async function markOneRead(id: string) {
    await fetch('/api/student/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
      credentials: 'include',
    })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-0 p-0 w-full sm:max-w-sm">
        <SheetHeader className="flex flex-row items-center justify-between px-4 py-4 border-b">
          <SheetTitle className="text-base">
            Notifikasi
            {unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">{unreadCount} baru</Badge>
            )}
          </SheetTitle>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={markAllRead}
              disabled={marking}
            >
              {marking ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
              Tandai semua
            </Button>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <Bell className="h-8 w-8 opacity-30" />
              <p className="text-sm">Belum ada notifikasi</p>
            </div>
          ) : (
            <ul>
              {notifications.map((n, i) => (
                <li key={n.id}>
                  <button
                    className={`w-full text-left px-4 py-3 transition-colors hover:bg-muted/50 ${!n.is_read ? 'bg-muted/30' : ''}`}
                    onClick={() => { if (!n.is_read) markOneRead(n.id) }}
                  >
                    <div className="flex items-start gap-2.5">
                      {!n.is_read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                      <div className={`flex-1 min-w-0 ${n.is_read ? 'ml-4' : ''}`}>
                        <p className="text-sm font-medium leading-tight truncate">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                        <p className="text-[11px] text-muted-foreground/60 mt-1">{formatRelative(n.created_at)}</p>
                      </div>
                    </div>
                  </button>
                  {i < notifications.length - 1 && <Separator />}
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

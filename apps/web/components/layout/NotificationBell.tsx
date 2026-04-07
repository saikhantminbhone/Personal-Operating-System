'use client'
import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Bell, Check, X, Trash2 } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

const TYPE_ICONS: Record<string, string> = {
  HABIT_REMINDER: '🔄', GOAL_MILESTONE: '🎯', TASK_DUE: '📋',
  STREAK_AT_RISK: '⚠️', WEEKLY_SUMMARY: '📊', AI_INSIGHT: '🤖', SYSTEM: '⚙️',
}

export function NotificationBell() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const { data: unread } = useQuery<{ count: number }>({
    queryKey: ['notifications', 'unread'],
    queryFn: () => api.get('/notifications/unread-count'),
    refetchInterval: 30000,
    retry: false,
  })

  const { data: notifications } = useQuery<any[]>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications', { params: { limit: 15 } }),
    enabled: open,
    retry: false,
  })

  const markRead = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllRead = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const deleteNotif = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const count = unread?.count || 0

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={() => setOpen(o => !o)}
        className="relative p-2 text-os-muted hover:text-os-text transition-colors rounded-lg hover:bg-white/[0.04] min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation">
        <Bell className="w-4 h-4" />
        {count > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-os-danger text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-72 sm:w-80 bg-os-surface border border-os-border rounded-xl shadow-os z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-os-border">
            <span className="text-xs font-mono font-semibold text-os-text">Notifications</span>
            <div className="flex items-center gap-2">
              {count > 0 && (
                <button onClick={() => markAllRead.mutate()}
                  className="text-[10px] font-mono text-os-accent hover:underline touch-manipulation">
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-os-muted hover:text-os-text p-1 touch-manipulation">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {!notifications || notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-6 h-6 text-os-muted/30 mx-auto mb-2" />
                <p className="text-[11px] font-mono text-os-muted">No notifications</p>
              </div>
            ) : notifications.map(n => (
              <div key={n.id}
                className={`flex items-start gap-3 px-4 py-3 border-b border-os-border/50 hover:bg-white/[0.02] group ${!n.read ? 'bg-os-accent/[0.03]' : ''}`}>
                <span className="text-sm flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] || '🔔'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-mono text-os-text font-semibold leading-tight">{n.title}</p>
                  <p className="text-[10px] font-mono text-os-muted mt-0.5 leading-relaxed">{n.body}</p>
                  <p className="text-[9px] font-mono text-os-muted/60 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!n.read && (
                    <button onClick={() => markRead.mutate(n.id)}
                      className="p-1 text-os-muted hover:text-os-success touch-manipulation">
                      <Check className="w-3 h-3" />
                    </button>
                  )}
                  <button onClick={() => deleteNotif.mutate(n.id)}
                    className="p-1 text-os-muted hover:text-os-danger touch-manipulation">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-os-accent flex-shrink-0 mt-1.5" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

const DURATION = 3500

export function Toast() {
  const { toast, clearToast } = useAppStore()
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    if (!toast) { setProgress(100); return }
    setProgress(100)
    const start = Date.now()
    const id = setInterval(() => {
      const elapsed = Date.now() - start
      setProgress(Math.max(0, 100 - (elapsed / DURATION) * 100))
    }, 16)
    return () => clearInterval(id)
  }, [toast])

  if (!toast) return null

  const config = {
    success: { icon: CheckCircle, accent: '#22c55e', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.2)' },
    error:   { icon: XCircle,      accent: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)' },
    info:    { icon: Info,         accent: '#64ffda', bg: 'rgba(100,255,218,0.08)',border: 'rgba(100,255,218,0.2)' },
  }[toast.type]

  const Icon = config.icon

  return (
    <div
      className="fixed top-4 right-4 z-[99999] w-72 overflow-hidden rounded-xl shadow-2xl animate-slide-down"
      style={{ background: '#0D1520', border: `1px solid ${config.border}` }}
      role="alert"
    >
      {/* Colored left accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ background: config.accent }} />

      {/* Content */}
      <div className="flex items-start gap-3 px-4 py-3 pl-5">
        <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: config.bg }}>
          <Icon className="w-4 h-4" style={{ color: config.accent }} />
        </div>
        <p className="flex-1 text-sm font-mono text-[#E2E8F0] leading-snug pt-0.5">{toast.message}</p>
        <button
          onClick={clearToast}
          className="flex-shrink-0 mt-0.5 text-[#64748b] hover:text-[#E2E8F0] transition-colors p-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 w-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <div
          className="h-full transition-none rounded-full"
          style={{ width: `${progress}%`, background: config.accent, opacity: 0.6 }}
        />
      </div>
    </div>
  )
}

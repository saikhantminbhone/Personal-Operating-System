'use client'
import { useAppStore } from '@/store/useAppStore'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'

export function Toast() {
  const { toast, clearToast } = useAppStore()
  if (!toast) return null

  const icons = { success: CheckCircle, error: XCircle, info: Info }
  const colors = { success: 'text-os-success border-os-success/30', error: 'text-os-danger border-os-danger/30', info: 'text-os-accent border-os-accent/30' }
  const Icon = icons[toast.type]

  return (
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-os-surface border rounded-lg px-4 py-3 shadow-os animate-slide-up ${colors[toast.type]}`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm font-mono text-os-text">{toast.message}</span>
      <button onClick={clearToast} className="text-os-muted hover:text-os-text ml-2">
        <X className="w-3 h-3" />
      </button>
    </div>
  )
}

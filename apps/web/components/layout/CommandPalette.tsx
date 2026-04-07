'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { Modal } from '@/components/ui/Modal'
import { useAppStore } from '@/store/useAppStore'
import { Search, FileText, CheckSquare, Target, ArrowRight, Loader2 } from 'lucide-react'

const TYPE_META: Record<string, { icon: any; color: string; label: string }> = {
  notes:  { icon: FileText,    color: '#64ffda', label: 'Note' },
  tasks:  { icon: CheckSquare, color: '#a78bfa', label: 'Task' },
  goals:  { icon: Target,      color: '#f59e0b', label: 'Goal' },
}

const QUICK_LINKS = [
  { label: 'Dashboard',    url: '/dashboard',           icon: '⬡' },
  { label: 'Goals',        url: '/dashboard/goals',     icon: '🎯' },
  { label: 'Tasks',        url: '/dashboard/tasks',     icon: '✅' },
  { label: 'Habits',       url: '/dashboard/habits',    icon: '🔄' },
  { label: 'AI Assistant', url: '/dashboard/ai',        icon: '🤖' },
  { label: 'Analytics',    url: '/dashboard/analytics', icon: '📊' },
  { label: 'Finance',      url: '/dashboard/finance',   icon: '💰' },
  { label: 'Knowledge',    url: '/dashboard/knowledge', icon: '📚' },
  { label: 'Billing',      url: '/dashboard/billing',   icon: '💳' },
]

export function CommandPalette() {
  const router = useRouter()
  const { activeModal, setModal } = useAppStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const open = activeModal === 'command'

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setModal(open ? null : 'command')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, setModal])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
      setQuery('')
      setResults([])
      setSelectedIdx(0)
    }
  }, [open])

  // Search with debounce
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await api.get('/search', { params: { q: query, limit: 12 } })
        setResults(Array.isArray(data) ? data : [])
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 250)
    return () => clearTimeout(debounceRef.current)
  }, [query])

  const allItems = query ? results : []
  const quickLinks = query ? [] : QUICK_LINKS
  const total = allItems.length + quickLinks.length

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => (i + 1) % total) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIdx(i => (i - 1 + total) % total) }
    if (e.key === 'Enter') {
      e.preventDefault()
      const item = selectedIdx < allItems.length ? allItems[selectedIdx] : quickLinks[selectedIdx - allItems.length]
      if (item) navigate(item)
    }
  }

  function navigate(item: any) {
    router.push(item.url)
    setModal(null)
    setQuery('')
  }

  return (
    <Modal open={open} onClose={() => setModal(null)} size="lg">
      <div className="-mx-5 -mt-5 sm:-mx-6 sm:-mt-6">
        <div className="flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-os-border">
          <Search className="w-4 h-4 text-os-muted flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIdx(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Search notes, tasks, goals... or jump to a page"
            className="flex-1 bg-transparent font-mono text-sm text-os-text placeholder:text-os-muted outline-none"
          />
          {loading && <Loader2 className="w-3.5 h-3.5 text-os-muted animate-spin" />}
          <kbd className="hidden sm:block text-[10px] font-mono px-1.5 py-0.5 rounded border border-os-border text-os-muted">ESC</kbd>
        </div>

        <div className="py-2 max-h-80 overflow-y-auto">
          {allItems.map((item, i) => {
            const meta = TYPE_META[item.entityType] || TYPE_META.notes
            const Icon = meta.icon
            const selected = i === selectedIdx
            return (
              <button key={item.id} onClick={() => navigate(item)}
                onMouseEnter={() => setSelectedIdx(i)}
                className={`w-full flex items-center gap-3 px-4 sm:px-5 py-3 text-left transition-colors ${selected ? 'bg-os-accent/10' : 'hover:bg-white/[0.03]'}`}>
                <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" style={{ background: `${meta.color}15` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-os-text truncate">{item.title}</p>
                  {item.subtitle && <p className="text-[10px] font-mono text-os-muted truncate">{item.subtitle}</p>}
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{ color: meta.color, background: `${meta.color}15` }}>{meta.label}</span>
              </button>
            )
          })}

          {quickLinks.length > 0 && (
            <>
              <div className="px-4 sm:px-5 py-2">
                <span className="text-[9px] font-mono tracking-widest uppercase text-os-muted">Quick navigation</span>
              </div>
              {quickLinks.map((link, i) => {
                const selected = i + allItems.length === selectedIdx
                return (
                  <button key={link.url} onClick={() => navigate(link)}
                    onMouseEnter={() => setSelectedIdx(i + allItems.length)}
                    className={`w-full flex items-center gap-3 px-4 sm:px-5 py-3 text-left transition-colors ${selected ? 'bg-os-accent/10' : 'hover:bg-white/[0.03]'}`}>
                    <span className="text-base w-7 text-center">{link.icon}</span>
                    <span className="text-xs font-mono text-os-text">{link.label}</span>
                    {selected && <ArrowRight className="w-3 h-3 text-os-muted ml-auto" />}
                  </button>
                )
              })}
            </>
          )}

          {query && !loading && results.length === 0 && (
            <div className="px-5 py-8 text-center">
              <p className="text-xs font-mono text-os-muted">No results for "{query}"</p>
            </div>
          )}
        </div>

        <div className="hidden sm:flex px-5 py-3 border-t border-os-border items-center gap-4">
          <span className="text-[10px] font-mono text-os-muted">
            <kbd className="px-1 py-0.5 rounded border border-os-border mr-1">↑↓</kbd> Navigate
          </span>
          <span className="text-[10px] font-mono text-os-muted">
            <kbd className="px-1 py-0.5 rounded border border-os-border mr-1">↵</kbd> Open
          </span>
          <span className="text-[10px] font-mono text-os-muted">
            <kbd className="px-1 py-0.5 rounded border border-os-border mr-1">⌘K</kbd> Toggle
          </span>
        </div>
      </div>
    </Modal>
  )
}

'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { api, aiApi } from '@/lib/api'
import { Modal } from '@/components/ui/Modal'
import { useAppStore } from '@/store/useAppStore'
import { Search, FileText, CheckSquare, Target, ArrowRight, Loader2, Sparkles, Repeat2, FolderKanban } from 'lucide-react'

const TYPE_META: Record<string, { icon: any; color: string; label: string }> = {
  notes:    { icon: FileText,     color: '#64ffda', label: 'Note' },
  tasks:    { icon: CheckSquare,  color: '#a78bfa', label: 'Task' },
  goals:    { icon: Target,       color: '#f59e0b', label: 'Goal' },
  habits:   { icon: Repeat2,      color: '#22c55e', label: 'Habit' },
  projects: { icon: FolderKanban, color: '#00b4d8', label: 'Project' },
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
  { label: 'Projects',     url: '/dashboard/projects',  icon: '🗂' },
]

export function CommandPalette() {
  const router = useRouter()
  const { activeModal, setModal } = useAppStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiIntent, setAiIntent] = useState<string | null>(null)
  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const open = activeModal === 'command'

  // Detect AI mode: query starts with "?" or is a full natural-language sentence
  const isAiMode = query.startsWith('?') || (query.trim().split(' ').length >= 4)
  const searchQuery = query.startsWith('?') ? query.slice(1).trim() : query.trim()

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
      setAiIntent(null)
      setAiInsight(null)
    }
  }, [open])

  // Search with debounce
  useEffect(() => {
    if (!searchQuery) { setResults([]); setAiIntent(null); setAiInsight(null); return }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setAiIntent(null)
      setAiInsight(null)
      try {
        const data = await api.get('/search', { params: { q: searchQuery, limit: 15 } })
        const raw: any[] = Array.isArray(data) ? data : []
        setResults(raw)

        // AI re-ranking for AI mode or when there are enough results
        if (raw.length >= 3 && (isAiMode || raw.length >= 6)) {
          setAiLoading(true)
          try {
            const ai = await aiApi.semanticSearch(searchQuery, raw) as any
            if (ai?.results?.length) setResults(ai.results)
            if (ai?.intent) setAiIntent(ai.intent)
            if (ai?.topInsight) setAiInsight(ai.topInsight)
          } catch {}
          finally { setAiLoading(false) }
        }
      } catch { setResults([]) }
      finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [searchQuery])

  const quickLinks = searchQuery ? [] : QUICK_LINKS
  const total = results.length + quickLinks.length

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIdx(i => (i + 1) % total) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelectedIdx(i => (i - 1 + total) % total) }
    if (e.key === 'Enter') {
      e.preventDefault()
      const item = selectedIdx < results.length ? results[selectedIdx] : quickLinks[selectedIdx - results.length]
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
        {/* Input */}
        <div className="flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-os-border">
          {isAiMode && searchQuery
            ? <Sparkles className="w-4 h-4 text-os-accent flex-shrink-0" />
            : <Search className="w-4 h-4 text-os-muted flex-shrink-0" />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIdx(0) }}
            onKeyDown={handleKeyDown}
            placeholder="Search everything... or start with ? for AI search"
            className="flex-1 bg-transparent font-mono text-sm text-os-text placeholder:text-os-muted outline-none"
          />
          {(loading || aiLoading) && <Loader2 className="w-3.5 h-3.5 text-os-muted animate-spin flex-shrink-0" />}
          <kbd className="hidden sm:block text-[10px] font-mono px-1.5 py-0.5 rounded border border-os-border text-os-muted">ESC</kbd>
        </div>

        {/* AI intent banner */}
        {aiIntent && (
          <div className="flex items-center gap-2 px-4 sm:px-5 py-2 bg-os-accent/5 border-b border-os-accent/10">
            <Sparkles className="w-3 h-3 text-os-accent flex-shrink-0" />
            <p className="text-[10px] font-mono text-os-accent">{aiIntent}</p>
          </div>
        )}

        {/* Results */}
        <div className="py-2 max-h-[60vh] sm:max-h-80 overflow-y-auto">
          {results.map((item, i) => {
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
                  <p className="text-xs font-mono text-os-text truncate"
                    dangerouslySetInnerHTML={{ __html: item.highlight || item.title }} />
                  {item.subtitle && <p className="text-[10px] font-mono text-os-muted truncate">{item.subtitle}</p>}
                  {i === 0 && aiInsight && (
                    <p className="text-[10px] font-mono text-os-accent/70 truncate mt-0.5">{aiInsight}</p>
                  )}
                </div>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                  style={{ color: meta.color, background: `${meta.color}15` }}>{meta.label}</span>
              </button>
            )
          })}

          {/* Quick navigation */}
          {quickLinks.length > 0 && (
            <>
              <div className="px-4 sm:px-5 py-2">
                <span className="text-[9px] font-mono tracking-widest uppercase text-os-muted">Quick navigation</span>
              </div>
              {quickLinks.map((link, i) => {
                const selected = i + results.length === selectedIdx
                return (
                  <button key={link.url} onClick={() => navigate(link)}
                    onMouseEnter={() => setSelectedIdx(i + results.length)}
                    className={`w-full flex items-center gap-3 px-4 sm:px-5 py-3 text-left transition-colors ${selected ? 'bg-os-accent/10' : 'hover:bg-white/[0.03]'}`}>
                    <span className="text-base w-7 text-center flex-shrink-0">{link.icon}</span>
                    <span className="text-xs font-mono text-os-text">{link.label}</span>
                    {selected && <ArrowRight className="w-3 h-3 text-os-muted ml-auto" />}
                  </button>
                )
              })}
            </>
          )}

          {searchQuery && !loading && !aiLoading && results.length === 0 && (
            <div className="px-5 py-8 text-center space-y-2">
              <p className="text-xs font-mono text-os-muted">No results for "{searchQuery}"</p>
              {!isAiMode && (
                <p className="text-[10px] font-mono text-os-muted/60">
                  Try <span className="text-os-accent">?{searchQuery}</span> for AI-powered search
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer hints */}
        <div className="flex px-4 sm:px-5 py-3 border-t border-os-border items-center gap-3 flex-wrap">
          <span className="text-[10px] font-mono text-os-muted hidden sm:block">
            <kbd className="px-1 py-0.5 rounded border border-os-border mr-1">↑↓</kbd> Navigate
            <kbd className="px-1 py-0.5 rounded border border-os-border mx-1 ml-2">↵</kbd> Open
          </span>
          <span className="text-[10px] font-mono text-os-muted/60 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-os-accent" />
            Start with <span className="text-os-accent font-mono">?</span> for AI semantic search
          </span>
        </div>
      </div>
    </Modal>
  )
}

'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { journalApi } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { cn } from '@/lib/utils'
import { BookOpen, Plus, Trash2, Edit2, Calendar } from 'lucide-react'

const MOOD_OPTIONS = [
  { value: 1, label: '😔', desc: 'Rough' },
  { value: 2, label: '😐', desc: 'Okay' },
  { value: 3, label: '🙂', desc: 'Good' },
  { value: 4, label: '😊', desc: 'Great' },
  { value: 5, label: '🔥', desc: 'Amazing' },
]

const MOOD_COLORS: Record<number, string> = {
  1: '#ef4444', 2: '#f97316', 3: '#eab308', 4: '#22c55e', 5: '#64ffda',
}

function formatEntryDate(dateStr: string) {
  const d = new Date(dateStr)
  return {
    day: d.toLocaleDateString('en-US', { weekday: 'short' }),
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    year: d.getFullYear(),
    full: d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
  }
}

function isToday(dateStr: string) {
  const d = new Date(dateStr)
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

export default function JournalPage() {
  const qc = useQueryClient()
  const { showToast } = useAppStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [journalText, setJournalText] = useState('')
  const [mood, setMood] = useState(3)
  const [selectedEntry, setSelectedEntry] = useState<any>(null)

  const { data: entries, isLoading } = useQuery<any[]>({
    queryKey: ['journal', 'list'],
    queryFn: () => journalApi.list(100),
  })

  const { data: todayEntry } = useQuery<any>({
    queryKey: ['journal', 'today'],
    queryFn: () => journalApi.today(),
  })

  const saveEntry = useMutation({
    mutationFn: () => editing?.id
      ? journalApi.update(editing.id, { content: journalText, mood })
      : journalApi.create({ content: journalText, mood }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal'] })
      setModalOpen(false)
      setEditing(null)
      setJournalText('')
      setMood(3)
      showToast(editing ? 'Entry updated ✓' : 'Entry saved ✓')
    },
    onError: () => showToast('Failed to save entry', 'error'),
  })

  const deleteEntry = useMutation({
    mutationFn: (id: string) => journalApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal'] })
      if (selectedEntry) setSelectedEntry(null)
      showToast('Entry deleted')
    },
    onError: () => showToast('Failed to delete entry', 'error'),
  })

  function openNew() {
    setEditing(null)
    setJournalText('')
    setMood(3)
    setModalOpen(true)
  }

  function openEdit(entry: any) {
    setEditing(entry)
    setJournalText(entry.content)
    setMood(entry.mood || 3)
    setModalOpen(true)
  }

  const todayHasEntry = !!todayEntry?.id
  const sortedEntries = [...(entries || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-mono font-bold text-os-text">Journal</h1>
          <p className="text-xs font-mono text-os-muted mt-0.5">
            {sortedEntries.length} {sortedEntries.length === 1 ? 'entry' : 'entries'} total
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-3 h-3" />
          {todayHasEntry ? 'New Entry' : "Write Today's Entry"}
        </Button>
      </div>

      {/* Today prompt if no entry yet */}
      {!todayHasEntry && !isLoading && (
        <button onClick={openNew} className="w-full text-left p-4 rounded-xl border border-dashed border-os-accent/20 bg-os-accent/5 hover:bg-os-accent/10 transition-all group">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-os-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-os-accent/20 transition-all">
              <BookOpen className="w-4 h-4 text-os-accent" />
            </div>
            <div>
              <p className="text-sm font-mono text-os-text">No entry for today yet</p>
              <p className="text-xs font-mono text-os-muted mt-0.5">Tap to reflect on your day →</p>
            </div>
          </div>
        </button>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-xl bg-white/[0.03] border border-os-border animate-pulse" />
          ))}
        </div>
      )}

      {/* Two-panel layout on desktop, stack on mobile */}
      {!isLoading && sortedEntries.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">

          {/* Entry list */}
          <div className="space-y-2">
            {sortedEntries.map(entry => {
              const fmt = formatEntryDate(entry.date)
              const active = selectedEntry?.id === entry.id
              const moodMeta = MOOD_OPTIONS.find(m => m.value === entry.mood)
              return (
                <button key={entry.id} onClick={() => setSelectedEntry(entry)}
                  className={cn(
                    'w-full text-left p-3 rounded-xl border transition-all',
                    active
                      ? 'bg-os-accent/10 border-os-accent/30'
                      : 'bg-white/[0.02] border-os-border hover:border-os-accent/20 hover:bg-white/[0.04]'
                  )}>
                  <div className="flex items-start gap-3">
                    {/* Date block */}
                    <div className={cn(
                      'flex-shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center text-center',
                      active ? 'bg-os-accent/20' : 'bg-white/[0.04]'
                    )}>
                      <span className="text-[8px] font-mono uppercase tracking-widest text-os-muted">{fmt.day}</span>
                      <span className={cn('text-sm font-mono font-bold leading-none', active ? 'text-os-accent' : 'text-os-text')}>
                        {new Date(entry.date).getDate()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-mono text-os-muted">{fmt.date}</span>
                        {isToday(entry.date) && (
                          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-os-accent/15 text-os-accent">Today</span>
                        )}
                        {moodMeta && (
                          <span className="ml-auto text-sm">{moodMeta.label}</span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-os-text/80 line-clamp-2 leading-relaxed">
                        {entry.content}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Entry detail */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            {selectedEntry ? (
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-[10px] font-mono text-os-muted mb-0.5">
                      {formatEntryDate(selectedEntry.date).full}
                    </p>
                    {selectedEntry.mood && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-lg">{MOOD_OPTIONS.find(m => m.value === selectedEntry.mood)?.label}</span>
                        <span className="text-[10px] font-mono" style={{ color: MOOD_COLORS[selectedEntry.mood] }}>
                          {MOOD_OPTIONS.find(m => m.value === selectedEntry.mood)?.desc}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(selectedEntry)}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-os-border text-os-muted hover:text-os-accent hover:border-os-accent/30 transition-all text-[10px] font-mono">
                      <Edit2 className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => deleteEntry.mutate(selectedEntry.id)}
                      className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-os-border text-os-muted hover:text-os-danger hover:border-os-danger/30 transition-all text-[10px] font-mono">
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm font-mono text-os-text leading-relaxed whitespace-pre-wrap">
                    {selectedEntry.content}
                  </p>
                </div>
              </Card>
            ) : (
              <div className="h-48 rounded-xl border border-dashed border-os-border flex flex-col items-center justify-center gap-2 text-os-muted">
                <Calendar className="w-8 h-8 opacity-20" />
                <p className="text-xs font-mono opacity-40">Select an entry to read it</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!isLoading && sortedEntries.length === 0 && todayHasEntry && (
        <Card className="text-center py-14">
          <BookOpen className="w-10 h-10 text-os-accent/20 mx-auto mb-4" />
          <p className="text-xs font-mono text-os-muted mb-4">No journal entries yet.</p>
          <Button onClick={openNew}><Plus className="w-3 h-3" /> Write First Entry</Button>
        </Card>
      )}

      {/* Write / Edit Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null) }}
        title={editing ? 'Edit Entry' : "Today's Journal"} size="lg">
        <div className="space-y-5">
          {/* Mood */}
          <div>
            <p className="text-[10px] font-mono text-os-muted uppercase tracking-widest mb-2">How are you feeling?</p>
            <div className="flex gap-2">
              {MOOD_OPTIONS.map(m => (
                <button key={m.value} onClick={() => setMood(m.value)}
                  className={cn(
                    'flex-1 flex flex-col items-center py-2.5 rounded-xl border transition-all',
                    mood === m.value
                      ? 'border-current bg-current/10'
                      : 'border-os-border hover:border-os-border/80'
                  )}
                  style={mood === m.value ? { color: MOOD_COLORS[m.value] } : {}}>
                  <span className="text-xl">{m.label}</span>
                  <span className="text-[9px] font-mono text-os-muted mt-1">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <p className="text-[10px] font-mono text-os-muted uppercase tracking-widest mb-2">What's on your mind?</p>
            <textarea
              value={journalText}
              onChange={e => setJournalText(e.target.value)}
              placeholder="Reflect on your day — what went well, what was challenging, what are you grateful for..."
              rows={8}
              autoFocus
              className="w-full os-input resize-none text-sm font-mono leading-relaxed"
            />
            <p className="text-[9px] font-mono text-os-muted/50 mt-1 text-right">
              {journalText.length} chars · {journalText.trim().split(/\s+/).filter(Boolean).length} words
            </p>
          </div>

          <div className="flex gap-3">
            <Button className="flex-1" loading={saveEntry.isPending}
              disabled={!journalText.trim()} onClick={() => saveEntry.mutate()}>
              {editing ? 'Update Entry' : 'Save Entry'}
            </Button>
            <Button variant="ghost" onClick={() => { setModalOpen(false); setEditing(null) }}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

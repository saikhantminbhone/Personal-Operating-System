'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { RichEditor } from '@/components/modules/editor/RichEditor'
import { useAppStore } from '@/store/useAppStore'
import { timeAgo, formatDate } from '@/lib/utils'
import { BookOpen, Plus, Search, FileText, Pin, Trash2, X, FolderPlus, Calendar, ArrowLeft, Sparkles } from 'lucide-react'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { useAiCategorizeNote, useAiRecordFeedback } from '@/hooks/useAi'

const NOTE_TYPES = [
  { value: 'NOTE',          label: '📝 Note' },
  { value: 'DAILY',         label: '📅 Daily' },
  { value: 'MEETING',       label: '🤝 Meeting' },
  { value: 'BOOK_REVIEW',   label: '📚 Book Review' },
  { value: 'PROJECT_RETRO', label: '🔍 Retro' },
]
const TYPE_ICONS: Record<string, string> = {
  NOTE: '📝', DAILY: '📅', MEETING: '🤝', BOOK_REVIEW: '📚', PROJECT_RETRO: '🔍',
}
const COLORS = ['#64ffda','#22c55e','#00b4d8','#a78bfa','#f59e0b','#ef4444','#f97316']

export default function KnowledgePage() {
  const qc = useQueryClient()
  const { showToast } = useAppStore()
  const [search, setSearch] = useState('')
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null)
  const [createNoteOpen, setCreateNoteOpen] = useState(false)
  const [createColOpen, setCreateColOpen] = useState(false)
  const [activeNote, setActiveNote] = useState<any>(null)
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingContent, setEditingContent] = useState('')
  const [noteForm, setNoteForm] = useState({ title: '', type: 'NOTE', tags: '', collectionId: '' })
  const [colForm, setColForm] = useState({ name: '', color: '#64ffda', icon: '📁' })
  const { confirm, dialog: confirmDialog } = useConfirm()
  const categorizeNote = useAiCategorizeNote()
  const recordFeedback = useAiRecordFeedback()
  const [noteSuggestion, setNoteSuggestion] = useState<{ collectionId: string | null; tags: string[] } | null>(null)

  async function handleNoteTitleBlur() {
    if (!noteForm.title.trim()) return
    const result = await categorizeNote.mutateAsync({ title: noteForm.title, content: '' }).catch(() => null) as any
    if (result && (result.collectionId || result.tags?.length)) {
      setNoteSuggestion({ collectionId: result.collectionId, tags: result.tags || [] })
    }
  }

  function handleNoteFeedback(accepted: boolean) {
    if (!noteSuggestion) return
    const suggestion = noteSuggestion.tags.join(', ') || noteSuggestion.collectionId || ''
    recordFeedback.mutate({ feature: 'note_categorization', input: noteForm.title, suggestion, accepted })
    if (accepted) {
      setNoteForm(f => ({
        ...f,
        collectionId: noteSuggestion.collectionId || f.collectionId,
        tags: noteSuggestion.tags.join(', ') || f.tags,
      }))
    }
    setNoteSuggestion(null)
  }

  const { data: notesData, isError: notesError } = useQuery<any>({
    queryKey: ['knowledge', 'notes', selectedCollection, search],
    queryFn: () => api.get('/knowledge/notes', {
      params: {
        ...(selectedCollection ? { collectionId: selectedCollection } : {}),
        ...(search ? { search } : {}),
      },
    }),
    retry: 1,
  })
  const { data: collections } = useQuery<any[]>({
    queryKey: ['knowledge', 'collections'],
    queryFn: () => api.get('/knowledge/collections'),
  })
  const { data: stats } = useQuery<any>({
    queryKey: ['knowledge', 'stats'],
    queryFn: () => api.get('/knowledge/notes/stats'),
  })

  const createNote = useMutation({
    mutationFn: (data: any) => api.post('/knowledge/notes', data),
    onSuccess: (note: any) => {
      qc.invalidateQueries({ queryKey: ['knowledge'] })
      setCreateNoteOpen(false)
      setNoteForm({ title: '', type: 'NOTE', tags: '', collectionId: '' })
      openNote(note)
      showToast('Note created 📝')
    },
    onError: (err: any) => showToast(err.message || 'Failed to create note', 'error'),
  })

  const updateNote = useMutation({
    mutationFn: ({ id, data }: any) => api.patch(`/knowledge/notes/${id}`, data),
    onSuccess: (updated: any) => {
      qc.invalidateQueries({ queryKey: ['knowledge'] })
      setActiveNote(updated)
      setIsEditing(false)
      showToast('Saved ✓')
    },
    onError: (err: any) => showToast(err.message || 'Failed to save', 'error'),
  })

  const deleteNote = useMutation({
    mutationFn: (id: string) => api.delete(`/knowledge/notes/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['knowledge'] })
      setActiveNote(null)
      setMobileEditorOpen(false)
      showToast('Note deleted')
    },
  })

  const pinNote = useMutation({
    mutationFn: ({ id, pinned }: any) => api.patch(`/knowledge/notes/${id}`, { pinned }),
    onSuccess: (updated: any) => { qc.invalidateQueries({ queryKey: ['knowledge'] }); setActiveNote(updated) },
  })

  const createCollection = useMutation({
    mutationFn: (data: any) => api.post('/knowledge/collections', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['knowledge'] }); setCreateColOpen(false); showToast('Collection created') },
    onError: (err: any) => showToast(err.message || 'Failed to create collection', 'error'),
  })

  const getDailyNote = useMutation({
    mutationFn: () => api.get('/knowledge/notes/daily'),
    onSuccess: (note: any) => { openNote(note); setIsEditing(true); setEditingContent(note.content || '') },
    onError: (err: any) => showToast(err.message || 'Failed to load daily note', 'error'),
  })

  const notes: any[] = notesData?.data ?? []

  function openNote(note: any) {
    setActiveNote(note)
    setEditingContent(note.content || '')
    setIsEditing(false)
    setMobileEditorOpen(true)
  }

  function selectCollection(id: string | null) {
    setSelectedCollection(id)
    setSearch('') // clear search when switching collection
  }

  function handleSave() {
    if (!activeNote) return
    updateNote.mutate({ id: activeNote.id, data: { content: editingContent } })
  }

  function handleCreateNote() {
    if (!noteForm.title.trim()) { showToast('Note title is required', 'error'); return }
    createNote.mutate({
      title: noteForm.title,
      type: noteForm.type,
      collectionId: noteForm.collectionId || undefined,
      tags: noteForm.tags ? noteForm.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
    })
  }

  // ── SIDEBAR JSX (plain variable, not a component — avoids React remount issues) ──
  const sidebarJsx = (
    <div className="flex flex-col gap-3">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="text-center p-3 bg-os-surface border border-os-border rounded-lg">
          <div className="text-lg font-mono font-bold text-os-accent">{stats?.totalNotes ?? 0}</div>
          <div className="text-[9px] font-mono text-os-muted">Notes</div>
        </div>
        <div className="text-center p-3 bg-os-surface border border-os-border rounded-lg">
          <div className="text-lg font-mono font-bold text-os-accent">{stats?.totalCollections ?? 0}</div>
          <div className="text-[9px] font-mono text-os-muted">Collections</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-1.5">
        <Button size="sm" className="flex-1" onClick={() => setCreateNoteOpen(true)}>
          <Plus className="w-3 h-3" /> Note
        </Button>
        <Button size="sm" variant="ghost" title="Today's Note" onClick={() => getDailyNote.mutate()}>
          <Calendar className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="ghost" title="New Collection" onClick={() => setCreateColOpen(true)}>
          <FolderPlus className="w-3 h-3" />
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-os-muted pointer-events-none" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search notes..."
          className="os-input pl-8 text-xs w-full"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-os-muted hover:text-os-text">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Collections filter */}
      <div className="space-y-0.5">
        <button
          onClick={() => selectCollection(null)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all ${!selectedCollection ? 'bg-os-accent/10 text-os-accent' : 'text-os-muted hover:text-os-text hover:bg-white/[0.03]'}`}
        >
          <BookOpen className="w-3 h-3" />
          All Notes
          <span className="ml-auto text-[10px]">{stats?.totalNotes ?? 0}</span>
        </button>
        {collections?.map((col: any) => (
          <button
            key={col.id}
            onClick={() => selectCollection(col.id)}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all ${selectedCollection === col.id ? 'bg-os-accent/10 text-os-accent' : 'text-os-muted hover:text-os-text hover:bg-white/[0.03]'}`}
          >
            <span style={{ color: col.color }}>{col.icon}</span>
            <span className="truncate flex-1">{col.name}</span>
            <span className="ml-auto text-[10px]">{col.noteCount}</span>
          </button>
        ))}
      </div>

      {/* Notes list */}
      {notes.length > 0 && <div className="border-t border-os-border" />}
      <div className="space-y-1">
        {notesError ? (
          <div className="text-center py-6">
            <p className="text-[10px] font-mono text-os-danger">Failed to load notes. Check your connection.</p>
            <button onClick={() => qc.invalidateQueries({ queryKey: ['knowledge', 'notes'] })}
              className="text-[10px] font-mono text-os-accent mt-2 hover:underline">
              Retry
            </button>
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-5 h-5 mx-auto mb-2 text-os-muted opacity-30" />
            <p className="text-[10px] font-mono text-os-muted">
              {search ? `No notes matching "${search}"` : selectedCollection ? 'No notes in this collection' : 'No notes yet'}
            </p>
          </div>
        ) : (
          notes.map((note: any) => (
            <button
              key={note.id}
              onClick={() => openNote(note)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                activeNote?.id === note.id
                  ? 'bg-os-accent/10 border-os-accent/20'
                  : 'bg-white/[0.01] border-os-border hover:border-os-accent/15 hover:bg-white/[0.03]'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px]">{TYPE_ICONS[note.type] || '📝'}</span>
                <span className="text-xs font-mono truncate flex-1">{note.title}</span>
                {note.pinned && <Pin className="w-2.5 h-2.5 text-os-accent flex-shrink-0" />}
              </div>
              <div className="text-[9px] font-mono text-os-muted flex items-center gap-2">
                <span>{timeAgo(note.updatedAt)}</span>
                {note.wordCount > 0 && <span>{note.wordCount}w</span>}
                {note.collection && (
                  <span className="truncate" style={{ color: note.collection.color }}>{note.collection.name}</span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )

  // ── EDITOR JSX (plain variable) ──────────────────────────────────────────────
  const editorJsx = activeNote ? (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start gap-2 mb-3 flex-shrink-0">
        {/* Back button — closes editor on mobile, deselects note on desktop */}
        <button
          onClick={() => { setMobileEditorOpen(false); setIsEditing(false); setActiveNote(null) }}
          className="flex items-center gap-1 text-os-muted hover:text-os-text text-xs font-mono transition-colors pt-0.5 flex-shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-mono font-semibold text-os-text truncate">{activeNote.title}</h2>
          <div className="flex items-center gap-2 mt-0.5 text-[10px] font-mono text-os-muted flex-wrap">
            <span>{TYPE_ICONS[activeNote.type]} {activeNote.type}</span>
            <span>{formatDate(activeNote.updatedAt)}</span>
            {activeNote.wordCount > 0 && <span>{activeNote.wordCount}w</span>}
            {activeNote.collection && (
              <span style={{ color: activeNote.collection.color }}>{activeNote.collection.name}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => pinNote.mutate({ id: activeNote.id, pinned: !activeNote.pinned })}
            className={`p-1.5 rounded transition-all ${activeNote.pinned ? 'text-os-accent bg-os-accent/10' : 'text-os-muted hover:text-os-accent'}`}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          {isEditing ? (
            <>
              <Button size="sm" onClick={handleSave} loading={updateNote.isPending}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
            </>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => { setIsEditing(true); setEditingContent(activeNote.content || '') }}>
              Edit
            </Button>
          )}
          <button
            onClick={async () => { const ok = await confirm({ title: 'Delete this note?', description: 'This cannot be undone.' }); if (ok) deleteNote.mutate(activeNote.id) }}
            className="p-1.5 text-os-muted hover:text-os-danger transition-colors rounded"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tags */}
      {activeNote.tags?.length > 0 && (
        <div className="flex gap-1.5 mb-3 flex-wrap flex-shrink-0">
          {activeNote.tags.map((tag: string) => (
            <span key={tag} className="text-[9px] font-mono px-2 py-0.5 rounded bg-os-accent/10 text-os-accent border border-os-accent/20">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      {isEditing ? (
        <div className="flex-1 min-h-0">
          <RichEditor
            value={editingContent}
            onChange={setEditingContent}
            placeholder="Write your note in markdown..."
            minHeight={300}
            className="h-full"
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto os-card">
          {activeNote.content ? (
            <div className="text-sm font-mono text-os-text leading-relaxed whitespace-pre-wrap">
              {activeNote.content}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-os-muted text-xs font-mono mb-3">No content yet</p>
              <Button size="sm" onClick={() => setIsEditing(true)}>Start Writing</Button>
            </div>
          )}
        </div>
      )}
    </div>
  ) : (
    <div className="flex-1 flex flex-col items-center justify-center text-center os-card h-full">
      <BookOpen className="w-12 h-12 text-os-accent/20 mb-4" />
      <p className="text-sm font-mono text-os-muted mb-2">Select a note or create one</p>
      <div className="flex gap-3 mt-4 flex-wrap justify-center">
        <Button onClick={() => setCreateNoteOpen(true)}><Plus className="w-3 h-3" /> New Note</Button>
        <Button variant="ghost" onClick={() => getDailyNote.mutate()}><Calendar className="w-3 h-3" /> Today's Note</Button>
      </div>
    </div>
  )

  return (
    <div className="animate-fade-in">
      {confirmDialog}

      {/* ── DESKTOP: side-by-side ── */}
      <div className="hidden sm:flex gap-5 h-[calc(100vh-8rem)]">
        <div className="w-64 flex-shrink-0 overflow-y-auto">
          {sidebarJsx}
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          {editorJsx}
        </div>
      </div>

      {/* ── MOBILE: list view ── */}
      <div className="sm:hidden">
        {sidebarJsx}
      </div>

      {/* ── MOBILE: full-screen editor overlay ── */}
      {mobileEditorOpen && (
        <div
          className="fixed inset-x-0 bottom-0 z-[9999] bg-os-bg flex flex-col overflow-y-auto p-4"
          style={{ top: 56 }}
        >
          {editorJsx}
        </div>
      )}

      {/* Create Note Modal */}
      <Modal open={createNoteOpen} onClose={() => { setCreateNoteOpen(false); setNoteSuggestion(null) }} title="New Note">
        <div className="space-y-4">
          <Input
            label="Title *"
            placeholder="Note title..."
            value={noteForm.title}
            onChange={e => { setNoteForm(f => ({ ...f, title: e.target.value })); setNoteSuggestion(null) }}
            onBlur={handleNoteTitleBlur}
          />
          {noteSuggestion && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-os-accent/20 bg-os-accent/5 text-[10px] font-mono text-os-accent">
              <Sparkles className="w-3 h-3 flex-shrink-0" />
              <span className="flex-1">AI suggests{noteSuggestion.tags.length ? ` tags: ${noteSuggestion.tags.join(', ')}` : ''}{noteSuggestion.collectionId ? ' · collection match' : ''}</span>
              <button onClick={() => handleNoteFeedback(true)} className="hover:text-os-text transition-colors">apply</button>
              <button onClick={() => handleNoteFeedback(false)} className="text-os-muted hover:text-os-text transition-colors">dismiss</button>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Type" value={noteForm.type} onChange={e => setNoteForm(f => ({ ...f, type: e.target.value }))}>
              {NOTE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
            <Select label="Collection" value={noteForm.collectionId} onChange={e => setNoteForm(f => ({ ...f, collectionId: e.target.value }))}>
              <option value="">None</option>
              {collections?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <Input
            label="Tags (comma separated)"
            placeholder="ideas, research"
            value={noteForm.tags}
            onChange={e => setNoteForm(f => ({ ...f, tags: e.target.value }))}
          />
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" loading={createNote.isPending} onClick={handleCreateNote}>
              Create Note
            </Button>
            <Button variant="ghost" onClick={() => setCreateNoteOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Create Collection Modal */}
      <Modal open={createColOpen} onClose={() => setCreateColOpen(false)} title="New Collection" size="sm">
        <div className="space-y-4">
          <Input
            label="Name"
            placeholder="My Collection"
            value={colForm.name}
            onChange={e => setColForm(f => ({ ...f, name: e.target.value }))}
          />
          <div>
            <label className="block text-[10px] font-mono tracking-widest uppercase text-os-muted mb-2">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColForm(f => ({ ...f, color: c }))}
                  className="w-6 h-6 rounded-full border-2 transition-all"
                  style={{ background: c, borderColor: colForm.color === c ? '#fff' : 'transparent' }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1"
              loading={createCollection.isPending}
              onClick={() => {
                if (!colForm.name.trim()) { showToast('Collection name is required', 'error'); return }
                createCollection.mutate(colForm)
              }}
            >
              Create
            </Button>
            <Button variant="ghost" onClick={() => setCreateColOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

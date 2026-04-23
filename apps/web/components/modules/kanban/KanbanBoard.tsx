'use client'
import { useState, useRef, useCallback } from 'react'
import { PRIORITY_META, ENERGY_META } from '@/lib/utils'
import { Plus, GripVertical, ChevronLeft, ChevronRight } from 'lucide-react'

export interface KanbanTask {
  id: string
  title: string
  priority: string
  energyRequired: number
  dueDate?: string
  tags?: string[]
  goalId?: string
}

export interface KanbanColumn {
  key: string
  label: string
  color: string
  tasks: KanbanTask[]
}

interface KanbanBoardProps {
  columns: KanbanColumn[]
  onTaskMove: (taskId: string, newStatus: string) => Promise<void>
  onAddTask?: (status: string) => void
  loading?: boolean
}

export function KanbanBoard({ columns, onTaskMove, onAddTask, loading }: KanbanBoardProps) {
  const [dragging, setDragging] = useState<{ taskId: string; fromCol: string } | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [mobileCol, setMobileCol] = useState(0)
  const dragRef = useRef<HTMLElement | null>(null)

  const handleDragStart = useCallback((e: React.DragEvent, taskId: string, fromCol: string) => {
    setDragging({ taskId, fromCol })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('taskId', taskId)
    ;(e.currentTarget as HTMLElement).style.opacity = '0.4'
    dragRef.current = e.currentTarget as HTMLElement
  }, [])

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setDragging(null)
    setDragOver(null)
    ;(e.currentTarget as HTMLElement).style.opacity = '1'
    dragRef.current = null
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, colKey: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(colKey)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent, colKey: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData('taskId')
    setDragOver(null)
    if (taskId && dragging?.fromCol !== colKey) {
      await onTaskMove(taskId, colKey)
    }
    setDragging(null)
  }, [dragging, onTaskMove])

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 h-64">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-full bg-white/[0.02] border border-os-border rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  const activeCol = columns[mobileCol]

  return (
    <>
      {/* ── Mobile: single-column view with nav ──────────────────────────────── */}
      <div className="flex flex-col sm:hidden h-full">
        {/* Column tabs */}
        <div className="flex gap-1 mb-3 overflow-x-auto pb-1 flex-shrink-0">
          {columns.map((col, i) => (
            <button
              key={col.key}
              onClick={() => setMobileCol(i)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider uppercase transition-all ${
                mobileCol === i
                  ? 'bg-white/[0.08] border border-current'
                  : 'text-os-muted border border-transparent hover:border-os-border'
              }`}
              style={{ color: mobileCol === i ? col.color : undefined }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: col.color }} />
              {col.label}
              <span className="ml-1 px-1 rounded bg-white/10 text-[9px]">{col.tasks.length}</span>
            </button>
          ))}
        </div>

        {/* Active column */}
        <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-os-border bg-white/[0.01]"
          style={{ borderColor: dragOver === activeCol.key ? `${activeCol.color}40` : undefined }}
          onDragOver={(e) => handleDragOver(e, activeCol.key)}
          onDrop={(e) => handleDrop(e, activeCol.key)}
          onDragLeave={() => setDragOver(null)}
        >
          {/* Column header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-os-border flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ background: activeCol.color }} />
              <span className="text-[11px] font-mono tracking-widest uppercase font-medium" style={{ color: activeCol.color }}>
                {activeCol.label}
              </span>
              <span className="text-[10px] font-mono text-os-muted bg-white/5 px-1.5 py-0.5 rounded">
                {activeCol.tasks.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {onAddTask && (
                <button onClick={() => onAddTask(activeCol.key)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg border border-os-border text-os-muted hover:text-os-accent hover:border-os-accent/30 transition-all text-[10px] font-mono">
                  <Plus className="w-3 h-3" /> Add
                </button>
              )}
              <button onClick={() => setMobileCol(i => Math.max(0, i - 1))} disabled={mobileCol === 0}
                className="p-1 text-os-muted hover:text-os-text transition-colors disabled:opacity-30">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setMobileCol(i => Math.min(columns.length - 1, i + 1))} disabled={mobileCol === columns.length - 1}
                className="p-1 text-os-muted hover:text-os-text transition-colors disabled:opacity-30">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tasks */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {activeCol.tasks.length === 0 ? (
              <div className="h-24 border-2 border-dashed border-os-border rounded-xl flex flex-col items-center justify-center gap-2 opacity-50">
                <span className="text-[10px] font-mono text-os-muted">No tasks here</span>
                {onAddTask && (
                  <button onClick={() => onAddTask(activeCol.key)}
                    className="text-[10px] font-mono text-os-accent hover:underline">
                    + Add one
                  </button>
                )}
              </div>
            ) : activeCol.tasks.map(task => (
              <KanbanTaskCard
                key={task.id}
                task={task}
                colColor={activeCol.color}
                onDragStart={(e) => handleDragStart(e, task.id, activeCol.key)}
                onDragEnd={handleDragEnd}
                isDragging={dragging?.taskId === task.id}
                onMoveTo={columns
                  .filter(c => c.key !== activeCol.key)
                  .map(c => ({ key: c.key, label: c.label, color: c.color }))}
                onMove={async (colKey) => {
                  await onTaskMove(task.id, colKey)
                  setMobileCol(columns.findIndex(c => c.key === colKey))
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Desktop: 4-column grid ────────────────────────────────────────────── */}
      <div className="hidden sm:grid sm:grid-cols-4 gap-4 h-full">
        {columns.map(col => (
          <div key={col.key}
            onDragOver={(e) => handleDragOver(e, col.key)}
            onDrop={(e) => handleDrop(e, col.key)}
            onDragLeave={() => setDragOver(null)}
            className={`flex flex-col rounded-xl border transition-colors ${
              dragOver === col.key ? 'bg-white/[0.03]' : 'border-os-border bg-white/[0.01]'
            }`}
            style={{ borderColor: dragOver === col.key ? `${col.color}40` : undefined }}>

            {/* Column header */}
            <div className="flex items-center justify-between px-3 py-3 border-b border-os-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: col.color }}>
                  {col.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono text-os-muted bg-white/5 px-1.5 py-0.5 rounded">
                  {col.tasks.length}
                </span>
                {onAddTask && (
                  <button onClick={() => onAddTask(col.key)}
                    className="text-os-muted hover:text-os-accent transition-colors p-0.5">
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Tasks */}
            <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
              {col.tasks.map(task => (
                <KanbanTaskCard
                  key={task.id}
                  task={task}
                  colColor={col.color}
                  onDragStart={(e) => handleDragStart(e, task.id, col.key)}
                  onDragEnd={handleDragEnd}
                  isDragging={dragging?.taskId === task.id}
                />
              ))}

              {col.tasks.length === 0 && (
                <div className={`h-16 border-2 border-dashed rounded-lg flex items-center justify-center transition-all ${
                  dragOver === col.key ? 'opacity-100' : 'opacity-30'
                }`} style={{ borderColor: dragOver === col.key ? col.color : undefined }}>
                  <span className="text-[10px] font-mono text-os-muted">
                    {dragOver === col.key ? 'Drop here' : 'Empty'}
                  </span>
                </div>
              )}

              {dragOver === col.key && col.tasks.length > 0 && (
                <div className="h-1 rounded-full" style={{ background: col.color }} />
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function KanbanTaskCard({
  task, colColor, onDragStart, onDragEnd, isDragging, onMoveTo, onMove,
}: {
  task: KanbanTask
  colColor: string
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: (e: React.DragEvent) => void
  isDragging: boolean
  onMoveTo?: { key: string; label: string; color: string }[]
  onMove?: (colKey: string) => void
}) {
  const priorityMeta = PRIORITY_META[task.priority] || PRIORITY_META.MEDIUM
  const energyMeta = ENERGY_META[task.energyRequired] || ENERGY_META[2]

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group p-3 bg-os-surface border border-os-border rounded-xl cursor-grab active:cursor-grabbing
        hover:border-os-accent/20 transition-all select-none
        ${isDragging ? 'opacity-30 scale-95' : 'opacity-100'}`}
    >
      {/* Title row */}
      <div className="flex items-start gap-2 mb-2.5">
        <GripVertical className="w-3.5 h-3.5 text-os-muted/30 group-hover:text-os-muted transition-colors flex-shrink-0 mt-0.5" />
        <p className="text-xs font-mono text-os-text leading-snug flex-1 line-clamp-2">{task.title}</p>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: priorityMeta.color }}
          title={`${task.priority} priority`} />
        <span className="text-[10px] font-mono" style={{ color: energyMeta.color }}>{energyMeta.icon}</span>
        {task.dueDate && (
          <span className="text-[9px] font-mono text-os-muted ml-auto">
            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex gap-1 mt-2 flex-wrap">
          {task.tags.slice(0, 3).map(tag => (
            <span key={tag} className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-os-accent/10 text-os-accent">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Mobile-only: move to other column buttons */}
      {onMoveTo && onMove && onMoveTo.length > 0 && (
        <div className="flex gap-1.5 mt-2.5 pt-2.5 border-t border-os-border flex-wrap">
          {onMoveTo.map(col => (
            <button
              key={col.key}
              onClick={() => onMove(col.key)}
              className="flex-1 min-w-0 text-[9px] font-mono px-2 py-1 rounded-lg border transition-all text-center"
              style={{ borderColor: `${col.color}40`, color: col.color, background: `${col.color}08` }}
            >
              → {col.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

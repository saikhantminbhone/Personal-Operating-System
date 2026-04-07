'use client'
import { useState, useRef, useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { PRIORITY_META, ENERGY_META } from '@/lib/utils'
import { Plus, GripVertical } from 'lucide-react'

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
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => (
          <div key={i} className="h-64 bg-white/[0.02] border border-os-border rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-4 gap-4 h-full">
      {columns.map(col => (
        <div key={col.key}
          onDragOver={(e) => handleDragOver(e, col.key)}
          onDrop={(e) => handleDrop(e, col.key)}
          onDragLeave={() => setDragOver(null)}
          className={`flex flex-col rounded-xl border transition-all ${
            dragOver === col.key
              ? 'border-current bg-current/5'
              : 'border-os-border bg-white/[0.01]'
          }`}
          style={{ borderColor: dragOver === col.key ? col.color : undefined }}>

          {/* Column header */}
          <div className="flex items-center justify-between px-3 py-3 border-b border-os-border">
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
                  className="text-os-muted hover:text-os-accent transition-colors">
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

            {/* Drop zone when empty or dragging */}
            {col.tasks.length === 0 && (
              <div className={`h-16 border-2 border-dashed rounded-lg flex items-center justify-center transition-all ${
                dragOver === col.key ? 'border-current opacity-100' : 'border-os-border opacity-40'
              }`} style={{ borderColor: dragOver === col.key ? col.color : undefined }}>
                <span className="text-[10px] font-mono text-os-muted">
                  {dragOver === col.key ? 'Drop here' : 'Empty'}
                </span>
              </div>
            )}

            {/* Active drop indicator */}
            {dragOver === col.key && col.tasks.length > 0 && (
              <div className="h-1 rounded-full transition-all" style={{ background: col.color }} />
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function KanbanTaskCard({
  task, colColor, onDragStart, onDragEnd, isDragging
}: {
  task: KanbanTask
  colColor: string
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: (e: React.DragEvent) => void
  isDragging: boolean
}) {
  const priorityMeta = PRIORITY_META[task.priority] || PRIORITY_META.MEDIUM
  const energyMeta = ENERGY_META[task.energyRequired] || ENERGY_META[2]

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group p-3 bg-os-surface border border-os-border rounded-lg cursor-grab active:cursor-grabbing
        hover:border-os-accent/20 hover:shadow-md transition-all select-none
        ${isDragging ? 'opacity-30 scale-95' : 'opacity-100 scale-100'}`}>

      {/* Drag handle + priority */}
      <div className="flex items-center gap-1.5 mb-2">
        <GripVertical className="w-3 h-3 text-os-muted/30 group-hover:text-os-muted transition-colors flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-os-text leading-snug line-clamp-2">{task.title}</p>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: priorityMeta.color }}
          title={`${task.priority} priority`} />
        <span className="text-[9px] font-mono" style={{ color: energyMeta.color }}>{energyMeta.icon}</span>

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
    </div>
  )
}

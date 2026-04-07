'use client'
import { useState } from 'react'
import { useTasks, useCreateTask, useCompleteTask, useDeleteTask, useUpdateTask } from '@/hooks/useTasks'
import { useGoals } from '@/hooks/useGoals'
import { useAppStore } from '@/store/useAppStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge'
import { ENERGY_META, PRIORITY_META, formatDate } from '@/lib/utils'
import { TaskStatus, TaskPriority } from '@/types'
import { Plus, Trash2, CheckCircle, Circle, Filter } from 'lucide-react'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import { useAiSuggestGoal, useAiRecordFeedback } from '@/hooks/useAi'
import { Sparkles } from 'lucide-react'

export default function TasksPage() {
  const [filter, setFilter] = useState<string>('active')
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ title: '', goalId: '', priority: 'MEDIUM', energyRequired: 2, estimatedMinutes: '', dueDate: '', tags: '' })

  const params = filter === 'active' ? { status: undefined } : filter === 'done' ? { status: 'DONE' } : {}
  const { data: taskData, isLoading } = useTasks(filter === 'active' ? { status: 'TODO' } : filter === 'in_progress' ? { status: 'IN_PROGRESS' } : filter === 'done' ? { status: 'DONE' } : {})
  const { data: goals } = useGoals()
  const createTask = useCreateTask()
  const completeTask = useCompleteTask()
  const deleteTask = useDeleteTask()
  const { showToast } = useAppStore()
  const { confirm, dialog: confirmDialog } = useConfirm()
  const suggestGoal = useAiSuggestGoal()
  const recordFeedback = useAiRecordFeedback()
  const [goalSuggestion, setGoalSuggestion] = useState<{ goalId: string; goalTitle: string } | null>(null)

  async function handleTitleBlur() {
    if (!form.title.trim() || form.goalId) return
    const result = await suggestGoal.mutateAsync(form.title).catch(() => null) as any
    if (result?.goalId && result?.confidence > 0.65) {
      setGoalSuggestion({ goalId: result.goalId, goalTitle: result.goalTitle })
    }
  }

  function handleGoalFeedback(accepted: boolean) {
    if (!goalSuggestion) return
    recordFeedback.mutate({ feature: 'goal_suggestion', input: form.title, suggestion: goalSuggestion.goalTitle, accepted })
    if (accepted) setForm(f => ({ ...f, goalId: goalSuggestion.goalId }))
    setGoalSuggestion(null)
  }

  const tasks = taskData?.data || []
  const pending = tasks.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS')
  const done = tasks.filter(t => t.status === 'DONE')

  async function handleCreate() {
    if (!form.title.trim()) { showToast('Task title is required', 'error'); return }
    try {
      await createTask.mutateAsync({
        title: form.title,
        goalId: form.goalId || undefined,
        priority: form.priority as TaskPriority,
        energyRequired: Number(form.energyRequired),
        estimatedMinutes: form.estimatedMinutes ? Number(form.estimatedMinutes) : undefined,
        dueDate: form.dueDate || undefined,
        tags: form.tags ? form.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      })
      setCreateOpen(false)
      setForm({ title: '', goalId: '', priority: 'MEDIUM', energyRequired: 2, estimatedMinutes: '', dueDate: '', tags: '' })
      showToast('Task added ✓')
    } catch (err: any) {
      showToast(err.message || 'Failed to create task', 'error')
    }
  }

  async function handleComplete(id: string) {
    await completeTask.mutateAsync(id)
    showToast('Task done! ✓')
  }

  async function handleDelete(id: string) {
    const ok = await confirm({ title: 'Delete this task?', description: 'This cannot be undone.' })
    if (!ok) return
    await deleteTask.mutateAsync(id)
    showToast('Task deleted')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {confirmDialog}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {[
            { key: 'active', label: 'Pending' },
            { key: 'in_progress', label: 'In Progress' },
            { key: 'done', label: 'Done' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`text-[10px] font-mono px-3 py-1.5 rounded border tracking-widest uppercase transition-all ${
                filter === f.key ? 'bg-os-accent/15 text-os-accent border-os-accent/20' : 'text-os-muted border-os-border hover:border-os-accent/20'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="w-3 h-3" /> New Task</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pending', value: taskData?.total ?? 0, color: '#f59e0b' },
          { label: 'Done Today', value: done.filter(t => t.completedAt && new Date(t.completedAt).toDateString() === new Date().toDateString()).length, color: '#22c55e' },
          { label: 'Total', value: taskData?.total ?? 0, color: '#64ffda' },
        ].map(s => (
          <Card key={s.label} className="text-center p-4">
            <div className="text-xl font-mono font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] font-mono tracking-widest uppercase text-os-muted mt-1">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {isLoading && <div className="text-xs font-mono text-os-muted animate-pulse">Loading tasks...</div>}
        {tasks.map(task => (
          <div key={task.id} className={`flex items-center gap-3 p-4 rounded-lg border transition-all group ${
            task.status === 'DONE' ? 'bg-white/[0.01] border-os-border opacity-40' : 'bg-white/[0.03] border-os-border hover:border-os-accent/20'
          }`}>
            <button onClick={() => task.status !== 'DONE' && handleComplete(task.id)}
              className="flex-shrink-0 text-os-muted hover:text-os-success transition-colors">
              {task.status === 'DONE' ? <CheckCircle className="w-4 h-4 text-os-success" /> : <Circle className="w-4 h-4" />}
            </button>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-mono ${task.status === 'DONE' ? 'line-through text-os-muted' : 'text-os-text'}`}>
                {task.title}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {task.goal && <span className="text-[10px] font-mono text-os-muted">↳ {task.goal.title}</span>}
                {task.dueDate && <span className="text-[10px] font-mono text-os-muted">Due {formatDate(task.dueDate)}</span>}
                {task.estimatedMinutes && <span className="text-[10px] font-mono text-os-muted">{task.estimatedMinutes}min</span>}
                {task.tags?.map(tag => (
                  <span key={tag} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-os-accent/10 text-os-accent">{tag}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <PriorityBadge priority={task.priority} />
              <span className="text-xs" title={`Energy: ${ENERGY_META[task.energyRequired]?.label}`}>
                {ENERGY_META[task.energyRequired]?.icon}
              </span>
              <button onClick={() => handleDelete(task.id)}
                className="text-os-muted hover:text-os-danger transition-colors sm:opacity-0 sm:group-hover:opacity-100">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        {tasks.length === 0 && !isLoading && (
          <Card className="text-center py-10">
            <p className="text-xs font-mono text-os-muted mb-4">No tasks here. Add some!</p>
            <Button onClick={() => setCreateOpen(true)}><Plus className="w-3 h-3" /> Add Task</Button>
          </Card>
        )}
      </div>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Task">
        <div className="space-y-4">
          <Input label="Task" placeholder="What needs to be done?" value={form.title}
            onChange={e => { setForm(f => ({ ...f, title: e.target.value })); setGoalSuggestion(null) }}
            onBlur={handleTitleBlur} />
          {goalSuggestion && !form.goalId && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-os-accent/20 bg-os-accent/5 text-[10px] font-mono text-os-accent">
              <Sparkles className="w-3 h-3 flex-shrink-0" />
              <span className="flex-1">AI suggests: <strong>{goalSuggestion.goalTitle}</strong></span>
              <button onClick={() => handleGoalFeedback(true)} className="hover:text-os-text transition-colors">apply</button>
              <button onClick={() => handleGoalFeedback(false)} className="text-os-muted hover:text-os-text transition-colors">dismiss</button>
            </div>
          )}
          <Select label="Link to Goal (optional)" value={form.goalId}
            onChange={e => { setForm(f => ({ ...f, goalId: e.target.value })); setGoalSuggestion(null) }}>
            <option value="">— No linked goal —</option>
            {goals?.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
          </Select>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Priority" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              {Object.keys(PRIORITY_META).map(p => <option key={p} value={p}>{p}</option>)}
            </Select>
            <Select label="Energy Needed" value={String(form.energyRequired)}
              onChange={e => setForm(f => ({ ...f, energyRequired: Number(e.target.value) }))}>
              {ENERGY_META.map((e, i) => <option key={i} value={i}>{e.icon} {e.label}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Est. Minutes" type="number" placeholder="30" value={form.estimatedMinutes}
              onChange={e => setForm(f => ({ ...f, estimatedMinutes: e.target.value }))} />
            <Input label="Due Date" type="date" value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} />
          </div>
          <Input label="Tags (comma separated)" placeholder="work, dev, urgent" value={form.tags}
            onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleCreate} loading={createTask.isPending} className="flex-1">Add Task</Button>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

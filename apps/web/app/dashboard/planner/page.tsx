'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, winsApi } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import { useCreateTask } from '@/hooks/useTasks'
import { useGoals } from '@/hooks/useGoals'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { cn, PILLAR_META, ENERGY_META, PRIORITY_META } from '@/lib/utils'
import {
  CheckCircle, Circle, Flame, Trophy, Plus, ChevronLeft,
  ChevronRight, AlertTriangle, BookOpen, CalendarDays, Target
} from 'lucide-react'

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAYS_FULL  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function getWeekDays(offset = 0) {
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - today.getDay() + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

function relativeLabel(day: Date, today: Date) {
  if (isSameDay(day, today)) return 'Today'
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
  if (isSameDay(day, tomorrow)) return 'Tomorrow'
  if (isSameDay(day, yesterday)) return 'Yesterday'
  return null
}

export default function PlannerPage() {
  const qc = useQueryClient()
  const { showToast } = useAppStore()
  const today = new Date()

  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [winOpen, setWinOpen] = useState(false)
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [winForm, setWinForm] = useState({ title: '', details: '', pillar: '' })
  const [taskForm, setTaskForm] = useState({ title: '', goalId: '', priority: 'MEDIUM', energyRequired: 2 })

  const weekDays = getWeekDays(weekOffset)
  const createTask = useCreateTask()
  const { data: goals } = useGoals({ status: 'ACTIVE' })

  const { data: tasks } = useQuery<any>({
    queryKey: ['tasks', 'planner'],
    queryFn: () => api.get('/tasks', { params: { limit: 200 } }),
    staleTime: 1000 * 30,
  })

  const { data: habitsToday } = useQuery<any>({
    queryKey: ['habits', 'today'],
    queryFn: () => api.get('/habits/today'),
  })

  const { data: wins } = useQuery<any[]>({
    queryKey: ['wins'],
    queryFn: () => winsApi.list(5),
  })

  const completeTask = useMutation({
    mutationFn: (id: string) => api.patch(`/tasks/${id}/complete`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', 'planner'] })
      showToast('Done! ✓')
    },
  })

  const logWin = useMutation({
    mutationFn: () => winsApi.create(winForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wins'] })
      setWinOpen(false)
      setWinForm({ title: '', details: '', pillar: '' })
      showToast('Win logged! 🏆')
    },
    onError: () => showToast('Failed to log win', 'error'),
  })

  const allTasks: any[] = tasks?.data || []
  const selectedDayISO = selectedDay.toISOString().slice(0, 10)

  const dayTasks = (day: Date) =>
    allTasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), day))

  const selectedTasks = dayTasks(selectedDay)
  const doneTasks     = selectedTasks.filter(t => t.status === 'DONE')
  const pendingTasks  = selectedTasks.filter(t => t.status !== 'DONE' && t.status !== 'CANCELLED')

  const overdueTasks = allTasks.filter(t => {
    if (!t.dueDate || t.status === 'DONE' || t.status === 'CANCELLED') return false
    return new Date(t.dueDate) < today && !isSameDay(new Date(t.dueDate), today)
  })

  const isViewingToday = isSameDay(selectedDay, today)
  const label = relativeLabel(selectedDay, today)

  async function handleAddTask() {
    if (!taskForm.title.trim()) return
    try {
      await createTask.mutateAsync({
        title: taskForm.title,
        goalId: taskForm.goalId || undefined,
        priority: taskForm.priority as any,
        energyRequired: taskForm.energyRequired,
        dueDate: selectedDayISO,
      })
      qc.invalidateQueries({ queryKey: ['tasks', 'planner'] })
      setAddTaskOpen(false)
      setTaskForm({ title: '', goalId: '', priority: 'MEDIUM', energyRequired: 2 })
      showToast('Task added ✓')
    } catch (err: any) {
      showToast(err.message || 'Failed to add task', 'error')
    }
  }

  const habitsCompletionPct = habitsToday?.dueToday > 0
    ? Math.round((habitsToday.completedToday / habitsToday.dueToday) * 100)
    : 0

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-mono font-bold text-os-text">Planner</h1>
          <p className="text-xs font-mono text-os-muted mt-0.5">
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isSameDay(selectedDay, today) && (
            <button onClick={() => { setSelectedDay(new Date()); setWeekOffset(0) }}
              className="text-[10px] font-mono px-3 py-1.5 rounded-lg border border-os-accent/30 text-os-accent hover:bg-os-accent/10 transition-all">
              Jump to Today
            </button>
          )}
          <a href="/dashboard/journal"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-os-border text-xs font-mono text-os-muted hover:text-os-accent hover:border-os-accent/30 transition-all">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Journal</span>
          </a>
          <button onClick={() => setWinOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-os-accent/30 bg-os-accent/5 text-xs font-mono text-os-accent hover:bg-os-accent/10 transition-all">
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Win</span>
          </button>
        </div>
      </div>

      {/* ── Overdue banner ──────────────────────────────────────────────── */}
      {overdueTasks.length > 0 && (
        <div className="flex items-start gap-3 p-3 rounded-xl border border-red-500/20 bg-red-500/5">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-mono text-red-400 font-semibold tracking-widest uppercase mb-1.5">
              {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}
            </p>
            <div className="space-y-1">
              {overdueTasks.slice(0, 3).map(t => (
                <div key={t.id} className="flex items-center gap-2">
                  <button onClick={() => completeTask.mutate(t.id)}
                    className="text-os-muted hover:text-os-success transition-colors flex-shrink-0 touch-manipulation">
                    <Circle className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-mono text-os-text flex-1 truncate">{t.title}</span>
                  <span className="text-[9px] font-mono text-red-400 flex-shrink-0">
                    {new Date(t.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              ))}
              {overdueTasks.length > 3 && (
                <p className="text-[9px] font-mono text-os-muted">+{overdueTasks.length - 3} more — go to Tasks to see all</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Week strip ──────────────────────────────────────────────────── */}
      <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden">
        {/* Navigation row */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-os-border">
          <button onClick={() => setWeekOffset(o => o - 1)}
            className="p-1.5 rounded-lg text-os-muted hover:text-os-text hover:bg-white/[0.04] transition-all">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="flex-1 text-center text-[10px] font-mono text-os-muted">
            {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            {' — '}
            {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <button onClick={() => setWeekOffset(o => o + 1)}
            className="p-1.5 rounded-lg text-os-muted hover:text-os-text hover:bg-white/[0.04] transition-all">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day buttons */}
        <div className="grid grid-cols-7">
          {weekDays.map((day, i) => {
            const dt = dayTasks(day)
            const done = dt.filter(t => t.status === 'DONE').length
            const pending = dt.filter(t => t.status !== 'DONE').length
            const isToday = isSameDay(day, today)
            const isSel = isSameDay(day, selectedDay)
            return (
              <button key={i} onClick={() => setSelectedDay(day)}
                className={cn(
                  'flex flex-col items-center py-3 transition-all relative',
                  isSel ? 'bg-os-accent/10' : 'hover:bg-white/[0.03]',
                  i < 6 && 'border-r border-os-border'
                )}>
                <span className={cn('text-[9px] font-mono uppercase tracking-widest',
                  isSel ? 'text-os-accent' : 'text-os-muted')}>
                  {DAYS_SHORT[day.getDay()]}
                </span>
                <span className={cn(
                  'text-sm font-mono font-bold mt-1 w-8 h-8 flex items-center justify-center rounded-full transition-all',
                  isToday ? 'bg-os-accent text-os-bg' : isSel ? 'text-os-accent' : 'text-os-text'
                )}>
                  {day.getDate()}
                </span>
                {/* Task dots */}
                <div className="flex gap-0.5 mt-1.5 h-1.5">
                  {pending > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-os-accent/60" title={`${pending} pending`} />
                  )}
                  {done > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-os-success" title={`${done} done`} />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Main content ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">

        {/* Left: selected day tasks */}
        <div className="space-y-3">
          {/* Day header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-os-muted" />
              <span className="text-sm font-mono font-semibold text-os-text">
                {DAYS_FULL[selectedDay.getDay()]}, {selectedDay.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </span>
              {label && (
                <span className={cn(
                  'text-[9px] font-mono px-2 py-0.5 rounded-full',
                  label === 'Today' ? 'bg-os-accent/15 text-os-accent' : 'bg-white/[0.06] text-os-muted'
                )}>
                  {label}
                </span>
              )}
            </div>
            <button onClick={() => setAddTaskOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-os-border text-[10px] font-mono text-os-muted hover:text-os-accent hover:border-os-accent/30 transition-all">
              <Plus className="w-3 h-3" /> Add task
            </button>
          </div>

          {/* Pending tasks */}
          {pendingTasks.length === 0 && doneTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 rounded-xl border border-dashed border-os-border">
              <CalendarDays className="w-8 h-8 text-os-muted/20" />
              <p className="text-xs font-mono text-os-muted/50">No tasks for this day</p>
              <button onClick={() => setAddTaskOpen(true)}
                className="flex items-center gap-1 text-xs font-mono text-os-accent hover:underline">
                <Plus className="w-3 h-3" /> Add a task
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingTasks.map(task => (
                <TaskRow key={task.id} task={task}
                  onComplete={() => completeTask.mutate(task.id)}
                  completing={completeTask.isPending} />
              ))}
              {doneTasks.length > 0 && (
                <>
                  <p className="text-[9px] font-mono text-os-muted/50 uppercase tracking-widest px-1 pt-1">
                    Completed — {doneTasks.length}
                  </p>
                  {doneTasks.map(task => (
                    <TaskRow key={task.id} task={task} done />
                  ))}
                </>
              )}
            </div>
          )}

          {/* Habits — only on today */}
          {isViewingToday && habitsToday && (
            <div className="mt-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span className="text-xs font-mono font-semibold text-os-text">Today's Habits</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-os-muted">
                    {habitsToday.completedToday}/{habitsToday.dueToday}
                  </span>
                  {/* Progress bar */}
                  <div className="w-20 h-1.5 bg-os-border rounded-full overflow-hidden">
                    <div className="h-full bg-os-accent rounded-full transition-all"
                      style={{ width: `${habitsCompletionPct}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-os-accent">{habitsCompletionPct}%</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(habitsToday.habits || []).map((h: any) => (
                  <div key={h.id} className={cn(
                    'flex items-center gap-2.5 p-2.5 rounded-lg border transition-all',
                    h.completedToday
                      ? 'bg-os-success/5 border-os-success/15'
                      : 'bg-white/[0.02] border-os-border'
                  )}>
                    {h.completedToday
                      ? <CheckCircle className="w-4 h-4 text-os-success flex-shrink-0" />
                      : <Circle className="w-4 h-4 text-os-muted flex-shrink-0" />}
                    <span className={cn('text-xs font-mono flex-1',
                      h.completedToday ? 'text-os-muted line-through' : 'text-os-text')}>
                      {h.icon} {h.title}
                    </span>
                    {h.currentStreak > 0 && (
                      <span className="text-[9px] font-mono text-orange-400 flex-shrink-0">
                        {h.currentStreak}🔥
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {habitsCompletionPct === 100 && (
                <p className="text-[10px] font-mono text-os-success text-center mt-2">
                  🎉 All habits done for today!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right sidebar: quick stats + wins */}
        <div className="space-y-4">

          {/* Week summary */}
          <div className="p-4 rounded-xl border border-os-border bg-white/[0.02]">
            <p className="text-[9px] font-mono text-os-muted uppercase tracking-widest mb-3">This Week</p>
            <div className="space-y-2">
              {[
                {
                  label: 'Tasks completed',
                  value: weekDays.reduce((acc, d) => acc + dayTasks(d).filter(t => t.status === 'DONE').length, 0),
                  color: '#22c55e',
                },
                {
                  label: 'Tasks pending',
                  value: weekDays.reduce((acc, d) => acc + dayTasks(d).filter(t => t.status !== 'DONE').length, 0),
                  color: '#f59e0b',
                },
                {
                  label: 'Habits done today',
                  value: habitsToday ? `${habitsToday.completedToday}/${habitsToday.dueToday}` : '—',
                  color: '#f97316',
                },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-os-muted">{s.label}</span>
                  <span className="text-sm font-mono font-bold" style={{ color: s.color }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Goals quick links */}
          {goals && goals.length > 0 && (
            <div className="p-4 rounded-xl border border-os-border bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-3.5 h-3.5 text-os-accent" />
                <p className="text-[9px] font-mono text-os-muted uppercase tracking-widest">Active Goals</p>
              </div>
              <div className="space-y-2">
                {goals.slice(0, 4).map((g: any) => (
                  <div key={g.id} className="flex items-center gap-2">
                    <span className="text-sm flex-shrink-0">{PILLAR_META[g.pillar]?.icon}</span>
                    <span className="text-[10px] font-mono text-os-text flex-1 truncate">{g.title}</span>
                    <span className="text-[9px] font-mono text-os-muted flex-shrink-0">{g.progress}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent wins */}
          <div className="p-4 rounded-xl border border-os-border bg-white/[0.02]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" />
                <p className="text-[9px] font-mono text-os-muted uppercase tracking-widest">Recent Wins</p>
              </div>
              <button onClick={() => setWinOpen(true)}
                className="text-os-muted hover:text-os-accent transition-colors p-0.5">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {wins && wins.length > 0 ? (
              <div className="space-y-2">
                {wins.map((w: any) => (
                  <div key={w.id} className="p-2 rounded-lg bg-white/[0.02] border border-os-border">
                    <p className="text-[10px] font-mono text-os-text leading-snug">{w.title}</p>
                    {w.pillar && (
                      <p className="text-[9px] font-mono text-os-muted mt-0.5">
                        {PILLAR_META[w.pillar as keyof typeof PILLAR_META]?.icon} {w.pillar}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <button onClick={() => setWinOpen(true)}
                className="w-full text-[10px] font-mono text-os-muted/50 hover:text-os-accent py-3 text-center transition-colors">
                + Log your first win
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Add Task Modal ───────────────────────────────────────────────── */}
      <Modal open={addTaskOpen} onClose={() => setAddTaskOpen(false)}
        title={`Add Task — ${selectedDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}>
        <div className="space-y-4">
          <Input label="Task title" placeholder="What needs to be done?"
            value={taskForm.title} autoFocus
            onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && taskForm.title.trim() && handleAddTask()} />
          <Select label="Link to Goal (optional)" value={taskForm.goalId}
            onChange={e => setTaskForm(f => ({ ...f, goalId: e.target.value }))}>
            <option value="">— No linked goal —</option>
            {goals?.map((g: any) => (
              <option key={g.id} value={g.id}>{PILLAR_META[g.pillar]?.icon} {g.title}</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Priority" value={taskForm.priority}
              onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}>
              {Object.keys(PRIORITY_META).map(p => <option key={p} value={p}>{p}</option>)}
            </Select>
            <Select label="Energy" value={String(taskForm.energyRequired)}
              onChange={e => setTaskForm(f => ({ ...f, energyRequired: Number(e.target.value) }))}>
              {ENERGY_META.map((e, i) => <option key={i} value={i}>{e.icon} {e.label}</option>)}
            </Select>
          </div>
          <div className="flex gap-3 pt-1">
            <Button className="flex-1" loading={createTask.isPending}
              disabled={!taskForm.title.trim()} onClick={handleAddTask}>
              Add to {relativeLabel(selectedDay, today) || selectedDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Button>
            <Button variant="ghost" onClick={() => setAddTaskOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* ── Log Win Modal ────────────────────────────────────────────────── */}
      <Modal open={winOpen} onClose={() => setWinOpen(false)} title="🏆 Log a Win">
        <div className="space-y-4">
          <Input label="What did you achieve?" placeholder="Shipped a feature, hit a PR, closed a deal..."
            value={winForm.title} autoFocus
            onChange={e => setWinForm(f => ({ ...f, title: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && winForm.title.trim() && logWin.mutate()} />
          <div>
            <label className="block text-[10px] font-mono tracking-widest uppercase text-os-muted mb-2">Life Pillar (optional)</label>
            <div className="grid grid-cols-3 gap-2">
              {['', ...Object.keys(PILLAR_META)].map(p => (
                <button key={p || 'none'} onClick={() => setWinForm(f => ({ ...f, pillar: p }))}
                  className={cn('py-2 px-2 rounded-lg border text-[10px] font-mono transition-all text-center',
                    winForm.pillar === p
                      ? 'border-os-accent/40 bg-os-accent/10 text-os-accent'
                      : 'border-os-border text-os-muted hover:border-os-accent/20')}>
                  {p ? `${PILLAR_META[p as keyof typeof PILLAR_META]?.icon} ${p}` : 'None'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <Button className="flex-1" loading={logWin.isPending}
              disabled={!winForm.title.trim()} onClick={() => logWin.mutate()}>
              Log Win
            </Button>
            <Button variant="ghost" onClick={() => setWinOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function TaskRow({ task, onComplete, done, completing }: {
  task: any
  onComplete?: () => void
  done?: boolean
  completing?: boolean
}) {
  const priorityColors: Record<string, string> = {
    URGENT: '#dc2626', HIGH: '#ef4444', MEDIUM: '#f59e0b', LOW: '#64748b'
  }
  return (
    <div className={cn(
      'flex items-stretch gap-0 rounded-xl border overflow-hidden transition-all',
      done ? 'opacity-40 border-os-border' : 'border-os-border hover:border-os-accent/20'
    )}>
      {/* Priority bar */}
      <div className="w-1 flex-shrink-0" style={{ background: done ? '#64748b' : (priorityColors[task.priority] || '#64748b') }} />

      {/* Complete button */}
      {!done && (
        <button onClick={onComplete} disabled={completing}
          className="flex items-center justify-center w-12 flex-shrink-0 hover:bg-os-success/10 active:bg-os-success/20 transition-all touch-manipulation border-r border-os-border">
          <Circle className="w-4 h-4 text-os-muted hover:text-os-success transition-colors" />
        </button>
      )}
      {done && (
        <div className="flex items-center justify-center w-12 flex-shrink-0 border-r border-os-border bg-os-success/5">
          <CheckCircle className="w-4 h-4 text-os-success" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 px-3 py-2.5">
        <p className={cn('text-sm font-mono', done ? 'line-through text-os-muted' : 'text-os-text')}>
          {task.title}
        </p>
        {task.goal && (
          <p className="text-[10px] font-mono text-os-muted mt-0.5">↳ {task.goal.title}</p>
        )}
      </div>

      {/* Right meta */}
      <div className="flex items-center px-3 gap-2 flex-shrink-0">
        <span className="text-xs hidden sm:block" title={`Energy: ${ENERGY_META[task.energyRequired]?.label}`}>
          {ENERGY_META[task.energyRequired]?.icon}
        </span>
        {task.priority !== 'MEDIUM' && task.priority !== 'LOW' && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded"
            style={{ color: priorityColors[task.priority], background: `${priorityColors[task.priority]}15` }}>
            {task.priority}
          </span>
        )}
      </div>
    </div>
  )
}

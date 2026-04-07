'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, journalApi, winsApi } from '@/lib/api'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useAppStore } from '@/store/useAppStore'
import { cn, PILLAR_META } from '@/lib/utils'
import { Calendar, CheckCircle, Circle, Flame, Trophy, BookOpen, Plus, ChevronLeft, ChevronRight } from 'lucide-react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MOOD_OPTIONS = [
  { value: 1, label: '😔', desc: 'Rough' },
  { value: 2, label: '😐', desc: 'Okay' },
  { value: 3, label: '🙂', desc: 'Good' },
  { value: 4, label: '😊', desc: 'Great' },
  { value: 5, label: '🔥', desc: 'Amazing' },
]

function getWeekDays(offset = 0) {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - dayOfWeek + offset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

export default function PlannerPage() {
  const qc = useQueryClient()
  const { showToast } = useAppStore()
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [journalOpen, setJournalOpen] = useState(false)
  const [winOpen, setWinOpen] = useState(false)
  const [journalText, setJournalText] = useState('')
  const [mood, setMood] = useState(3)
  const [winForm, setWinForm] = useState({ title: '', details: '', pillar: '' })

  const weekDays = getWeekDays(weekOffset)
  const today = new Date()

  const { data: tasks } = useQuery<any>({
    queryKey: ['tasks', 'all'],
    queryFn: () => api.get('/tasks', { params: { limit: 100 } }),
  })

  const { data: habitsToday } = useQuery<any>({
    queryKey: ['habits', 'today'],
    queryFn: () => api.get('/habits/today'),
  })

  const { data: todayJournal } = useQuery<any>({
    queryKey: ['journal', 'today'],
    queryFn: () => journalApi.today(),
  })

  const { data: wins } = useQuery<any[]>({
    queryKey: ['wins'],
    queryFn: () => winsApi.list(10),
  })

  const completeTask = useMutation({
    mutationFn: (id: string) => api.patch(`/tasks/${id}/complete`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks'] }),
  })

  const saveJournal = useMutation({
    mutationFn: () => todayJournal?.id
      ? journalApi.update(todayJournal.id, { content: journalText, mood })
      : journalApi.create({ content: journalText, mood }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal'] })
      setJournalOpen(false)
      showToast('Journal saved ✓')
    },
    onError: () => showToast('Failed to save journal', 'error'),
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

  const selectedDayTasks = allTasks.filter(t => {
    if (!t.dueDate) return false
    return isSameDay(new Date(t.dueDate), selectedDay)
  })

  const overdueTasks = allTasks.filter(t => {
    if (!t.dueDate || t.status === 'DONE' || t.status === 'CANCELLED') return false
    return new Date(t.dueDate) < today && !isSameDay(new Date(t.dueDate), today)
  })

  const tasksByDay = (day: Date) => allTasks.filter(t => {
    if (!t.dueDate) return false
    return isSameDay(new Date(t.dueDate), day)
  })

  function openJournal() {
    setJournalText(todayJournal?.content || '')
    setMood(todayJournal?.mood || 3)
    setJournalOpen(true)
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-mono font-bold text-os-text">Weekly Planner</h1>
          <p className="text-xs font-mono text-os-muted mt-0.5">
            {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} —{' '}
            {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openJournal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-os-border text-xs font-mono text-os-muted hover:text-os-accent hover:border-os-accent/30 transition-all">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{todayJournal ? 'Edit Journal' : 'Write Journal'}</span>
          </button>
          <button onClick={() => setWinOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-os-accent/30 bg-os-accent/5 text-xs font-mono text-os-accent hover:bg-os-accent/10 transition-all">
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Log Win</span>
          </button>
        </div>
      </div>

      {/* Week navigator */}
      <Card className="p-0 overflow-hidden">
        <div className="flex items-center border-b border-os-border px-4 py-2">
          <button onClick={() => setWeekOffset(o => o - 1)}
            className="p-1 text-os-muted hover:text-os-text transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 grid grid-cols-7">
            {weekDays.map((day, i) => {
              const dayTasks = tasksByDay(day)
              const isToday = isSameDay(day, today)
              const isSelected = isSameDay(day, selectedDay)
              const doneTasks = dayTasks.filter(t => t.status === 'DONE').length
              return (
                <button key={i} onClick={() => setSelectedDay(day)}
                  className={cn(
                    'flex flex-col items-center py-2 px-1 transition-all rounded-lg mx-0.5',
                    isSelected ? 'bg-os-accent/10' : 'hover:bg-white/[0.03]'
                  )}>
                  <span className={cn('text-[9px] font-mono tracking-widest uppercase',
                    isSelected ? 'text-os-accent' : 'text-os-muted')}>
                    {DAYS[day.getDay()]}
                  </span>
                  <span className={cn(
                    'text-sm font-mono font-bold mt-0.5 w-7 h-7 flex items-center justify-center rounded-full',
                    isToday ? 'bg-os-accent text-os-bg' : isSelected ? 'text-os-accent' : 'text-os-text'
                  )}>
                    {day.getDate()}
                  </span>
                  {dayTasks.length > 0 && (
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: Math.min(dayTasks.length, 3) }).map((_, j) => (
                        <div key={j} className={cn('w-1 h-1 rounded-full',
                          j < doneTasks ? 'bg-os-success' : 'bg-os-accent/40')} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          <button onClick={() => setWeekOffset(o => o + 1)}
            className="p-1 text-os-muted hover:text-os-text transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Selected day tasks */}
        <div className="p-4">
          <p className="text-[10px] font-mono tracking-widest uppercase text-os-muted mb-3">
            {selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {isSameDay(selectedDay, today) && (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-os-accent/15 text-os-accent">Today</span>
            )}
          </p>
          {selectedDayTasks.length === 0 ? (
            <p className="text-xs font-mono text-os-muted/60 py-4 text-center">No tasks due this day</p>
          ) : (
            <div className="space-y-2">
              {selectedDayTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-os-border group">
                  <button onClick={() => task.status !== 'DONE' && completeTask.mutate(task.id)}
                    className="flex-shrink-0 text-os-muted hover:text-os-success transition-colors">
                    {task.status === 'DONE'
                      ? <CheckCircle className="w-4 h-4 text-os-success" />
                      : <Circle className="w-4 h-4" />}
                  </button>
                  <span className={cn('text-xs font-mono flex-1', task.status === 'DONE' && 'line-through text-os-muted')}>
                    {task.title}
                  </span>
                  <span className={cn('text-[9px] font-mono px-1.5 py-0.5 rounded', {
                    'bg-red-500/10 text-red-400': task.priority === 'URGENT',
                    'bg-orange-500/10 text-orange-400': task.priority === 'HIGH',
                    'bg-os-accent/10 text-os-accent': task.priority === 'MEDIUM',
                    'text-os-muted': task.priority === 'LOW',
                  })}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Habits today */}
        <Card>
          <CardHeader>
            <CardTitle><Flame className="w-3.5 h-3.5 inline mr-1 text-orange-400" />Habits Today</CardTitle>
          </CardHeader>
          {habitsToday ? (
            <div className="space-y-1.5 mt-2">
              <div className="flex justify-between text-[10px] font-mono text-os-muted mb-2">
                <span>{habitsToday.completedToday} of {habitsToday.dueToday} done</span>
                <span className="text-os-accent">{habitsToday.dueToday > 0 ? Math.round(habitsToday.completedToday / habitsToday.dueToday * 100) : 0}%</span>
              </div>
              {(habitsToday.habits || []).slice(0, 6).map((h: any) => (
                <div key={h.id} className="flex items-center gap-2 text-xs font-mono">
                  <span>{h.completedToday
                    ? <CheckCircle className="w-3.5 h-3.5 text-os-success" />
                    : <Circle className="w-3.5 h-3.5 text-os-muted" />}</span>
                  <span className={cn('flex-1', h.completedToday && 'text-os-muted line-through')}>
                    {h.icon} {h.title}
                  </span>
                  {h.currentStreak > 0 && (
                    <span className="text-[9px] text-orange-400">{h.currentStreak}🔥</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs font-mono text-os-muted mt-2">Loading habits...</p>
          )}
        </Card>

        {/* Overdue + Wins */}
        <div className="space-y-5">
          {overdueTasks.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-os-danger">⚠ Overdue</CardTitle></CardHeader>
              <div className="space-y-1.5 mt-2">
                {overdueTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-center gap-2">
                    <button onClick={() => completeTask.mutate(task.id)}
                      className="text-os-muted hover:text-os-success transition-colors flex-shrink-0">
                      <Circle className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-mono flex-1 text-os-text truncate">{task.title}</span>
                    <span className="text-[9px] font-mono text-os-danger">
                      {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle><Trophy className="w-3.5 h-3.5 inline mr-1 text-yellow-400" />Recent Wins</CardTitle>
              <button onClick={() => setWinOpen(true)}
                className="text-os-muted hover:text-os-accent transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </CardHeader>
            {wins && wins.length > 0 ? (
              <div className="space-y-2 mt-2">
                {wins.slice(0, 4).map((w: any) => (
                  <div key={w.id} className="text-xs font-mono p-2 rounded-lg bg-white/[0.02] border border-os-border">
                    <p className="text-os-text">{w.title}</p>
                    {w.pillar && (
                      <p className="text-[9px] text-os-muted mt-0.5">
                        {PILLAR_META[w.pillar as keyof typeof PILLAR_META]?.icon} {w.pillar}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-mono text-os-muted/60 mt-2 text-center py-3">No wins logged yet — log your first!</p>
            )}
          </Card>
        </div>
      </div>

      {/* Journal Modal */}
      <Modal isOpen={journalOpen} onClose={() => setJournalOpen(false)} title="📓 Daily Journal">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-mono text-os-muted mb-2">How are you feeling today?</p>
            <div className="flex gap-2">
              {MOOD_OPTIONS.map(m => (
                <button key={m.value} onClick={() => setMood(m.value)}
                  className={cn('flex-1 flex flex-col items-center py-2 rounded-lg border transition-all text-lg',
                    mood === m.value
                      ? 'border-os-accent/40 bg-os-accent/10'
                      : 'border-os-border hover:border-os-border/60')}>
                  {m.label}
                  <span className="text-[9px] font-mono text-os-muted mt-0.5">{m.desc}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-mono text-os-muted mb-2">What's on your mind?</p>
            <textarea
              value={journalText}
              onChange={e => setJournalText(e.target.value)}
              placeholder="Reflect on your day, wins, challenges, thoughts..."
              rows={6}
              className="w-full os-input resize-none text-xs font-mono leading-relaxed"
            />
          </div>
          <div className="flex gap-3">
            <Button className="flex-1" loading={saveJournal.isPending}
              disabled={!journalText.trim()}
              onClick={() => saveJournal.mutate()}>
              {todayJournal ? 'Update Entry' : 'Save Entry'}
            </Button>
            <Button variant="ghost" onClick={() => setJournalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Win Modal */}
      <Modal isOpen={winOpen} onClose={() => setWinOpen(false)} title="🏆 Log a Win">
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-mono text-os-muted uppercase tracking-widest block mb-1.5">Win Title *</label>
            <input
              value={winForm.title}
              onChange={e => setWinForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Shipped new feature, closed a deal, ran 5k..."
              className="w-full os-input text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-os-muted uppercase tracking-widest block mb-1.5">Details (optional)</label>
            <textarea
              value={winForm.details}
              onChange={e => setWinForm(f => ({ ...f, details: e.target.value }))}
              placeholder="More context about this win..."
              rows={3}
              className="w-full os-input resize-none text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-os-muted uppercase tracking-widest block mb-1.5">Pillar (optional)</label>
            <div className="grid grid-cols-3 gap-2">
              {['', ...Object.keys(PILLAR_META)].map(p => (
                <button key={p || 'none'} onClick={() => setWinForm(f => ({ ...f, pillar: p }))}
                  className={cn('py-1.5 px-2 rounded-lg border text-[10px] font-mono transition-all',
                    winForm.pillar === p
                      ? 'border-os-accent/40 bg-os-accent/10 text-os-accent'
                      : 'border-os-border text-os-muted hover:border-os-border/60')}>
                  {p ? `${PILLAR_META[p as keyof typeof PILLAR_META]?.icon} ${p}` : 'None'}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button className="flex-1" loading={logWin.isPending}
              disabled={!winForm.title.trim()}
              onClick={() => logWin.mutate()}>
              Log Win
            </Button>
            <Button variant="ghost" onClick={() => setWinOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

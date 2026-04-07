'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAppStore } from '@/store/useAppStore'
import { Flame, Plus, Check, X, Repeat2 } from 'lucide-react'
import { useConfirm } from '@/components/ui/ConfirmDialog'

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const ICONS = ['✓','💪','📚','🏃','🧘','💻','🎸','🍎','💰','🌅','🌙','✍️']
const COLORS = ['#64ffda','#22c55e','#00b4d8','#a78bfa','#f59e0b','#ef4444','#f97316','#ec4899']

export default function HabitsPage() {
  const qc = useQueryClient()
  const { showToast } = useAppStore()
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ title: '', frequency: 'DAILY', frequencyDays: [] as number[], targetCount: 1, icon: '✓', color: '#64ffda' })
  const { confirm, dialog: confirmDialog } = useConfirm()

  const { data: habits, isLoading } = useQuery<any[]>({ queryKey: ['habits'], queryFn: () => api.get('/habits') })
  const { data: today } = useQuery<any>({ queryKey: ['habits', 'today'], queryFn: () => api.get('/habits/today') })
  const { data: weekly } = useQuery<any>({ queryKey: ['habits', 'weekly'], queryFn: () => api.get('/habits/weekly') })

  const createHabit = useMutation({
    mutationFn: (data: any) => api.post('/habits', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['habits'] }); setCreateOpen(false); showToast('Habit created ✓') },
  })

  const logHabit = useMutation({
    mutationFn: (id: string) => api.post(`/habits/${id}/log`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['habits'] }); showToast('Habit logged! 🔥') },
    onError: () => showToast('Already logged today', 'info'),
  })

  const archiveHabit = useMutation({
    mutationFn: (id: string) => api.delete(`/habits/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['habits'] }); showToast('Habit archived') },
  })

  function toggleDay(day: number) {
    setForm(f => ({
      ...f,
      frequencyDays: f.frequencyDays.includes(day) ? f.frequencyDays.filter(d => d !== day) : [...f.frequencyDays, day],
    }))
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {confirmDialog}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-os-muted">{habits?.length ?? 0} habits tracked</span>
          {today && (
            <span className="text-xs font-mono text-os-accent">{today.completedToday}/{today.dueToday} done today</span>
          )}
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="w-3 h-3" /> New Habit</Button>
      </div>

      {/* Today's summary bar */}
      {today && today.dueToday > 0 && (
        <Card glow className="border-os-accent/20">
          <div className="flex items-center justify-between mb-3">
            <span className="os-label">Today's Completion</span>
            <span className="text-sm font-mono font-bold text-os-accent">{today.completionRate}%</span>
          </div>
          <ProgressBar value={today.completionRate} size="md" />
          <div className="flex gap-2 mt-3 flex-wrap">
            {today.habits?.map((h: any) => (
              <div key={h.id} className="flex items-center gap-1.5 px-2 py-1 rounded border transition-all"
                style={{ borderColor: h.completedToday ? `${h.color}44` : 'rgba(255,255,255,0.08)', background: h.completedToday ? `${h.color}15` : 'transparent' }}>
                <span className="text-xs">{h.icon}</span>
                <span className="text-[10px] font-mono" style={{ color: h.completedToday ? h.color : '#64748b' }}>{h.title}</span>
                {h.completedToday && <Check className="w-2.5 h-2.5" style={{ color: h.color }} />}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Weekly chart */}
      {weekly && (
        <Card>
          <CardHeader><CardTitle>📅 This Week</CardTitle></CardHeader>
          <div className="flex gap-2">
            {weekly.byDay?.map((d: any) => (
              <div key={d.date} className="flex-1 text-center">
                <div className="h-16 flex items-end justify-center mb-1">
                  <div className="w-full rounded-t transition-all"
                    style={{ height: `${weekly.totalLogs > 0 ? (d.count / Math.max(...weekly.byDay.map((x: any) => x.count), 1)) * 100 : 0}%`, minHeight: d.count > 0 ? 4 : 0, background: d.count > 0 ? '#64ffda' : 'rgba(255,255,255,0.05)' }} />
                </div>
                <div className="text-[9px] font-mono text-os-muted">{new Date(d.date).toLocaleDateString('en',{weekday:'short'})}</div>
                <div className="text-[9px] font-mono text-os-accent">{d.count || ''}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Habit list */}
      <div className="space-y-3">
        <span className="os-label">All Habits — {habits?.length ?? 0}</span>
        {isLoading && <div className="text-xs font-mono text-os-muted animate-pulse">Loading habits...</div>}
        {habits?.map((habit: any) => (
          <Card key={habit.id}>
            <div className="flex items-center gap-4">
              {/* Icon + log button */}
              <button onClick={() => !habit.completedToday && logHabit.mutate(habit.id)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg border-2 transition-all flex-shrink-0"
                style={{
                  borderColor: habit.completedToday ? habit.color : `${habit.color}33`,
                  background: habit.completedToday ? `${habit.color}20` : 'transparent',
                  cursor: habit.completedToday ? 'default' : 'pointer',
                }}>
                {habit.completedToday ? <Check className="w-5 h-5" style={{ color: habit.color }} /> : <span>{habit.icon}</span>}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-mono text-os-text">{habit.title}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ color: habit.color, background: `${habit.color}15` }}>
                    {habit.frequency === 'DAILY' ? 'Daily' : habit.frequency === 'WEEKLY' ? `${habit.frequencyDays?.length}x/week` : 'Custom'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Flame className="w-3 h-3" style={{ color: habit.currentStreak > 0 ? '#f97316' : '#64748b' }} />
                    <span className="text-[10px] font-mono" style={{ color: habit.currentStreak > 0 ? '#f97316' : '#64748b' }}>
                      {habit.currentStreak} day streak
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-os-muted">Best: {habit.longestStreak}d</span>
                  <span className="text-[10px] font-mono text-os-muted">Total: {habit.totalCompleted}x</span>
                </div>
              </div>

              <button onClick={async () => {
                const ok = await confirm({ title: 'Archive this habit?', description: 'It will no longer appear in your daily tracking.' })
                if (ok) archiveHabit.mutate(habit.id)
              }} className="text-os-muted hover:text-os-danger transition-colors p-1 flex-shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </Card>
        ))}
        {habits?.length === 0 && !isLoading && (
          <Card className="text-center py-10">
            <Repeat2 className="w-8 h-8 text-os-accent/30 mx-auto mb-3" />
            <p className="text-xs font-mono text-os-muted mb-4">No habits yet. Build the systems that make success inevitable.</p>
            <Button onClick={() => setCreateOpen(true)}><Plus className="w-3 h-3" /> Create First Habit</Button>
          </Card>
        )}
      </div>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Habit">
        <div className="space-y-4">
          <Input label="Habit Name" placeholder="Morning workout, Read 20 pages..." value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />

          {/* Icon picker */}
          <div>
            <label className="block text-[10px] font-mono tracking-widest uppercase text-os-muted mb-2">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map(ic => (
                <button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))}
                  className="w-8 h-8 rounded text-sm border transition-all"
                  style={{ borderColor: form.icon === ic ? '#64ffda' : 'rgba(255,255,255,0.1)', background: form.icon === ic ? 'rgba(100,255,218,0.1)' : 'transparent' }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-[10px] font-mono tracking-widest uppercase text-os-muted mb-2">Color</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  className="w-6 h-6 rounded-full border-2 transition-all"
                  style={{ background: c, borderColor: form.color === c ? '#fff' : 'transparent' }} />
              ))}
            </div>
          </div>

          <Select label="Frequency" value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}>
            <option value="DAILY">Daily</option>
            <option value="WEEKLY">Weekly (pick days)</option>
            <option value="CUSTOM">Custom days</option>
          </Select>

          {(form.frequency === 'WEEKLY' || form.frequency === 'CUSTOM') && (
            <div>
              <label className="block text-[10px] font-mono tracking-widest uppercase text-os-muted mb-2">Days</label>
              <div className="flex gap-2">
                {DAYS.map((d, i) => (
                  <button key={d} onClick={() => toggleDay(i)}
                    className="flex-1 py-1.5 rounded border text-[10px] font-mono transition-all"
                    style={{
                      borderColor: form.frequencyDays.includes(i) ? form.color : 'rgba(255,255,255,0.1)',
                      color: form.frequencyDays.includes(i) ? form.color : '#64748b',
                      background: form.frequencyDays.includes(i) ? `${form.color}15` : 'transparent',
                    }}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button onClick={() => createHabit.mutate(form)} loading={createHabit.isPending} className="flex-1">Create Habit</Button>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

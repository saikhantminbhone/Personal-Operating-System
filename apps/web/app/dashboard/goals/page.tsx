'use client'
import { useState } from 'react'
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from '@/hooks/useGoals'
import { useAppStore } from '@/store/useAppStore'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PillarBadge, StatusBadge } from '@/components/ui/Badge'
import { PILLAR_META, progressColor, formatDate } from '@/lib/utils'
import { GoalPillar, GoalStatus } from '@/types'
import type { Goal } from '@/types'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useConfirm } from '@/components/ui/ConfirmDialog'

const PILLARS = Object.keys(PILLAR_META)

export default function GoalsPage() {
  const { data: goals, isLoading } = useGoals()
  const createGoal = useCreateGoal()
  const updateGoal = useUpdateGoal()
  const deleteGoal = useDeleteGoal()
  const { showToast } = useAppStore()
  const [createOpen, setCreateOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', pillar: 'WORK', targetDate: '' })
  const [titleError, setTitleError] = useState('')
  const { confirm, dialog: confirmDialog } = useConfirm()

  async function handleCreate() {
    if (!form.title.trim()) { setTitleError('Title is required'); return }
    setTitleError('')
    try {
      await createGoal.mutateAsync({ ...form, pillar: form.pillar as GoalPillar, targetDate: form.targetDate || undefined })
      setCreateOpen(false)
      setForm({ title: '', pillar: 'WORK', targetDate: '' })
      showToast('Goal created 🎯')
    } catch (err: any) {
      showToast(err.message || 'Failed to create goal', 'error')
    }
  }

  async function handleNudge(goal: Goal, delta: number) {
    await updateGoal.mutateAsync({
      id: goal.id,
      data: { progress: Math.min(100, Math.max(0, goal.progress + delta)) }
    })
  }

  async function handleDelete(id: string) {
    const ok = await confirm({ title: 'Delete this goal?', description: 'This cannot be undone.' })
    if (!ok) return
    await deleteGoal.mutateAsync(id)
    showToast('Goal deleted')
  }

  const active = goals?.filter(g => g.status === 'ACTIVE') || []
  const other = goals?.filter(g => g.status !== 'ACTIVE') || []

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <span className="text-xs font-mono text-os-muted">{goals?.length ?? 0} goals tracked</span>
        <Button onClick={() => setCreateOpen(true)}><Plus className="w-3 h-3" /> New Goal</Button>
      </div>

      {/* Pillar grid - scrollable on mobile */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
        {PILLARS.map(p => {
          const meta = PILLAR_META[p]
          const pg = goals?.filter(g => g.pillar === p && g.status === 'ACTIVE') || []
          const avg = pg.length ? Math.round(pg.reduce((a, g) => a + g.progress, 0) / pg.length) : 0
          return (
            <Card key={p} className="text-center p-3 sm:p-4">
              <div className="text-xl mb-1">{meta.icon}</div>
              <div className="text-sm font-mono font-bold" style={{ color: meta.color }}>{avg}%</div>
              <div className="text-[9px] font-mono tracking-wider uppercase text-os-muted mb-2 hidden sm:block">{meta.label}</div>
              <ProgressBar value={avg} color={meta.color} />
            </Card>
          )
        })}
      </div>

      {/* Active goals */}
      <div className="space-y-3">
        {active.length > 0 && <span className="os-label">Active — {active.length}</span>}
        {active.map(goal => (
          <Card key={goal.id}>
            <div className="flex items-start gap-3">
              <span className="text-lg mt-0.5 flex-shrink-0">{PILLAR_META[goal.pillar]?.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-start sm:items-center gap-2 flex-wrap mb-2">
                  <span className="text-sm font-mono text-os-text">{goal.title}</span>
                  <PillarBadge pillar={goal.pillar} />
                  {goal.targetDate && (
                    <span className="text-[10px] font-mono text-os-muted">Due {formatDate(goal.targetDate)}</span>
                  )}
                </div>
                <ProgressBar value={goal.progress} showLabel size="md" />

                {/* KRs expanded */}
                {expandedId === goal.id && (goal as any).keyResults?.map((kr: any) => {
                  const pct = kr.metricType === 'BOOLEAN'
                    ? (kr.currentValue >= 1 ? 100 : 0)
                    : Math.min(100, Math.round((kr.currentValue / kr.targetValue) * 100))
                  return (
                    <div key={kr.id} className="mt-3 p-3 bg-white/[0.02] border border-os-border rounded-lg">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-xs font-mono">{kr.title}</span>
                        <span className="text-[10px] font-mono text-os-muted">{kr.currentValue}/{kr.targetValue} {kr.unit}</span>
                      </div>
                      <ProgressBar value={pct} />
                    </div>
                  )
                })}

                {/* Controls */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {[-10, -5, +5, +10].map(d => (
                    <button key={d} onClick={() => handleNudge(goal, d)}
                      className="text-[10px] font-mono px-2 py-1.5 rounded border border-os-border text-os-muted hover:border-os-accent/30 hover:text-os-accent transition-all touch-manipulation">
                      {d > 0 ? '+' : ''}{d}%
                    </button>
                  ))}
                  <div className="ml-auto flex gap-2">
                    <button
                      onClick={() => updateGoal.mutateAsync({ id: goal.id, data: { status: GoalStatus.COMPLETED } })}
                      className="text-[10px] font-mono px-2 py-1.5 rounded border border-os-success/20 text-os-success hover:bg-os-success/10 transition-all touch-manipulation">
                      ✓ Done
                    </button>
                    <button onClick={() => setExpandedId(expandedId === goal.id ? null : goal.id)}
                      className="text-os-muted hover:text-os-text p-1.5 touch-manipulation">
                      {expandedId === goal.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <button onClick={() => handleDelete(goal.id)}
                      className="text-os-muted hover:text-os-danger p-1.5 touch-manipulation">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {active.length === 0 && !isLoading && (
          <Card className="text-center py-10">
            <p className="text-xs font-mono text-os-muted mb-4">No active goals. Define your north stars.</p>
            <Button onClick={() => setCreateOpen(true)}><Plus className="w-3 h-3" /> Create First Goal</Button>
          </Card>
        )}
      </div>

      {/* Completed/paused */}
      {other.length > 0 && (
        <div className="space-y-2">
          <span className="os-label text-os-muted">Other — {other.length}</span>
          {other.map(goal => (
            <Card key={goal.id} className="opacity-60">
              <div className="flex items-center gap-3">
                <span>{PILLAR_META[goal.pillar]?.icon}</span>
                <span className="text-sm font-mono flex-1 truncate">{goal.title}</span>
                <StatusBadge status={goal.status} />
                <span className="text-[10px] font-mono" style={{ color: progressColor(goal.progress) }}>{goal.progress}%</span>
                <button onClick={() => handleDelete(goal.id)} className="text-os-muted hover:text-os-danger p-1 touch-manipulation">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {confirmDialog}

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setTitleError('') }} title="New Goal">
        <div className="space-y-4">
          <Input label="Title *" placeholder="What do you want to achieve?" value={form.title}
            error={titleError}
            onChange={e => { setForm(f => ({ ...f, title: e.target.value })); if (titleError) setTitleError('') }} />
          <Select label="Life Pillar" value={form.pillar} onChange={e => setForm(f => ({ ...f, pillar: e.target.value }))}>
            {PILLARS.map(p => <option key={p} value={p}>{PILLAR_META[p].icon} {PILLAR_META[p].label}</option>)}
          </Select>
          <Input label="Target Date (optional)" type="date" value={form.targetDate}
            onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleCreate} loading={createGoal.isPending} className="flex-1">Create Goal</Button>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

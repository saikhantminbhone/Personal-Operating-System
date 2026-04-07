'use client'
import { useDashboardStats, useGoalsByPillar } from '@/hooks/useAnalytics'
import { useFocusQueue, useCompleteTask } from '@/hooks/useTasks'
import { useGoals } from '@/hooks/useGoals'
import { useAiBriefing } from '@/hooks/useAi'
import { useAppStore } from '@/store/useAppStore'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { ENERGY_META, PILLAR_META, progressColor } from '@/lib/utils'
import { Target, CheckSquare, Flame, Trophy, Plus } from 'lucide-react'

export default function DashboardPage() {
  const { data: stats } = useDashboardStats()
  const { data: focusQueue } = useFocusQueue(stats?.energyLevel ?? undefined)
  const { data: goals } = useGoals({ status: 'ACTIVE' })
  const { data: briefing } = useAiBriefing()
  const { setModal, showToast } = useAppStore()
  const completeTask = useCompleteTask()

  const statCards = [
    { label: 'Day Streak', value: stats?.streakCount ?? 0, unit: 'days', color: '#f97316', icon: Flame },
    { label: 'Active Goals', value: stats?.activeGoalsCount ?? 0, color: '#64ffda', icon: Target },
    { label: 'Done Today', value: stats?.tasksDoneToday ?? 0, color: '#a78bfa', icon: CheckSquare },
    { label: 'Goal Progress', value: `${stats?.overallGoalProgress ?? 0}%`, color: '#22c55e', icon: Trophy },
  ]

  async function handleComplete(taskId: string) {
    await completeTask.mutateAsync(taskId)
    showToast('Task completed! ✓')
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">

      {/* AI Briefing */}
      {briefing && (
        <Card glow className="border-os-accent/20">
          <CardHeader>
            <CardTitle>⬡ AI Briefing</CardTitle>
            <span className="text-[10px] font-mono text-os-muted hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </CardHeader>
          <p className="text-sm text-os-text mb-3 leading-relaxed">{(briefing as any).greeting}</p>
          <div className="p-3 bg-os-accent/5 border border-os-accent/10 rounded-lg">
            <p className="text-xs font-mono text-os-accent leading-relaxed">
              Focus: {(briefing as any).focusSuggestion}
            </p>
          </div>
          {(briefing as any).motivationalNote && (
            <p className="text-xs text-os-muted mt-3 italic leading-relaxed">{(briefing as any).motivationalNote}</p>
          )}
        </Card>
      )}

      {/* Stats - 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map(({ label, value, color, icon: Icon }) => (
          <Card key={label} className="text-center">
            <Icon className="w-4 h-4 mx-auto mb-2" style={{ color }} />
            <div className="text-xl sm:text-2xl font-mono font-bold mb-1" style={{ color }}>{value}</div>
            <div className="text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-os-muted">{label}</div>
          </Card>
        ))}
      </div>

      {/* Focus Queue + Goals - stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Focus Queue */}
        <Card>
          <CardHeader>
            <CardTitle>⚡ Focus Queue</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setModal('add-task')}>
              <Plus className="w-3 h-3" />
              <span className="hidden sm:inline ml-1">Add</span>
            </Button>
          </CardHeader>
          {stats?.energyLevel !== null && stats?.energyLevel !== undefined && (
            <p className="text-[10px] font-mono text-os-muted mb-3">
              Energy: <span style={{ color: ENERGY_META[stats.energyLevel].color }}>
                {ENERGY_META[stats.energyLevel].icon} {ENERGY_META[stats.energyLevel].label}
              </span>
            </p>
          )}
          <div className="space-y-2">
            {!focusQueue?.length ? (
              <p className="text-xs text-os-muted py-4 text-center">No tasks. Add some!</p>
            ) : focusQueue.slice(0, 6).map((task) => (
              <div key={task.id}
                className="flex items-center gap-3 p-3 bg-white/[0.02] border border-os-border rounded-lg group hover:border-os-accent/20 transition-colors">
                <button
                  onClick={() => handleComplete(task.id)}
                  className="w-5 h-5 rounded border border-os-border flex-shrink-0 hover:border-os-success hover:bg-os-success/10 transition-all touch-manipulation"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono text-os-text truncate">{task.title}</p>
                  {task.goal && <p className="text-[10px] text-os-muted truncate">↳ {task.goal.title}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs" style={{
                    color: ['#ef4444','#f97316','#eab308','#22c55e'][task.energyRequired]
                  }}>
                    {['🪫','😐','⚡','🔥'][task.energyRequired]}
                  </span>
                  <div className="w-1.5 h-1.5 rounded-full" style={{
                    background: { LOW:'#64748b', MEDIUM:'#f59e0b', HIGH:'#ef4444', URGENT:'#dc2626' }[task.priority] || '#64748b'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Goal Pulse */}
        <Card>
          <CardHeader>
            <CardTitle>🎯 Goal Pulse</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setModal('add-goal')}>
              <Plus className="w-3 h-3" />
              <span className="hidden sm:inline ml-1">Add</span>
            </Button>
          </CardHeader>
          <div className="space-y-4">
            {!goals?.length ? (
              <p className="text-xs text-os-muted py-4 text-center">No active goals. Define your north stars!</p>
            ) : goals.slice(0, 5).map((goal) => {
              const meta = PILLAR_META[goal.pillar]
              return (
                <div key={goal.id}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm">{meta?.icon}</span>
                    <span className="text-xs font-mono text-os-text truncate flex-1">{goal.title}</span>
                    <span className="text-[10px] font-mono flex-shrink-0" style={{ color: progressColor(goal.progress) }}>
                      {goal.progress}%
                    </span>
                  </div>
                  <ProgressBar value={goal.progress} />
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Bottom stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Tasks Pending', value: stats?.tasksPendingCount ?? 0, color: '#f59e0b' },
          { label: 'Habits Today', value: `${stats?.habitsCompletedToday ?? 0}/${stats?.totalHabits ?? 0}`, color: '#a78bfa' },
          { label: 'Total Wins', value: stats?.totalWins ?? 0, color: '#f97316' },
          { label: 'AI Active', value: '✓', color: '#64ffda' },
        ].map(({ label, value, color }) => (
          <Card key={label} className="text-center">
            <div className="text-lg font-mono font-bold mb-1" style={{ color }}>{value}</div>
            <div className="text-[9px] font-mono tracking-widest uppercase text-os-muted">{label}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}

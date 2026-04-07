'use client'
import { useDashboardStats, useProductivityTrend, useGoalsByPillar, useHabitHeatmap } from '@/hooks/useAnalytics'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PILLAR_META, ENERGY_META } from '@/lib/utils'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts'

export default function AnalyticsPage() {
  const { data: stats } = useDashboardStats()
  const { data: trend } = useProductivityTrend(30)
  const { data: pillarData } = useGoalsByPillar()
  const { data: heatmap } = useHabitHeatmap()

  const totalHabitDays = heatmap ? Object.keys(heatmap).length : 0
  const maxHabits = heatmap ? Math.max(...Object.values(heatmap as Record<string, number>), 1) : 1

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Day Streak', value: `${stats?.streakCount ?? 0}d`, color: '#f97316' },
          { label: 'Goals Active', value: stats?.activeGoalsCount ?? 0, color: '#64ffda' },
          { label: 'Overall Progress', value: `${stats?.overallGoalProgress ?? 0}%`, color: '#22c55e' },
          { label: 'Total Wins', value: stats?.totalWins ?? 0, color: '#a78bfa' },
        ].map(s => (
          <Card key={s.label} className="text-center">
            <div className="text-2xl font-mono font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] font-mono tracking-widest uppercase text-os-muted">{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Productivity trend */}
      <Card>
        <CardHeader><CardTitle>📈 Productivity Trend — 30 Days</CardTitle></CardHeader>
        {trend && trend.length > 0 ? (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trend} margin={{ top: 5, right: 10, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="taskGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64ffda" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#64ffda" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} />
              <Tooltip
                contentStyle={{ background: '#0d1520', border: '1px solid rgba(100,255,218,0.2)', borderRadius: 6, fontFamily: 'monospace', fontSize: 11 }}
                labelStyle={{ color: '#64ffda' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Area type="monotone" dataKey="count" stroke="#64ffda" strokeWidth={2} fill="url(#taskGrad)" name="Tasks Done" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-xs font-mono text-os-muted">
            Complete tasks to see your trend
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Goals by pillar */}
        <Card>
          <CardHeader><CardTitle>🎯 Goals by Pillar</CardTitle></CardHeader>
          {pillarData && pillarData.length > 0 ? (
            <div className="space-y-4">
              {(pillarData as any[]).map((p: any) => {
                const meta = PILLAR_META[p.pillar]
                return (
                  <div key={p.pillar}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs font-mono flex items-center gap-2">
                        {meta?.icon} {meta?.label}
                        <span className="text-[10px] text-os-muted">({p.goalsCount} goals)</span>
                      </span>
                      <span className="text-[10px] font-mono" style={{ color: meta?.color }}>{p.avgProgress}%</span>
                    </div>
                    <ProgressBar value={p.avgProgress} color={meta?.color} size="md" />
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-xs font-mono text-os-muted">
              Create goals to see pillar breakdown
            </div>
          )}
        </Card>

        {/* Habit heatmap mini */}
        <Card>
          <CardHeader>
            <CardTitle>🟩 Habit Activity</CardTitle>
            <span className="text-[10px] font-mono text-os-muted">{totalHabitDays} active days</span>
          </CardHeader>
          {heatmap && Object.keys(heatmap).length > 0 ? (
            <div>
              <div className="flex flex-wrap gap-0.5">
                {Array.from({ length: 90 }, (_, i) => {
                  const d = new Date()
                  d.setDate(d.getDate() - (89 - i))
                  const key = d.toISOString().slice(0, 10)
                  const count = (heatmap as Record<string, number>)[key] || 0
                  const intensity = count / maxHabits
                  return (
                    <div key={key} title={`${key}: ${count} habits`}
                      className="w-2.5 h-2.5 rounded-sm"
                      style={{ background: count === 0 ? 'rgba(255,255,255,0.05)' : `rgba(100,255,218,${0.2 + intensity * 0.8})` }}
                    />
                  )
                })}
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-[9px] font-mono text-os-muted">Less</span>
                {[0.1, 0.3, 0.5, 0.7, 1.0].map(o => (
                  <div key={o} className="w-2.5 h-2.5 rounded-sm" style={{ background: `rgba(100,255,218,${o})` }} />
                ))}
                <span className="text-[9px] font-mono text-os-muted">More</span>
              </div>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-xs font-mono text-os-muted">
              Log habits to see your heatmap
            </div>
          )}
        </Card>
      </div>

      {/* Energy + habits today */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>⚡ Today's Energy</CardTitle></CardHeader>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ENERGY_META.map((e, i) => (
              <div key={i} className={`text-center p-3 rounded-lg border transition-all ${
                stats?.energyLevel === i ? 'border-current bg-current/10' : 'border-os-border opacity-40'
              }`} style={{ borderColor: stats?.energyLevel === i ? e.color : undefined, color: e.color }}>
                <div className="text-xl mb-1">{e.icon}</div>
                <div className="text-[9px] font-mono">{e.label}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader><CardTitle>💫 Today's Summary</CardTitle></CardHeader>
          <div className="space-y-3">
            {[
              { label: 'Tasks Completed', value: stats?.tasksDoneToday ?? 0, max: (stats?.tasksDoneToday ?? 0) + (stats?.tasksPendingCount ?? 1), color: '#22c55e' },
              { label: 'Habits Done', value: stats?.habitsCompletedToday ?? 0, max: stats?.totalHabits ?? 1, color: '#a78bfa' },
              { label: 'Goal Progress', value: stats?.overallGoalProgress ?? 0, max: 100, color: '#64ffda' },
            ].map(s => (
              <div key={s.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-mono text-os-muted">{s.label}</span>
                  <span className="text-[10px] font-mono" style={{ color: s.color }}>{s.value}{s.label === 'Goal Progress' ? '%' : `/${s.max}`}</span>
                </div>
                <ProgressBar value={s.max > 0 ? (s.value / s.max) * 100 : 0} color={s.color} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

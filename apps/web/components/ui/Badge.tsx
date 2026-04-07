import { cn } from '@/lib/utils'
import { PILLAR_META, PRIORITY_META } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  color?: string
  className?: string
}

export function Badge({ children, color = '#64748b', className }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono tracking-widest uppercase font-medium border', className)}
      style={{ color, background: `${color}18`, borderColor: `${color}30` }}
    >
      {children}
    </span>
  )
}

export function PillarBadge({ pillar }: { pillar: string }) {
  const meta = PILLAR_META[pillar] || { label: pillar, color: '#64748b', icon: '•' }
  return <Badge color={meta.color}>{meta.icon} {meta.label}</Badge>
}

export function PriorityBadge({ priority }: { priority: string }) {
  const meta = PRIORITY_META[priority] || { label: priority, color: '#64748b' }
  return <Badge color={meta.color}>{meta.label}</Badge>
}

export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ACTIVE: '#22c55e', COMPLETED: '#64ffda', PAUSED: '#f59e0b', ARCHIVED: '#64748b',
    TODO: '#64748b', IN_PROGRESS: '#00b4d8', DONE: '#22c55e', CANCELLED: '#ef4444',
  }
  return <Badge color={colors[status] || '#64748b'}>{status.replace('_', ' ')}</Badge>
}

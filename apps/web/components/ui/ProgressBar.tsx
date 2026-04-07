import { cn } from '@/lib/utils'
import { progressColor } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  color?: string
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}

export function ProgressBar({ value, color, size = 'sm', showLabel, className }: ProgressBarProps) {
  const c = color || progressColor(value)
  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full bg-white/5 rounded-full overflow-hidden', size === 'sm' ? 'h-1' : 'h-2')}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, value)}%`, background: c }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-end mt-1">
          <span className="text-[10px] font-mono" style={{ color: c }}>{value}%</span>
        </div>
      )}
    </div>
  )
}

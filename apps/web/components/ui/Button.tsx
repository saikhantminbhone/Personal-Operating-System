import { forwardRef, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-mono tracking-widest uppercase transition-all duration-150 rounded cursor-pointer border disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 touch-manipulation select-none',
        {
          'text-os-accent bg-os-accent/15 border-os-accent/20 hover:bg-os-accent/25': variant === 'primary',
          'text-os-muted bg-transparent border-os-border hover:border-os-accent/30 hover:text-os-text': variant === 'ghost',
          'text-os-danger bg-os-danger/10 border-os-danger/20 hover:bg-os-danger/20': variant === 'danger',
          'text-os-success bg-os-success/10 border-os-success/20 hover:bg-os-success/20': variant === 'success',
          'text-[10px] px-3 py-1.5 min-h-[36px]': size === 'sm',
          'text-[11px] px-4 py-2 min-h-[40px]': size === 'md',
          'text-xs px-5 py-2.5 min-h-[44px]': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-3 h-3 animate-spin" />}
      {children}
    </button>
  )
)
Button.displayName = 'Button'

import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-[10px] font-mono tracking-widest uppercase text-os-muted mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn('os-input', error && 'border-os-danger/50 focus:border-os-danger', className)}
        {...props}
      />
      {error && <p className="mt-1 text-[11px] text-os-danger font-mono">{error}</p>}
    </div>
  )
)
Input.displayName = 'Input'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, id, children, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-[10px] font-mono tracking-widest uppercase text-os-muted mb-1.5">
          {label}
        </label>
      )}
      <select ref={ref} id={id} className={cn('os-select', className)} {...props}>
        {children}
      </select>
    </div>
  )
)
Select.displayName = 'Select'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, id, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-[10px] font-mono tracking-widest uppercase text-os-muted mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={cn('os-input resize-none', className)}
        {...props}
      />
    </div>
  )
)
Textarea.displayName = 'Textarea'

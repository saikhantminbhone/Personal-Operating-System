'use client'
import { useState, useCallback } from 'react'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
}

export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean
    resolve: (v: boolean) => void
    opts: ConfirmOptions
  } | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => setState({ open: true, resolve, opts }))
  }, [])

  function handle(val: boolean) {
    state?.resolve(val)
    setState(null)
  }

  const dialog = state ? (
    <ConfirmDialog
      open={state.open}
      {...state.opts}
      onConfirm={() => handle(true)}
      onCancel={() => handle(false)}
    />
  ) : null

  return { confirm, dialog }
}

interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open, onCancel, onConfirm,
  title, description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel} size="sm">
      <div className="text-center space-y-4">
        <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center ${
          variant === 'danger' ? 'bg-os-danger/10' : 'bg-os-accent/10'
        }`}>
          {variant === 'danger'
            ? <Trash2 className="w-5 h-5 text-os-danger" />
            : <AlertTriangle className="w-5 h-5 text-os-accent" />}
        </div>
        <div>
          <p className="text-sm font-mono font-semibold text-os-text">{title}</p>
          {description && (
            <p className="text-[11px] font-mono text-os-muted mt-1">{description}</p>
          )}
        </div>
        <div className="flex gap-3 pt-1">
          <Button variant="ghost" className="flex-1" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={variant} className="flex-1" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  )
}

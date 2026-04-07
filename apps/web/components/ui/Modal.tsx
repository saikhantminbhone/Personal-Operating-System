'use client'
import { useEffect, ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = { sm: 400, md: 480, lg: 700 }

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [onClose])

  if (!open) return null

  const maxW = sizeMap[size]

  return (
    /* Container: bottom-sheet on mobile, centered on desktop */
    <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/75" />

      {/* Panel */}
      <div
        style={{ maxWidth: maxW }}
        className="relative z-10 w-full max-h-[92vh] overflow-y-auto bg-[#0D1520] border border-[rgba(100,255,218,0.15)] rounded-t-2xl sm:rounded-xl sm:mb-8"
      >
        {/* Mobile drag handle — hidden on sm+ screens */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-9 h-1 bg-[rgba(100,255,218,0.2)] rounded-full" />
        </div>

        {title && (
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgba(100,255,218,0.1)]">
            <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#64FFDA]">{title}</span>
            <button
              onClick={onClose}
              className="text-[#64748b] p-1.5 flex items-center justify-center min-w-[32px] min-h-[32px] hover:text-[#E2E8F0] transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  )
}

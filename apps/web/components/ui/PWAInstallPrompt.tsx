'use client'
import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Already running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Dismissed recently (7 days)
    const dismissedAt = localStorage.getItem('pwa-prompt-dismissed')
    if (dismissedAt && Date.now() - parseInt(dismissedAt) < 7 * 24 * 60 * 60 * 1000) return

    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    if (isIOSDevice) {
      setIsIOS(true)
      const timer = setTimeout(() => setShow(true), 4000)
      return () => clearTimeout(timer)
    }

    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      const timer = setTimeout(() => setShow(true), 4000)
      return () => clearTimeout(timer)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    setShow(false)
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
  }

  async function install() {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') { setShow(false); return }
    }
    dismiss()
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 z-[9998]">
      <div className="bg-os-surface border border-os-accent/20 rounded-xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-os-accent/10 border border-os-accent/20 flex items-center justify-center flex-shrink-0 text-lg">
            ⬡
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono font-semibold text-os-text">Install Saikhant OS</p>
            {isIOS ? (
              <p className="text-[10px] font-mono text-os-muted mt-1 leading-relaxed">
                Tap <span className="text-os-accent font-semibold">Share ↑</span> then{' '}
                <span className="text-os-accent font-semibold">Add to Home Screen</span> for offline access.
              </p>
            ) : (
              <>
                <p className="text-[10px] font-mono text-os-muted mt-1 leading-relaxed">
                  Add to your home screen for a native app experience with offline access.
                </p>
                <button
                  onClick={install}
                  className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 bg-os-accent/15 text-os-accent border border-os-accent/25 rounded-lg text-[10px] font-mono font-semibold hover:bg-os-accent/25 transition-all touch-manipulation"
                >
                  <Download className="w-3 h-3" /> Install App
                </button>
              </>
            )}
          </div>
          <button
            onClick={dismiss}
            className="text-os-muted hover:text-os-text p-1 flex-shrink-0 touch-manipulation"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

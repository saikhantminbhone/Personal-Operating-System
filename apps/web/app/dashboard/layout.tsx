'use client'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { CheckinModal } from '@/components/layout/CheckinModal'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { Toast } from '@/components/ui/Toast'
import { LogIn } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/auth/login')
  }, [status, router])

  useEffect(() => {
    function onExpired() { setSessionExpired(true) }
    window.addEventListener('session-expired', onExpired)
    return () => window.removeEventListener('session-expired', onExpired)
  }, [])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-os-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-os-accent/30 border-t-os-accent rounded-full animate-spin" />
          <p className="text-os-accent font-mono text-xs tracking-widest uppercase animate-pulse">
            Loading OS...
          </p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') return null

  return (
    <div className="min-h-screen bg-os-bg">
      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(100,255,218,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(100,255,218,0.025) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <Sidebar />
      <Topbar />

      {/* pt-14 = topbar height, sm:pl-60 = sidebar width on desktop */}
      <main className="pt-14 sm:pl-60 min-h-screen">
        <div className="p-4 sm:p-6 max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      <CheckinModal />
      <CommandPalette />
      <Toast />

      {/* Session expired overlay */}
      {sessionExpired && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80">
          <div className="bg-[#0D1520] border border-[rgba(100,255,218,0.2)] rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-[rgba(100,255,218,0.1)] flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-6 h-6 text-[#64FFDA]" />
            </div>
            <h2 className="text-sm font-mono font-bold text-[#E2E8F0] mb-2 tracking-wide">Session Expired</h2>
            <p className="text-xs font-mono text-[#64748b] mb-6 leading-relaxed">
              Your session has expired. Please sign in again to continue.
            </p>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
              className="w-full py-3 rounded-xl bg-[#64FFDA] text-[#080C12] font-mono font-bold text-sm tracking-wide hover:bg-[#4de8c2] transition-colors"
            >
              Sign In Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useAppStore } from '@/store/useAppStore'
import { useDashboardStats } from '@/hooks/useAnalytics'
import { ENERGY_META } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { NotificationBell } from './NotificationBell'
import { Zap, Search, Menu } from 'lucide-react'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/goals': 'Goals & OKRs',
  '/dashboard/tasks': 'Tasks',
  '/dashboard/habits': 'Habits',
  '/dashboard/knowledge': 'Knowledge',
  '/dashboard/finance': 'Finance',
  '/dashboard/projects': 'Projects',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/ai': 'AI Assistant',
  '/dashboard/billing': 'Billing',
  '/dashboard/team': 'Team',
  '/dashboard/api-keys': 'API Keys',
  '/dashboard/settings': 'Settings',
}

function openMobileSidebar() {
  const overlay = document.getElementById('mobile-sidebar-overlay')
  const drawer = document.getElementById('mobile-sidebar-drawer')
  if (overlay) overlay.style.display = 'block'
  if (drawer) drawer.style.transform = 'translateX(0)'
}

export function Topbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { setModal } = useAppStore()
  const { data: stats } = useDashboardStats()

  const title = PAGE_TITLES[pathname] || 'Dashboard'
  const energy = (stats?.energyLevel !== null && stats?.energyLevel !== undefined)
    ? ENERGY_META[stats.energyLevel] : null
  const checkedInToday = !!stats?.lastCheckinAt &&
    new Date(stats.lastCheckinAt as string).toDateString() === new Date().toDateString()

  return (
    <header className="fixed top-0 right-0 left-0 sm:left-60 h-14 bg-os-bg/90 backdrop-blur-md border-b border-os-border flex items-center justify-between px-4 sm:px-6 z-30 transition-all duration-300">
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button onClick={openMobileSidebar}
          className="sm:hidden p-2 text-os-muted hover:text-os-text rounded-lg touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center">
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-sm font-mono font-semibold text-os-text tracking-wide">{title}</h1>
          <div className="hidden sm:flex items-center gap-3 mt-0.5">
            {stats && <span className="text-[10px] font-mono text-os-muted">🔥 {stats.streakCount} day streak</span>}
            {energy && <span className="text-[10px] font-mono" style={{ color: energy.color }}>{energy.icon} {energy.label}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Search - hidden on very small screens */}
        <button onClick={() => setModal('command')}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/[0.03] border border-os-border rounded-lg text-os-muted hover:text-os-text hover:border-os-accent/20 transition-all touch-manipulation">
          <Search className="w-3.5 h-3.5" />
          <span className="text-[11px] font-mono">Search...</span>
          <kbd className="text-[9px] font-mono px-1 py-0.5 rounded border border-os-border bg-white/[0.05]">⌘K</kbd>
        </button>

        {/* Search icon only on mobile */}
        <button onClick={() => setModal('command')}
          className="md:hidden p-2 text-os-muted hover:text-os-text rounded-lg touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center">
          <Search className="w-4 h-4" />
        </button>

        <NotificationBell />

        <Button size="sm" variant={checkedInToday ? 'ghost' : 'primary'} onClick={() => setModal('checkin')}
          className="touch-manipulation min-h-[36px]">
          <Zap className="w-3 h-3" />
          <span className="hidden sm:inline">{checkedInToday ? 'Checked In ✓' : 'Check In'}</span>
        </Button>

        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-os-accent/20 flex items-center justify-center text-xs font-mono text-os-accent ring-1 ring-os-border flex-shrink-0">
          {session?.user?.name?.[0]?.toUpperCase() || 'S'}
        </div>
      </div>
    </header>
  )
}

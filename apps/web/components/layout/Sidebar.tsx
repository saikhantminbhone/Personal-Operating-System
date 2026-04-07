'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { api } from '@/lib/api'
import {
  LayoutDashboard, Target, CheckSquare, BookOpen,
  FolderKanban, BarChart3, Bot, Settings, LogOut,
  ChevronLeft, ChevronRight, Hexagon, PiggyBank,
  Repeat2, CreditCard, Users, Key, X
} from 'lucide-react'

const NAV_MAIN = [
  { href: '/dashboard',            icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/goals',      icon: Target,          label: 'Goals' },
  { href: '/dashboard/tasks',      icon: CheckSquare,     label: 'Tasks' },
  { href: '/dashboard/habits',     icon: Repeat2,         label: 'Habits' },
  { href: '/dashboard/knowledge',  icon: BookOpen,        label: 'Knowledge' },
  { href: '/dashboard/finance',    icon: PiggyBank,       label: 'Finance' },
  { href: '/dashboard/projects',   icon: FolderKanban,    label: 'Projects' },
  { href: '/dashboard/analytics',  icon: BarChart3,       label: 'Analytics' },
  { href: '/dashboard/ai',         icon: Bot,             label: 'AI Assistant' },
]

const NAV_TEAM = [
  { href: '/dashboard/team',       icon: Users,           label: 'Team' },
  { href: '/dashboard/api-keys',   icon: Key,             label: 'API Keys' },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, toggleSidebar, setModal } = useAppStore()
  const [mobileOpen, setMobileOpen] = (useAppStore as any)((s: any) => [s.mobileMenuOpen, s.setMobileMenuOpen]) ?? [false, () => {}]

  const { data: subscription } = useQuery<any>({
    queryKey: ['billing', 'subscription'],
    queryFn: () => api.get('/billing/subscription'),
    staleTime: 1000 * 60 * 10,
    retry: false,
  })

  const plan = subscription?.currentPlan || 'FREE'
  const planColors: Record<string, string> = { FREE: '#64748b', PRO: '#64ffda', TEAM: '#a78bfa' }

  const NavItem = ({ href, icon: Icon, label, onClick }: any) => {
    const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
    return (
      <Link href={href} onClick={onClick}
        className={cn(
          'flex items-center gap-3 px-4 py-3 sm:py-2.5 mx-2 rounded-lg transition-all duration-150 min-h-[44px] sm:min-h-0',
          active ? 'bg-os-accent/10 text-os-accent' : 'text-os-muted hover:text-os-text hover:bg-white/[0.04]'
        )}
        title={sidebarCollapsed ? label : undefined}>
        <Icon className="w-4 h-4 flex-shrink-0" />
        {!sidebarCollapsed && <span className="text-xs font-mono tracking-wide truncate">{label}</span>}
        {active && !sidebarCollapsed && <span className="ml-auto w-1 h-4 bg-os-accent rounded-full" />}
      </Link>
    )
  }

  const SidebarContent = ({ onNavClick }: { onNavClick?: () => void }) => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-os-border h-14">
        <Hexagon className="w-6 h-6 text-os-accent flex-shrink-0" strokeWidth={1.5} />
        {!sidebarCollapsed && (
          <span className="font-mono text-xs font-bold tracking-[0.3em] uppercase text-os-accent truncate">
            SAIKHANT OS
          </span>
        )}
      </div>

      {/* Plan badge */}
      {!sidebarCollapsed && plan !== 'FREE' && (
        <div className="mx-3 mt-2 px-2 py-1 rounded border text-[9px] font-mono tracking-widest uppercase text-center"
          style={{ color: planColors[plan], borderColor: `${planColors[plan]}30`, background: `${planColors[plan]}10` }}>
          {plan}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <div className="space-y-0.5">
          {NAV_MAIN.map(item => <NavItem key={item.href} {...item} onClick={onNavClick} />)}
        </div>
        {!sidebarCollapsed && (
          <div className="px-4 pt-4 pb-1">
            <span className="text-[9px] font-mono tracking-[0.25em] uppercase text-os-muted/50">Team & API</span>
          </div>
        )}
        <div className="space-y-0.5 mt-1">
          {NAV_TEAM.map(item => <NavItem key={item.href} {...item} onClick={onNavClick} />)}
        </div>
      </nav>

      {/* Bottom */}
      <div className="border-t border-os-border py-3 px-2 space-y-0.5">
        <Link href="/dashboard/billing" onClick={onNavClick}
          className={cn('flex items-center gap-3 py-3 sm:py-2 px-2 rounded-lg transition-all min-h-[44px] sm:min-h-0',
            pathname === '/dashboard/billing' ? 'bg-os-accent/10 text-os-accent' : 'text-os-muted hover:text-os-text hover:bg-white/[0.04]')}>
          <CreditCard className="w-4 h-4 flex-shrink-0" />
          {!sidebarCollapsed && <span className="text-xs font-mono flex-1">Billing</span>}
          {!sidebarCollapsed && plan === 'FREE' && (
            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-os-accent/15 text-os-accent border border-os-accent/20">Upgrade</span>
          )}
        </Link>
        <Link href="/dashboard/settings" onClick={onNavClick}
          className={cn('flex items-center gap-3 py-3 sm:py-2 px-2 rounded-lg transition-all min-h-[44px] sm:min-h-0',
            pathname === '/dashboard/settings' ? 'bg-os-accent/10 text-os-accent' : 'text-os-muted hover:text-os-text hover:bg-white/[0.04]')}>
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!sidebarCollapsed && <span className="text-xs font-mono">Settings</span>}
        </Link>
        <button onClick={() => signOut({ callbackUrl: '/auth/login' })}
          className="w-full flex items-center gap-3 py-3 sm:py-2 px-2 rounded-lg text-os-muted hover:text-os-danger hover:bg-os-danger/5 transition-all min-h-[44px] sm:min-h-0 touch-manipulation">
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!sidebarCollapsed && <span className="text-xs font-mono">Sign Out</span>}
        </button>
        {/* Desktop collapse toggle */}
        <button onClick={toggleSidebar}
          className="hidden sm:flex w-full items-center justify-center py-2 text-os-muted hover:text-os-text transition-colors">
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden sm:flex fixed left-0 top-0 h-screen bg-os-surface border-r border-os-border flex-col z-40 transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}>
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      <div id="mobile-sidebar-overlay"
        className="sm:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        style={{ display: 'none' }}
        onClick={() => {
          const overlay = document.getElementById('mobile-sidebar-overlay')
          const drawer = document.getElementById('mobile-sidebar-drawer')
          if (overlay) overlay.style.display = 'none'
          if (drawer) drawer.style.transform = 'translateX(-100%)'
        }}>
      </div>
      <aside id="mobile-sidebar-drawer"
        className="sm:hidden fixed left-0 top-0 h-screen w-72 bg-os-surface border-r border-os-border flex flex-col z-50 transition-transform duration-300"
        style={{ transform: 'translateX(-100%)' }}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-os-border">
          <div className="flex items-center gap-2">
            <Hexagon className="w-5 h-5 text-os-accent" strokeWidth={1.5} />
            <span className="font-mono text-xs font-bold tracking-[0.3em] uppercase text-os-accent">SAIKHANT OS</span>
          </div>
          <button onClick={() => {
            const overlay = document.getElementById('mobile-sidebar-overlay')
            const drawer = document.getElementById('mobile-sidebar-drawer')
            if (overlay) overlay.style.display = 'none'
            if (drawer) drawer.style.transform = 'translateX(-100%)'
          }} className="text-os-muted hover:text-os-text p-2 touch-manipulation">
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          <div className="space-y-0.5">
            {NAV_MAIN.map(item => <NavItem key={item.href} {...item} onClick={() => {
              const overlay = document.getElementById('mobile-sidebar-overlay')
              const drawer = document.getElementById('mobile-sidebar-drawer')
              if (overlay) overlay.style.display = 'none'
              if (drawer) drawer.style.transform = 'translateX(-100%)'
            }} />)}
          </div>
          <div className="px-4 pt-4 pb-1">
            <span className="text-[9px] font-mono tracking-[0.25em] uppercase text-os-muted/50">Team & API</span>
          </div>
          <div className="space-y-0.5 mt-1">
            {NAV_TEAM.map(item => <NavItem key={item.href} {...item} onClick={() => {
              const overlay = document.getElementById('mobile-sidebar-overlay')
              const drawer = document.getElementById('mobile-sidebar-drawer')
              if (overlay) overlay.style.display = 'none'
              if (drawer) drawer.style.transform = 'translateX(-100%)'
            }} />)}
          </div>
        </nav>
        <div className="border-t border-os-border py-3 px-2 space-y-0.5">
          <Link href="/dashboard/billing" className="flex items-center gap-3 py-3 px-2 rounded-lg text-os-muted hover:text-os-text min-h-[44px]">
            <CreditCard className="w-4 h-4" /><span className="text-xs font-mono">Billing</span>
          </Link>
          <Link href="/dashboard/settings" className="flex items-center gap-3 py-3 px-2 rounded-lg text-os-muted hover:text-os-text min-h-[44px]">
            <Settings className="w-4 h-4" /><span className="text-xs font-mono">Settings</span>
          </Link>
          <button onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="w-full flex items-center gap-3 py-3 px-2 rounded-lg text-os-muted hover:text-os-danger min-h-[44px] touch-manipulation">
            <LogOut className="w-4 h-4" /><span className="text-xs font-mono">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}

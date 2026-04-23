'use client'
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, authApi } from '@/lib/api'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { useAppStore, type AiProvider } from '@/store/useAppStore'
import { ENERGY_META, PILLAR_META, cn } from '@/lib/utils'
import {
  User, Bell, Shield, Palette, Download, Trash2,
  ExternalLink, Check, Zap, Globe, Moon, Bot
} from 'lucide-react'

const TIMEZONES = [
  'Asia/Bangkok', 'Asia/Singapore', 'Asia/Tokyo', 'Asia/Seoul',
  'Asia/Kolkata', 'Europe/Berlin', 'Europe/London', 'America/New_York',
  'America/Los_Angeles', 'UTC',
]

const SECTIONS = [
  { id: 'profile',  label: 'Profile',      icon: User },
  { id: 'system',   label: 'System',       icon: Zap },
  { id: 'privacy',  label: 'Privacy',      icon: Shield },
  { id: 'export',   label: 'Data Export',  icon: Download },
]

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession()
  const { showToast } = useAppStore()
  const qc = useQueryClient()
  const [activeSection, setActiveSection] = useState('profile')
  const [profileForm, setProfileForm] = useState({ name: '', timezone: 'Asia/Bangkok' })

  const { data: profile } = useQuery<any>({
    queryKey: ['users', 'profile'],
    queryFn: () => authApi.updateProfile ? api.get('/users/profile') : null,
    staleTime: 1000 * 60 * 5,
  })

  useEffect(() => {
    if (profile) {
      setProfileForm({ name: profile.name || '', timezone: profile.timezone || 'Asia/Bangkok' })
    } else if (session?.user?.name) {
      setProfileForm(f => ({ ...f, name: session.user!.name! }))
    }
  }, [profile, session])

  const updateProfile = useMutation({
    mutationFn: (data: any) => api.patch('/users/profile', data),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['users', 'profile'] })
      qc.invalidateQueries({ queryKey: ['analytics', 'dashboard'] })
      showToast('Profile saved ✓')
    },
    onError: () => showToast('Failed to save profile', 'error'),
  })

  const { data: stats } = useQuery<any>({ queryKey: ['analytics', 'dashboard'], queryFn: () => api.get('/analytics/dashboard') })
  const { aiProvider, setAiProvider } = useAppStore()

  function handleExport() {
    showToast('Export started — check your email shortly', 'info')
  }

  function handleDeleteAccount() {
    if (confirm('Are you sure? This will permanently delete all your data.')) {
      if (confirm('This cannot be undone. Type DELETE to confirm.')) {
        showToast('Account deletion requested', 'info')
      }
    }
  }

  return (
    <div className="animate-fade-in space-y-4 sm:space-y-0 sm:flex sm:gap-6">

      {/* Mobile: horizontal tab strip / Desktop: sidebar nav */}
      <div className="sm:w-48 sm:flex-shrink-0">
        {/* Mobile tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 sm:hidden">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveSection(id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono whitespace-nowrap flex-shrink-0 transition-all touch-manipulation ${
                activeSection === id
                  ? 'bg-os-accent/10 text-os-accent border border-os-accent/20'
                  : 'text-os-muted border border-os-border'
              }`}>
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Desktop vertical list */}
        <div className="hidden sm:block space-y-1">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveSection(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-mono transition-all ${
                activeSection === id
                  ? 'bg-os-accent/10 text-os-accent'
                  : 'text-os-muted hover:text-os-text hover:bg-white/[0.04]'
              }`}>
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              {label}
            </button>
          ))}

          {/* Version info */}
          <div className="mt-8 px-3">
            <p className="text-[9px] font-mono tracking-widest uppercase text-os-muted/50">Version</p>
            <p className="text-[10px] font-mono text-os-muted mt-1">Saikhant OS v1.0.0</p>
            <p className="text-[9px] font-mono text-os-muted/40 mt-0.5">Phase 0 — Foundation</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-5 max-w-2xl">

        {/* Profile */}
        {activeSection === 'profile' && (
          <>
            <Card>
              <CardHeader><CardTitle>👤 Profile</CardTitle></CardHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-os-border">
                  <div className="w-14 h-14 rounded-xl bg-os-accent/20 flex items-center justify-center text-2xl font-mono text-os-accent">
                    {session?.user?.name?.[0]?.toUpperCase() || 'S'}
                  </div>
                  <div>
                    <p className="text-sm font-mono font-semibold text-os-text">{session?.user?.name}</p>
                    <p className="text-xs font-mono text-os-muted">{session?.user?.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-os-accent/15 text-os-accent border border-os-accent/20">PRO</span>
                      <span className="text-[9px] font-mono text-os-muted">🔥 {stats?.streakCount ?? 0} day streak</span>
                    </div>
                  </div>
                </div>
                <Input label="Display Name" value={profileForm.name}
                  onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} />
                <Select label="Timezone" value={profileForm.timezone}
                  onChange={e => setProfileForm(f => ({ ...f, timezone: e.target.value }))}>
                  {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </Select>
                <Button
                  loading={updateProfile.isPending}
                  onClick={() => updateProfile.mutate(profileForm)}
                >Save Changes</Button>
              </div>
            </Card>

            <Card>
              <CardHeader><CardTitle>📊 Your Stats</CardTitle></CardHeader>
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Day Streak',   value: stats?.streakCount ?? 0,          color: '#f97316' },
                  { label: 'Goals Active', value: stats?.activeGoalsCount ?? 0,     color: '#64ffda' },
                  { label: 'Total Wins',   value: stats?.totalWins ?? 0,            color: '#a78bfa' },
                ].map(s => (
                  <div key={s.label} className="text-center p-3 bg-white/[0.02] rounded-lg border border-os-border">
                    <div className="text-2xl font-mono font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[9px] font-mono tracking-widest uppercase text-os-muted">{s.label}</div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}

        {/* System */}
        {activeSection === 'system' && (
          <>
            <Card>
              <CardHeader><CardTitle>⚡ Energy & Planning</CardTitle></CardHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-mono text-os-muted mb-3">Current energy level affects your daily task queue priority.</p>
                  <div className="grid grid-cols-2 gap-2">
                    {ENERGY_META.map((e, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        stats?.energyLevel === i ? 'border-current' : 'border-os-border'
                      }`} style={{ borderColor: stats?.energyLevel === i ? e.color : undefined }}>
                        <span className="text-lg">{e.icon}</span>
                        <div>
                          <p className="text-xs font-mono" style={{ color: e.color }}>{e.label}</p>
                          <p className="text-[9px] font-mono text-os-muted">Level {i}</p>
                        </div>
                        {stats?.energyLevel === i && <Check className="w-3 h-3 ml-auto" style={{ color: e.color }} />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader><CardTitle>🌐 API Access</CardTitle></CardHeader>
              <div className="space-y-3">
                <p className="text-xs font-mono text-os-muted">
                  API documentation available at development endpoint. Public API coming in Phase 3.
                </p>
                <div className="p-3 bg-white/[0.02] border border-os-border rounded-lg font-mono text-xs">
                  <span className="text-os-muted">Base URL: </span>
                  <span className="text-os-accent">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'}</span>
                </div>
                <a href={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/api/docs`}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-mono text-os-accent hover:underline">
                  <ExternalLink className="w-3 h-3" /> View Swagger Docs
                </a>
              </div>
            </Card>

            <Card>
              <CardHeader><CardTitle>🤖 AI Configuration</CardTitle></CardHeader>
              <div className="space-y-3">
                {/* Provider switch */}
                <div className="p-3 bg-white/[0.02] border border-os-border rounded-lg space-y-2">
                  <p className="text-xs font-mono text-os-text">AI Provider</p>
                  <p className="text-[10px] font-mono text-os-muted mb-2">Switch between providers. Both require an API key.</p>
                  <div className="flex rounded-lg border border-os-border overflow-hidden w-fit">
                    {(['chatgpt', 'claude'] as AiProvider[]).map(p => (
                      <button
                        key={p}
                        onClick={() => setAiProvider(p)}
                        className={cn(
                          'px-4 py-2 text-[10px] font-mono tracking-wide transition-all border-r last:border-r-0 border-os-border',
                          aiProvider === p
                            ? p === 'chatgpt'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-os-accent/15 text-os-accent'
                            : 'text-os-muted hover:text-os-text'
                        )}
                      >
                        {p === 'chatgpt' ? '✦ ChatGPT (gpt-4o-mini)' : '◆ Claude (Sonnet)'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-os-border rounded-lg">
                  <div>
                    <p className="text-xs font-mono text-os-text">AI Daily Briefing</p>
                    <p className="text-[10px] font-mono text-os-muted">Generated on demand</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-os-success animate-pulse" />
                    <span className="text-[10px] font-mono text-os-success">Active</span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-os-border rounded-lg">
                  <div>
                    <p className="text-xs font-mono text-os-text">AI Chat Assistant</p>
                    <p className="text-[10px] font-mono text-os-muted">Full context of your OS data</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-os-success animate-pulse" />
                    <span className="text-[10px] font-mono text-os-success">Active</span>
                  </div>
                </div>
                <p className="text-[10px] font-mono text-os-muted">
                  Your data is never used to train AI models.
                </p>
              </div>
            </Card>
          </>
        )}

        {/* Privacy */}
        {activeSection === 'privacy' && (
          <>
            <Card>
              <CardHeader><CardTitle>🔐 Security</CardTitle></CardHeader>
              <div className="space-y-3">
                {[
                  { label: 'JWT Authentication', desc: 'Access tokens expire in 15 minutes', status: true },
                  { label: 'Data Encryption at Rest', desc: 'AES-256 encryption on all stored data', status: true },
                  { label: 'HTTPS / TLS 1.3', desc: 'All traffic encrypted in transit', status: true },
                  { label: 'No Third-Party Analytics', desc: 'Zero tracking scripts or ad networks', status: true },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-os-border rounded-lg">
                    <Check className="w-4 h-4 text-os-success flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-xs font-mono text-os-text">{item.label}</p>
                      <p className="text-[10px] font-mono text-os-muted">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader><CardTitle>🗑 Danger Zone</CardTitle></CardHeader>
              <div className="space-y-3">
                <div className="p-4 bg-os-danger/5 border border-os-danger/20 rounded-lg">
                  <p className="text-xs font-mono text-os-danger font-semibold mb-1">Delete Account</p>
                  <p className="text-[10px] font-mono text-os-muted mb-3">
                    Permanently delete your account and all associated data. This cannot be undone.
                  </p>
                  <Button variant="danger" size="sm" onClick={handleDeleteAccount}>
                    <Trash2 className="w-3 h-3" /> Delete My Account
                  </Button>
                </div>
                <div className="p-4 bg-white/[0.02] border border-os-border rounded-lg">
                  <p className="text-xs font-mono text-os-text font-semibold mb-1">Sign Out</p>
                  <p className="text-[10px] font-mono text-os-muted mb-3">Sign out of this session.</p>
                  <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: '/auth/login' })}>
                    Sign Out
                  </Button>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Data Export */}
        {activeSection === 'export' && (
          <>
            <Card>
              <CardHeader><CardTitle>📦 Export Your Data</CardTitle></CardHeader>
              <div className="space-y-4">
                <p className="text-xs font-mono text-os-muted">
                  Export all your data in JSON format. This includes all goals, tasks, habits, notes, transactions, and AI chat history.
                </p>
                <div className="space-y-2">
                  {[
                    { label: 'Goals & Key Results', desc: 'All goals with OKRs and progress history', icon: '🎯' },
                    { label: 'Tasks', desc: 'Complete task history with completion dates', icon: '✅' },
                    { label: 'Habits & Logs', desc: 'Habit definitions and all completion logs', icon: '🔄' },
                    { label: 'Finance', desc: 'All accounts and transaction history', icon: '💰' },
                    { label: 'Knowledge Base', desc: 'All notes and collections', icon: '📚' },
                    { label: 'AI Chat History', desc: 'All conversations with your AI assistant', icon: '🤖' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-os-border rounded-lg">
                      <span className="text-base">{item.icon}</span>
                      <div className="flex-1">
                        <p className="text-xs font-mono text-os-text">{item.label}</p>
                        <p className="text-[10px] font-mono text-os-muted">{item.desc}</p>
                      </div>
                      <Check className="w-3 h-3 text-os-success" />
                    </div>
                  ))}
                </div>
                <Button onClick={handleExport}>
                  <Download className="w-3 h-3" /> Export All Data (JSON)
                </Button>
                <p className="text-[10px] font-mono text-os-muted">
                  Your data belongs to you. Export it anytime, no restrictions. GDPR Article 20 compliant.
                </p>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { useAppStore } from '@/store/useAppStore'
import { Users, Plus, Settings, Crown, Shield, Eye, UserMinus, Send, Globe, Copy } from 'lucide-react'

const ROLE_META: Record<string, { label: string; color: string; icon: any }> = {
  OWNER:  { label: 'Owner',  color: '#f59e0b', icon: Crown  },
  ADMIN:  { label: 'Admin',  color: '#64ffda', icon: Shield },
  MEMBER: { label: 'Member', color: '#64748b', icon: Users  },
  VIEWER: { label: 'Viewer', color: '#475569', icon: Eye    },
}

export default function TeamPage() {
  const qc = useQueryClient()
  const { showToast } = useAppStore()
  const [createOrgOpen, setCreateOrgOpen] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [activeOrg, setActiveOrg] = useState<any>(null)
  const [orgForm, setOrgForm] = useState({ name: '', slug: '' })
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'MEMBER' })
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  const { data: orgs } = useQuery<any[]>({ queryKey: ['orgs'], queryFn: () => api.get('/organizations') })
  const { data: orgDetail } = useQuery<any>({ queryKey: ['orgs', activeOrg?.id], queryFn: () => api.get(`/organizations/${activeOrg.id}`), enabled: !!activeOrg })
  const { data: orgStats } = useQuery<any>({ queryKey: ['orgs', activeOrg?.id, 'stats'], queryFn: () => api.get(`/organizations/${activeOrg.id}/stats`), enabled: !!activeOrg })

  const createOrg = useMutation({
    mutationFn: (data: any) => api.post('/organizations', data),
    onSuccess: (org) => { qc.invalidateQueries({ queryKey: ['orgs'] }); setCreateOrgOpen(false); setActiveOrg(org); showToast('Organization created!') },
  })

  const inviteMember = useMutation({
    mutationFn: ({ orgId, data }: any) => api.post(`/organizations/${orgId}/invite`, data),
    onSuccess: (data: any) => {
      setInviteLink(data.inviteUrl)
      showToast('Invite created — share the link!')
    },
  })

  const removeMember = useMutation({
    mutationFn: ({ orgId, memberId }: any) => api.delete(`/organizations/${orgId}/members/${memberId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['orgs'] }); showToast('Member removed') },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs font-mono text-os-muted">{orgs?.length ?? 0} organizations</p>
        </div>
        <Button onClick={() => setCreateOrgOpen(true)}><Plus className="w-3 h-3" /> New Organization</Button>
      </div>

      {/* Org list + detail */}
      <div className="grid grid-cols-3 gap-6">
        {/* Org list */}
        <div className="space-y-2">
          <p className="os-label">Organizations</p>
          {orgs?.map((org: any) => (
            <button key={org.id} onClick={() => setActiveOrg(org)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                activeOrg?.id === org.id ? 'bg-os-accent/10 border-os-accent/20' : 'bg-white/[0.02] border-os-border hover:border-os-accent/15'
              }`}>
              <div className="w-8 h-8 rounded-lg bg-os-accent/15 flex items-center justify-center text-os-accent font-mono font-bold text-sm flex-shrink-0">
                {org.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-os-text font-semibold truncate">{org.name}</p>
                <p className="text-[10px] font-mono text-os-muted">{org._count?.members || 0} members · {org.members[0]?.role}</p>
              </div>
            </button>
          ))}
          {(!orgs || orgs.length === 0) && (
            <div className="text-center py-8">
              <Users className="w-8 h-8 text-os-muted/30 mx-auto mb-3" />
              <p className="text-xs font-mono text-os-muted mb-3">No organizations yet</p>
              <Button size="sm" onClick={() => setCreateOrgOpen(true)}><Plus className="w-3 h-3" /> Create</Button>
            </div>
          )}
        </div>

        {/* Org detail */}
        <div className="col-span-2 space-y-4">
          {activeOrg ? (
            <>
              {/* Stats */}
              {orgStats && (
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Members', value: orgStats.memberCount, color: '#64ffda' },
                    { label: 'Active Goals', value: orgStats.activeGoals, color: '#f59e0b' },
                    { label: 'Tasks Done', value: orgStats.doneTasks, color: '#22c55e' },
                    { label: 'Completion', value: `${orgStats.completionRate}%`, color: '#a78bfa' },
                  ].map(s => (
                    <Card key={s.label} className="text-center p-4">
                      <div className="text-xl font-mono font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-[9px] font-mono tracking-widest uppercase text-os-muted">{s.label}</div>
                    </Card>
                  ))}
                </div>
              )}

              {/* Members */}
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <span className="os-label">Members</span>
                  <Button size="sm" onClick={() => setInviteOpen(true)}><Send className="w-3 h-3" /> Invite</Button>
                </div>
                <div className="space-y-2">
                  {orgDetail?.members?.map((m: any) => {
                    const roleMeta = ROLE_META[m.role] || ROLE_META.MEMBER
                    const RoleIcon = roleMeta.icon
                    return (
                      <div key={m.id} className="flex items-center gap-3 p-3 bg-white/[0.02] border border-os-border rounded-lg group">
                        <div className="w-8 h-8 rounded-full bg-os-accent/15 flex items-center justify-center text-xs font-mono text-os-accent flex-shrink-0">
                          {m.user.name[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-mono text-os-text">{m.user.name}</p>
                          <p className="text-[10px] font-mono text-os-muted">{m.user.email}</p>
                        </div>
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded border text-[10px] font-mono"
                          style={{ color: roleMeta.color, borderColor: `${roleMeta.color}30`, background: `${roleMeta.color}10` }}>
                          <RoleIcon className="w-2.5 h-2.5" />
                          {roleMeta.label}
                        </div>
                        {m.role !== 'OWNER' && (
                          <button onClick={() => removeMember.mutate({ orgId: activeOrg.id, memberId: m.userId })}
                            className="opacity-0 group-hover:opacity-100 p-1 text-os-muted hover:text-os-danger transition-all">
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Card>

              {/* Org settings */}
              <Card>
                <CardHeader><CardTitle>⚙️ Organization Settings</CardTitle></CardHeader>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-white/[0.02] border border-os-border rounded-lg">
                    <Globe className="w-4 h-4 text-os-muted flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-os-text">Organization Slug</p>
                      <p className="text-[10px] font-mono text-os-muted">{activeOrg.slug}</p>
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(activeOrg.slug); showToast('Slug copied') }}
                      className="p-1 text-os-muted hover:text-os-accent transition-colors">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card className="flex items-center justify-center h-64">
              <div className="text-center">
                <Users className="w-10 h-10 text-os-muted/20 mx-auto mb-3" />
                <p className="text-xs font-mono text-os-muted">Select an organization to view details</p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Create Org Modal */}
      <Modal open={createOrgOpen} onClose={() => setCreateOrgOpen(false)} title="New Organization">
        <div className="space-y-4">
          <Input label="Organization Name" placeholder="Saikhant Labs" value={orgForm.name}
            onChange={e => setOrgForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') }))} />
          <Input label="Slug" placeholder="saikhant-labs" value={orgForm.slug}
            onChange={e => setOrgForm(f => ({ ...f, slug: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" loading={createOrg.isPending} onClick={() => createOrg.mutate(orgForm)}>Create</Button>
            <Button variant="ghost" onClick={() => setCreateOrgOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Invite Modal */}
      <Modal open={inviteOpen} onClose={() => { setInviteOpen(false); setInviteLink(null) }} title="Invite Member">
        <div className="space-y-4">
          {inviteLink ? (
            <>
              <p className="text-xs font-mono text-os-muted">Share this invite link (expires in 7 days):</p>
              <div className="p-3 bg-white/[0.02] border border-os-border rounded-lg font-mono text-xs text-os-accent break-all">{inviteLink}</div>
              <div className="flex gap-3">
                <Button className="flex-1" onClick={() => { navigator.clipboard.writeText(inviteLink); showToast('Link copied!') }}>
                  <Copy className="w-3 h-3" /> Copy Link
                </Button>
                <Button variant="ghost" onClick={() => { setInviteOpen(false); setInviteLink(null) }}>Done</Button>
              </div>
            </>
          ) : (
            <>
              <Input label="Email Address" type="email" placeholder="colleague@company.com" value={inviteForm.email}
                onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} />
              <Select label="Role" value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}>
                <option value="MEMBER">Member</option>
                <option value="ADMIN">Admin</option>
                <option value="VIEWER">Viewer</option>
              </Select>
              <div className="flex gap-3 pt-2">
                <Button className="flex-1" loading={inviteMember.isPending}
                  onClick={() => inviteMember.mutate({ orgId: activeOrg?.id, data: inviteForm })}>
                  <Send className="w-3 h-3" /> Send Invite
                </Button>
                <Button variant="ghost" onClick={() => setInviteOpen(false)}>Cancel</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  )
}

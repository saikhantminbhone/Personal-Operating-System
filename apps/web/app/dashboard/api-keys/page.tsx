'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { useAppStore } from '@/store/useAppStore'
import { Key, Plus, Trash2, Copy, Eye, EyeOff, Clock, Check } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

const SCOPES_META: Record<string, { desc: string; color: string }> = {
  'goals:read':     { desc: 'Read goals & key results', color: '#64ffda' },
  'goals:write':    { desc: 'Create & update goals',    color: '#64ffda' },
  'tasks:read':     { desc: 'Read tasks',               color: '#a78bfa' },
  'tasks:write':    { desc: 'Create & update tasks',    color: '#a78bfa' },
  'analytics:read': { desc: 'Read analytics data',      color: '#f59e0b' },
  'habits:read':    { desc: 'Read habits & logs',       color: '#22c55e' },
}

export default function ApiKeysPage() {
  const qc = useQueryClient()
  const { showToast } = useAppStore()
  const [createOpen, setCreateOpen] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', scopes: [] as string[], expiresInDays: '' })

  const { data: keys } = useQuery<any[]>({ queryKey: ['api-keys'], queryFn: () => api.get('/api-keys') })
  const { data: scopeData } = useQuery<any>({ queryKey: ['api-keys', 'scopes'], queryFn: () => api.get('/api-keys/scopes') })

  const createKey = useMutation({
    mutationFn: (data: any) => api.post('/api-keys', data),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['api-keys'] })
      setNewKey(data.key)
      showToast('API key created — copy it now, it won\'t be shown again!')
    },
  })

  const revokeKey = useMutation({
    mutationFn: (id: string) => api.delete(`/api-keys/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['api-keys'] }); showToast('Key revoked') },
  })

  function toggleScope(scope: string) {
    setForm(f => ({
      ...f,
      scopes: f.scopes.includes(scope) ? f.scopes.filter(s => s !== scope) : [...f.scopes, scope],
    }))
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex justify-between items-center">
        <p className="text-xs font-mono text-os-muted">{keys?.length ?? 0} active keys</p>
        <Button onClick={() => { setCreateOpen(true); setNewKey(null) }}>
          <Plus className="w-3 h-3" /> Create API Key
        </Button>
      </div>

      {/* Usage guide */}
      <Card>
        <CardHeader><CardTitle>🔌 API Usage</CardTitle></CardHeader>
        <div className="space-y-3 text-xs font-mono">
          <p className="text-os-muted">Include your API key in the Authorization header:</p>
          <div className="p-3 bg-white/[0.02] border border-os-border rounded-lg text-os-accent">
            Authorization: Bearer sk_live_your_key_here
          </div>
          <p className="text-os-muted">Base URL: <span className="text-os-accent">{process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/public/v1</span></p>
          <div className="flex gap-3 flex-wrap mt-2">
            {['/goals', '/tasks', '/analytics', '/ping'].map(endpoint => (
              <span key={endpoint} className="px-2 py-1 rounded border border-os-border text-os-muted">{endpoint}</span>
            ))}
          </div>
        </div>
      </Card>

      {/* Keys list */}
      <div className="space-y-3">
        <p className="os-label">API Keys</p>
        {keys?.length === 0 && (
          <Card className="text-center py-10">
            <Key className="w-8 h-8 text-os-muted/30 mx-auto mb-3" />
            <p className="text-xs font-mono text-os-muted mb-4">No API keys yet. Create one to start integrating.</p>
            <Button onClick={() => setCreateOpen(true)}><Plus className="w-3 h-3" /> Create First Key</Button>
          </Card>
        )}
        {keys?.map((key: any) => (
          <Card key={key.id}>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-os-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Key className="w-4 h-4 text-os-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-mono font-bold text-os-text">{key.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-os-success/20 text-os-success bg-os-success/10">Active</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <code className="text-[11px] font-mono text-os-muted bg-white/[0.03] px-2 py-0.5 rounded border border-os-border">
                    {key.keyPrefix}
                  </code>
                  <button onClick={() => { navigator.clipboard.writeText(key.keyPrefix); showToast('Prefix copied') }}
                    className="text-os-muted hover:text-os-accent p-1 transition-colors">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {key.scopes?.map((s: string) => (
                    <span key={s} className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                      style={{ color: SCOPES_META[s]?.color || '#64748b', background: `${SCOPES_META[s]?.color || '#64748b'}15`, border: `1px solid ${SCOPES_META[s]?.color || '#64748b'}30` }}>
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-[10px] font-mono text-os-muted">
                  <span>{key.requestCount} requests</span>
                  {key.lastUsedAt && <span>Last used {timeAgo(key.lastUsedAt)}</span>}
                  {key.expiresAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Expires {new Date(key.expiresAt).toLocaleDateString()}</span>}
                  <span>Created {timeAgo(key.createdAt)}</span>
                </div>
              </div>
              <button onClick={() => { if (confirm('Revoke this API key?')) revokeKey.mutate(key.id) }}
                className="text-os-muted hover:text-os-danger transition-colors p-1 flex-shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setNewKey(null) }} title="Create API Key" size="md">
        {newKey ? (
          <div className="space-y-4">
            <div className="p-4 bg-os-success/5 border border-os-success/20 rounded-lg">
              <p className="text-xs font-mono text-os-success font-bold mb-2">⚠️ Copy this key now — it won't be shown again</p>
              <code className="block text-xs font-mono text-os-text break-all mb-3">{newKey}</code>
              <Button onClick={() => { navigator.clipboard.writeText(newKey); showToast('Key copied!') }}>
                <Copy className="w-3 h-3" /> Copy Key
              </Button>
            </div>
            <Button variant="ghost" onClick={() => { setCreateOpen(false); setNewKey(null) }}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Input label="Key Name" placeholder="My Integration" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />

            <div>
              <label className="block text-[10px] font-mono tracking-widest uppercase text-os-muted mb-3">Permissions (Scopes)</label>
              <div className="space-y-2">
                {Object.entries(SCOPES_META).map(([scope, meta]) => (
                  <label key={scope} className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all"
                    style={{ borderColor: form.scopes.includes(scope) ? `${meta.color}40` : 'rgba(255,255,255,0.08)', background: form.scopes.includes(scope) ? `${meta.color}08` : 'transparent' }}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all`}
                      style={{ borderColor: form.scopes.includes(scope) ? meta.color : '#64748b', background: form.scopes.includes(scope) ? `${meta.color}20` : 'transparent' }}>
                      {form.scopes.includes(scope) && <Check className="w-2.5 h-2.5" style={{ color: meta.color }} />}
                    </div>
                    <input type="checkbox" className="hidden" checked={form.scopes.includes(scope)} onChange={() => toggleScope(scope)} />
                    <div>
                      <p className="text-xs font-mono" style={{ color: meta.color }}>{scope}</p>
                      <p className="text-[10px] font-mono text-os-muted">{meta.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <Input label="Expires In (days, optional)" type="number" placeholder="30" value={form.expiresInDays}
              onChange={e => setForm(f => ({ ...f, expiresInDays: e.target.value }))} />

            <div className="flex gap-3 pt-2">
              <Button className="flex-1" loading={createKey.isPending}
                onClick={() => createKey.mutate({ ...form, expiresInDays: form.expiresInDays ? Number(form.expiresInDays) : undefined })}>
                Create Key
              </Button>
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

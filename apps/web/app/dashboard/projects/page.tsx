'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { KanbanBoard } from '@/components/modules/kanban/KanbanBoard'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { useAppStore } from '@/store/useAppStore'
import { useGoals } from '@/hooks/useGoals'
import { PILLAR_META, formatDate } from '@/lib/utils'
import { FolderKanban, Plus, Trash2, LayoutGrid, List, ArrowLeft, ChevronRight } from 'lucide-react'
import { useConfirm } from '@/components/ui/ConfirmDialog'

const STATUS_COLORS: Record<string, string> = {
  PLANNING: '#64748b', ACTIVE: '#64ffda', ON_HOLD: '#f59e0b', COMPLETED: '#22c55e', CANCELLED: '#ef4444',
}

const KANBAN_COLS = [
  { key: 'BACKLOG',      label: 'Backlog',      color: '#475569' },
  { key: 'TODO',         label: 'To Do',        color: '#94a3b8' },
  { key: 'IN_PROGRESS',  label: 'In Progress',  color: '#64ffda' },
  { key: 'DONE',         label: 'Done',         color: '#22c55e' },
]

export default function ProjectsPage() {
  const qc = useQueryClient()
  const { showToast } = useAppStore()
  const { data: goals } = useGoals()
  const [view, setView] = useState<'list' | 'kanban'>('list')
  const [activeProject, setActiveProject] = useState<any>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', goalId: '', targetDate: '', color: '#64ffda' })
  const { confirm, dialog: confirmDialog } = useConfirm()

  const { data: projects, isLoading } = useQuery<any[]>({
    queryKey: ['projects'], queryFn: () => api.get('/projects'),
  })

  const { data: kanban, isLoading: kanbanLoading } = useQuery<any>({
    queryKey: ['projects', 'kanban', activeProject?.id],
    queryFn: () => api.get(`/projects/${activeProject.id}/kanban`),
    enabled: !!activeProject && view === 'kanban',
  })

  const createProject = useMutation({
    mutationFn: (data: any) => api.post('/projects', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); setCreateOpen(false); setForm({ title: '', description: '', goalId: '', targetDate: '', color: '#64ffda' }); showToast('Project created 🚀') },
    onError: (err: any) => showToast(err.message || 'Failed to create project', 'error'),
  })

  const updateProject = useMutation({
    mutationFn: ({ id, data }: any) => api.patch(`/projects/${id}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })

  const deleteProject = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); setActiveProject(null); showToast('Project deleted') },
  })

  const moveTask = useMutation({
    mutationFn: ({ taskId, status }: any) => api.patch(`/tasks/${taskId}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects', 'kanban'] }),
  })

  // Build kanban columns from API response
  const kanbanColumns = KANBAN_COLS.map(col => ({
    ...col,
    tasks: (kanban?.[col.key] || []).map((t: any) => ({
      id: t.id, title: t.title, priority: t.priority,
      energyRequired: t.energyRequired ?? 2,
      dueDate: t.dueDate, tags: t.tags,
    })),
  }))

  const COLORS = ['#64ffda','#22c55e','#00b4d8','#a78bfa','#f59e0b','#ef4444','#f97316','#ec4899']

  // ── Kanban view ────────────────────────────────────────────────────────────
  if (activeProject && view === 'kanban') {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4 flex-shrink-0">
          <button onClick={() => { setActiveProject(null); setView('list') }}
            className="flex items-center gap-1.5 text-os-muted hover:text-os-text transition-colors text-xs font-mono">
            <ArrowLeft className="w-3.5 h-3.5" /> Projects
          </button>
          <ChevronRight className="w-3 h-3 text-os-muted" />
          <div className="w-3 h-3 rounded-full" style={{ background: activeProject.color || '#64ffda' }} />
          <span className="text-sm font-mono font-semibold text-os-text">{activeProject.title}</span>
          <div className="ml-auto flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setView('list')}>
              <List className="w-3 h-3" /> List View
            </Button>
          </div>
        </div>

        {/* Kanban */}
        <div className="flex-1 min-h-0">
          <KanbanBoard
            columns={kanbanColumns}
            loading={kanbanLoading}
            onTaskMove={async (taskId, newStatus) => {
              // Map kanban col key to task status
              const statusMap: Record<string, string> = {
                BACKLOG: 'TODO', TODO: 'TODO', IN_PROGRESS: 'IN_PROGRESS', DONE: 'DONE'
              }
              await moveTask.mutateAsync({ taskId, status: statusMap[newStatus] || newStatus })
              showToast('Task moved ✓')
            }}
          />
        </div>
      </div>
    )
  }

  // ── List view ──────────────────────────────────────────────────────────────
  const active = projects?.filter(p => p.status === 'ACTIVE') || []
  const other = projects?.filter(p => p.status !== 'ACTIVE') || []

  return (
    <div className="space-y-6 animate-fade-in">
      {confirmDialog}
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Active',    value: projects?.filter(p => p.status === 'ACTIVE').length ?? 0,     color: '#64ffda' },
            { label: 'Planning',  value: projects?.filter(p => p.status === 'PLANNING').length ?? 0,   color: '#64748b' },
            { label: 'Done',      value: projects?.filter(p => p.status === 'COMPLETED').length ?? 0,  color: '#22c55e' },
            { label: 'Total',     value: projects?.length ?? 0,                                        color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} className="text-center px-4 py-2 bg-os-surface border border-os-border rounded-lg">
              <div className="text-lg font-mono font-bold" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[9px] font-mono tracking-widest uppercase text-os-muted">{s.label}</div>
            </div>
          ))}
        </div>
        <Button onClick={() => setCreateOpen(true)}><Plus className="w-3 h-3" /> New Project</Button>
      </div>

      {/* Active */}
      <div className="space-y-3">
        {active.length > 0 && <p className="os-label">Active — {active.length}</p>}
        {active.map((proj: any) => (
          <ProjectRow key={proj.id} project={proj} goals={goals || []}
            onKanban={() => { setActiveProject(proj); setView('kanban') }}
            onComplete={() => updateProject.mutate({ id: proj.id, data: { status: 'COMPLETED' } })}
            onDelete={async () => { const ok = await confirm({ title: 'Delete project?', description: 'All tasks in this project will also be removed.' }); if (ok) deleteProject.mutate(proj.id) }}
          />
        ))}
      </div>

      {/* Other */}
      {other.length > 0 && (
        <div className="space-y-3">
          <p className="os-label text-os-muted">Other — {other.length}</p>
          {other.map((proj: any) => (
            <ProjectRow key={proj.id} project={proj} goals={goals || []} muted
              onKanban={() => { setActiveProject(proj); setView('kanban') }}
              onComplete={() => updateProject.mutate({ id: proj.id, data: { status: 'ACTIVE' } })}
              onDelete={async () => { const ok = await confirm({ title: 'Delete project?', description: 'All tasks in this project will also be removed.' }); if (ok) deleteProject.mutate(proj.id) }}
            />
          ))}
        </div>
      )}

      {(!projects || projects.length === 0) && !isLoading && (
        <Card className="text-center py-14">
          <FolderKanban className="w-10 h-10 text-os-accent/20 mx-auto mb-4" />
          <p className="text-xs font-mono text-os-muted mb-4">No projects yet. Ship something.</p>
          <Button onClick={() => setCreateOpen(true)}><Plus className="w-3 h-3" /> Create First Project</Button>
        </Card>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="New Project">
        <div className="space-y-4">
          <Input label="Project Name" placeholder="Saikhant Labs OS v1" value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <Input label="Description" placeholder="What are you building?" value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <Select label="Link to Goal" value={form.goalId} onChange={e => setForm(f => ({ ...f, goalId: e.target.value }))}>
            <option value="">No linked goal</option>
            {goals?.map(g => <option key={g.id} value={g.id}>{PILLAR_META[g.pillar]?.icon} {g.title}</option>)}
          </Select>
          <Input label="Target Date" type="date" value={form.targetDate} onChange={e => setForm(f => ({ ...f, targetDate: e.target.value }))} />
          <div>
            <label className="block text-[10px] font-mono tracking-widest uppercase text-os-muted mb-2">Color</label>
            <div className="flex gap-2">{COLORS.map(c => (
              <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                className="w-6 h-6 rounded-full border-2 transition-all"
                style={{ background: c, borderColor: form.color === c ? '#fff' : 'transparent' }} />
            ))}</div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" loading={createProject.isPending}
              onClick={() => {
                if (!form.title.trim()) { showToast('Project name is required', 'error'); return }
                createProject.mutate({ ...form, goalId: form.goalId || undefined, targetDate: form.targetDate || undefined })
              }}>
              Create Project
            </Button>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function ProjectRow({ project, goals, onKanban, onComplete, onDelete, muted }: any) {
  const goal = goals.find((g: any) => g.id === project.goalId)
  return (
    <Card className={muted ? 'opacity-60' : ''}>
      <div className="flex items-center gap-4">
        <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: project.color || '#64ffda' }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-mono font-semibold">{project.title}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border"
              style={{ color: STATUS_COLORS[project.status], borderColor: `${STATUS_COLORS[project.status]}33`, background: `${STATUS_COLORS[project.status]}0f` }}>
              {project.status}
            </span>
          </div>
          {project.description && <p className="text-[11px] font-mono text-os-muted truncate mb-1">{project.description}</p>}
          <div className="flex items-center gap-4 text-[10px] font-mono text-os-muted">
            {goal && <span>{PILLAR_META[goal.pillar]?.icon} {goal.title}</span>}
            {project.targetDate && <span>Due {formatDate(project.targetDate)}</span>}
            <span>{project._count?.tasks || 0} tasks</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={onKanban}><LayoutGrid className="w-3 h-3" /> Board</Button>
          <button onClick={onComplete}
            className="text-[10px] font-mono px-2 py-1 rounded border border-os-success/20 text-os-success hover:bg-os-success/10 transition-all">
            {project.status === 'ACTIVE' ? '✓ Done' : '↺ Activate'}
          </button>
          <button onClick={onDelete} className="text-os-muted hover:text-os-danger p-1 transition-colors">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </Card>
  )
}

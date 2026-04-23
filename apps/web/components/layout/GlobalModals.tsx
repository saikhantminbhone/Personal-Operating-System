'use client'
import { useState } from 'react'
import { useAppStore } from '@/store/useAppStore'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useGoals, useCreateGoal } from '@/hooks/useGoals'
import { useCreateTask } from '@/hooks/useTasks'
import { PILLAR_META, ENERGY_META, PRIORITY_META } from '@/lib/utils'
import { GoalPillar } from '@/types'
import { cn } from '@/lib/utils'

export function GlobalModals() {
  const { activeModal, setModal, showToast } = useAppStore()
  const { data: goals } = useGoals()
  const createTask = useCreateTask()
  const createGoal = useCreateGoal()

  const todayISO = new Date().toISOString().slice(0, 10)
  const [taskForm, setTaskForm] = useState({
    title: '', goalId: '', priority: 'MEDIUM', energyRequired: 2, dueDate: todayISO,
  })
  const [goalForm, setGoalForm] = useState({
    title: '', pillar: 'GROWTH', description: '', targetDate: '',
  })

  async function handleAddTask() {
    if (!taskForm.title.trim()) return
    try {
      await createTask.mutateAsync({
        title: taskForm.title,
        goalId: taskForm.goalId || undefined,
        priority: taskForm.priority as any,
        energyRequired: taskForm.energyRequired,
        dueDate: taskForm.dueDate || undefined,
      })
      setTaskForm({ title: '', goalId: '', priority: 'MEDIUM', energyRequired: 2, dueDate: todayISO })
      setModal(null)
      showToast('Task added ✓')
    } catch (err: any) {
      showToast(err.message || 'Failed to add task', 'error')
    }
  }

  async function handleAddGoal() {
    if (!goalForm.title.trim()) return
    try {
      await createGoal.mutateAsync({
        title: goalForm.title,
        pillar: goalForm.pillar as GoalPillar,
        description: goalForm.description || undefined,
        targetDate: goalForm.targetDate || undefined,
      })
      setGoalForm({ title: '', pillar: 'GROWTH', description: '', targetDate: '' })
      setModal(null)
      showToast('Goal created 🎯')
    } catch (err: any) {
      showToast(err.message || 'Failed to create goal', 'error')
    }
  }

  return (
    <>
      {/* Quick Add Task */}
      <Modal open={activeModal === 'add-task'} onClose={() => setModal(null)} title="Quick Add Task">
        <div className="space-y-4">
          <Input
            label="Task"
            placeholder="What needs to be done?"
            value={taskForm.title}
            onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && taskForm.title.trim() && handleAddTask()}
            autoFocus
          />
          <Select label="Link to Goal (optional)" value={taskForm.goalId}
            onChange={e => setTaskForm(f => ({ ...f, goalId: e.target.value }))}>
            <option value="">— No linked goal —</option>
            {goals?.map(g => (
              <option key={g.id} value={g.id}>{PILLAR_META[g.pillar]?.icon} {g.title}</option>
            ))}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Priority" value={taskForm.priority}
              onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))}>
              {Object.keys(PRIORITY_META).map(p => <option key={p} value={p}>{p}</option>)}
            </Select>
            <Select label="Energy" value={String(taskForm.energyRequired)}
              onChange={e => setTaskForm(f => ({ ...f, energyRequired: Number(e.target.value) }))}>
              {ENERGY_META.map((e, i) => <option key={i} value={i}>{e.icon} {e.label}</option>)}
            </Select>
          </div>
          <Input label="Due Date" type="date" value={taskForm.dueDate}
            onChange={e => setTaskForm(f => ({ ...f, dueDate: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" loading={createTask.isPending}
              disabled={!taskForm.title.trim()} onClick={handleAddTask}>
              Add Task
            </Button>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Quick Add Goal */}
      <Modal open={activeModal === 'add-goal'} onClose={() => setModal(null)} title="New Goal">
        <div className="space-y-4">
          <Input
            label="Goal Title"
            placeholder="What do you want to achieve?"
            value={goalForm.title}
            onChange={e => setGoalForm(f => ({ ...f, title: e.target.value }))}
            autoFocus
          />
          <div>
            <label className="block text-[10px] font-mono tracking-widest uppercase text-os-muted mb-2">Pillar</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(PILLAR_META).map(([key, meta]) => (
                <button key={key} onClick={() => setGoalForm(f => ({ ...f, pillar: key }))}
                  className={cn(
                    'py-2 px-2 rounded-lg border text-[10px] font-mono transition-all text-center',
                    goalForm.pillar === key
                      ? 'border-os-accent/40 bg-os-accent/10 text-os-accent'
                      : 'border-os-border text-os-muted hover:border-os-accent/20'
                  )}>
                  {meta.icon} {key}
                </button>
              ))}
            </div>
          </div>
          <Input label="Description (optional)" placeholder="Why does this matter?"
            value={goalForm.description}
            onChange={e => setGoalForm(f => ({ ...f, description: e.target.value }))} />
          <Input label="Target Date" type="date" value={goalForm.targetDate}
            onChange={e => setGoalForm(f => ({ ...f, targetDate: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" loading={createGoal.isPending}
              disabled={!goalForm.title.trim()} onClick={handleAddGoal}>
              Create Goal
            </Button>
            <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}

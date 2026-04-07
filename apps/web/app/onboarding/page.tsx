'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PILLAR_META, ENERGY_META } from '@/lib/utils'
import { GoalPillar } from '@/types'
import { Hexagon, ArrowRight, ArrowLeft, Check, Target, Zap, Repeat2 } from 'lucide-react'

const STEPS = ['Welcome', 'First Goal', 'Energy', 'First Habit', 'Done']

export default function OnboardingPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const qc = useQueryClient()
  const [step, setStep] = useState(0)
  const [goalForm, setGoalForm] = useState({ title: '', pillar: 'WORK' as GoalPillar })
  const [energy, setEnergy] = useState(2)
  const [habitForm, setHabitForm] = useState({ title: '', icon: '✓', frequency: 'DAILY' })

  const createGoal = useMutation({ mutationFn: (data: any) => api.post('/goals', data) })
  const createHabit = useMutation({ mutationFn: (data: any) => api.post('/habits', data) })
  const checkin = useMutation({ mutationFn: (level: number) => api.post('/auth/checkin', { energyLevel: level }) })

  async function handleFinish() {
    try {
      const promises = []
      if (goalForm.title) promises.push(createGoal.mutateAsync({ title: goalForm.title, pillar: goalForm.pillar }))
      if (habitForm.title) promises.push(createHabit.mutateAsync({ title: habitForm.title, icon: habitForm.icon, frequency: habitForm.frequency }))
      promises.push(checkin.mutateAsync(energy))
      await Promise.allSettled(promises)
      qc.invalidateQueries()
      router.push('/dashboard')
    } catch {
      router.push('/dashboard')
    }
  }

  const firstName = session?.user?.name?.split(' ')[0] || 'there'
  const HABITS_STARTERS = ['Morning workout 💪', 'Read 20 pages 📚', 'Meditate 10 min 🧘', 'Code on personal project 💻', 'Journal 📝', 'No social media before 9am 📵']
  const ICONS = ['✓','💪','📚','🧘','💻','📝','🏃','🎸','🍎','🌅']

  return (
    <div className="min-h-screen bg-os-bg flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(100,255,218,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(100,255,218,0.025) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="w-full max-w-lg relative">
        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-bold border-2 transition-all ${
                i < step ? 'bg-os-success border-os-success text-os-bg' :
                i === step ? 'border-os-accent text-os-accent bg-os-accent/10' :
                'border-os-border text-os-muted'
              }`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex-1 h-px w-12 transition-all" style={{ background: i < step ? '#22c55e' : 'rgba(255,255,255,0.08)' }} />
              )}
            </div>
          ))}
        </div>

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div className="os-card text-center">
            <div className="w-16 h-16 rounded-2xl bg-os-accent/10 border border-os-accent/20 flex items-center justify-center mx-auto mb-6">
              <Hexagon className="w-8 h-8 text-os-accent" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl font-mono font-bold text-os-text mb-3">Welcome, {firstName}! 👋</h1>
            <p className="text-sm font-mono text-os-muted mb-2 leading-relaxed">
              Let's set up your Personal OS in 2 minutes.
            </p>
            <p className="text-xs font-mono text-os-muted mb-8">
              We'll create your first goal, set your energy level, and build your first habit.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {[
                { icon: Target, label: 'Goals & OKRs', color: '#64ffda' },
                { icon: Zap, label: 'Daily Energy', color: '#f97316' },
                { icon: Repeat2, label: 'Habits', color: '#22c55e' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="p-3 bg-white/[0.02] border border-os-border rounded-lg text-center">
                  <Icon className="w-5 h-5 mx-auto mb-2" style={{ color }} />
                  <p className="text-[10px] font-mono text-os-muted">{label}</p>
                </div>
              ))}
            </div>
            <Button className="w-full justify-center" onClick={() => setStep(1)}>
              Let's Go <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Step 1 — First Goal */}
        {step === 1 && (
          <div className="os-card">
            <p className="os-label mb-1">Step 1 of 4</p>
            <h2 className="text-lg font-mono font-bold text-os-text mb-2">What's your biggest goal right now?</h2>
            <p className="text-xs font-mono text-os-muted mb-6">Don't overthink it. You can add more later.</p>

            <div className="space-y-4">
              <Input label="Goal Title" placeholder="e.g. Get a Senior SWE job in Berlin" value={goalForm.title}
                onChange={e => setGoalForm(f => ({ ...f, title: e.target.value }))} />

              <div>
                <label className="block text-[10px] font-mono tracking-widest uppercase text-os-muted mb-3">Life Pillar</label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(PILLAR_META).map(([pillar, meta]) => (
                    <button key={pillar} onClick={() => setGoalForm(f => ({ ...f, pillar: pillar as GoalPillar }))}
                      className="p-2 rounded-lg border text-center transition-all"
                      style={{ borderColor: goalForm.pillar === pillar ? meta.color : 'rgba(255,255,255,0.08)', background: goalForm.pillar === pillar ? `${meta.color}15` : 'transparent' }}>
                      <div className="text-lg mb-1">{meta.icon}</div>
                      <div className="text-[9px] font-mono" style={{ color: goalForm.pillar === pillar ? meta.color : '#64748b' }}>{meta.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="ghost" onClick={() => setStep(0)}><ArrowLeft className="w-3 h-3" /></Button>
              <Button className="flex-1 justify-center" onClick={() => setStep(2)}>
                {goalForm.title ? 'Next' : 'Skip for now'} <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2 — Energy */}
        {step === 2 && (
          <div className="os-card">
            <p className="os-label mb-1">Step 2 of 4</p>
            <h2 className="text-lg font-mono font-bold text-os-text mb-2">How's your energy right now?</h2>
            <p className="text-xs font-mono text-os-muted mb-6">This shapes your daily task queue. You'll check in every morning.</p>

            <div className="space-y-3">
              {ENERGY_META.map((e, i) => (
                <button key={i} onClick={() => setEnergy(i)}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl border transition-all"
                  style={{
                    borderColor: energy === i ? e.color : 'rgba(255,255,255,0.08)',
                    background: energy === i ? `${e.color}10` : 'transparent',
                  }}>
                  <span className="text-2xl">{e.icon}</span>
                  <div className="text-left">
                    <div className="text-sm font-mono font-semibold" style={{ color: e.color }}>{e.label}</div>
                    <div className="text-[10px] font-mono text-os-muted">
                      {['Handle emails and admin tasks', 'Light work and planning', 'Normal focused work', 'Deep work, hard problems'][i]}
                    </div>
                  </div>
                  {energy === i && <Check className="w-4 h-4 ml-auto" style={{ color: e.color }} />}
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft className="w-3 h-3" /></Button>
              <Button className="flex-1 justify-center" onClick={() => setStep(3)}>Next <ArrowRight className="w-3 h-3" /></Button>
            </div>
          </div>
        )}

        {/* Step 3 — First Habit */}
        {step === 3 && (
          <div className="os-card">
            <p className="os-label mb-1">Step 3 of 4</p>
            <h2 className="text-lg font-mono font-bold text-os-text mb-2">Build your first habit</h2>
            <p className="text-xs font-mono text-os-muted mb-6">Start with one. Consistency beats ambition.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono tracking-widest uppercase text-os-muted mb-2">Quick Pick</label>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {HABITS_STARTERS.map(h => (
                    <button key={h} onClick={() => setHabitForm(f => ({ ...f, title: h.split(' ').slice(0,-1).join(' '), icon: h.split(' ').slice(-1)[0] }))}
                      className={`text-left p-2.5 rounded-lg border text-xs font-mono transition-all ${habitForm.title && h.includes(habitForm.title) ? 'border-os-accent/40 bg-os-accent/10 text-os-accent' : 'border-os-border text-os-muted hover:border-os-accent/20 hover:text-os-text'}`}>
                      {h}
                    </button>
                  ))}
                </div>
              </div>
              <Input label="Or type your own" placeholder="My daily habit..." value={habitForm.title}
                onChange={e => setHabitForm(f => ({ ...f, title: e.target.value }))} />
              <div>
                <label className="block text-[10px] font-mono tracking-widest uppercase text-os-muted mb-2">Icon</label>
                <div className="flex gap-2 flex-wrap">
                  {ICONS.map(ic => (
                    <button key={ic} onClick={() => setHabitForm(f => ({ ...f, icon: ic }))}
                      className="w-9 h-9 rounded-lg border text-sm transition-all"
                      style={{ borderColor: habitForm.icon === ic ? '#64ffda' : 'rgba(255,255,255,0.08)', background: habitForm.icon === ic ? 'rgba(100,255,218,0.1)' : 'transparent' }}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="ghost" onClick={() => setStep(2)}><ArrowLeft className="w-3 h-3" /></Button>
              <Button className="flex-1 justify-center" onClick={() => setStep(4)}>
                {habitForm.title ? 'Next' : 'Skip for now'} <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4 — Done */}
        {step === 4 && (
          <div className="os-card text-center">
            <div className="w-16 h-16 rounded-2xl bg-os-success/10 border border-os-success/20 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-os-success" />
            </div>
            <h2 className="text-xl font-mono font-bold text-os-text mb-3">You're all set, {firstName}!</h2>
            <p className="text-sm font-mono text-os-muted mb-8 leading-relaxed">
              Your Personal OS is ready. Start with your AI daily briefing, then work through your focus queue.
            </p>
            <div className="space-y-2 text-left mb-8">
              {[
                goalForm.title && `✓ Goal created: "${goalForm.title}"`,
                `✓ Energy set: ${ENERGY_META[energy].icon} ${ENERGY_META[energy].label}`,
                habitForm.title && `✓ Habit created: "${habitForm.title}"`,
              ].filter(Boolean).map((item, i) => (
                <p key={i} className="text-xs font-mono text-os-success">{item as string}</p>
              ))}
            </div>
            <Button className="w-full justify-center" onClick={handleFinish}>
              Open My Dashboard <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

'use client'
import { Suspense } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAppStore } from '@/store/useAppStore'
import { Check, Zap, Users, Crown, Star, ArrowRight, Shield } from 'lucide-react'

const PLAN_ICONS: Record<string, any> = { FREE: Zap, PRO: Crown, TEAM: Users }
const PLAN_COLORS: Record<string, string> = { FREE: '#64748b', PRO: '#64ffda', TEAM: '#a78bfa' }

// Inner component uses useSearchParams — must be inside Suspense
function BillingContent() {
  const searchParams = useSearchParams()
  const { showToast } = useAppStore()
  const [upgrading, setUpgrading] = useState<string | null>(null)

  const { data: plans } = useQuery<any[]>({
    queryKey: ['billing', 'plans'],
    queryFn: () => api.get('/billing/plans'),
    retry: false,
  })
  const { data: subscription, refetch: refetchSub } = useQuery<any>({
    queryKey: ['billing', 'subscription'],
    queryFn: () => api.get('/billing/subscription'),
    retry: false,
  })

  useEffect(() => {
    if (searchParams.get('success')) {
      showToast('Subscription activated! Welcome to Pro 🎉')
      refetchSub()
    } else if (searchParams.get('canceled')) {
      showToast('Checkout canceled', 'info')
    } else if (searchParams.get('mock') === 'success') {
      showToast(`Mock upgrade — configure Stripe for real payments`, 'info')
    }
  }, [searchParams])

  const createCheckout = useMutation({
    mutationFn: (plan: string) => api.post('/billing/checkout', { plan }),
    onSuccess: (data: any) => { if (data.url) window.location.href = data.url },
    onError: () => showToast('Checkout failed', 'error'),
  })

  const createPortal = useMutation({
    mutationFn: () => api.post('/billing/portal'),
    onSuccess: (data: any) => { if (data.url) window.location.href = data.url },
  })

  const currentPlan = subscription?.currentPlan || 'FREE'

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Current plan */}
      {subscription && (
        <Card className="border-os-accent/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${PLAN_COLORS[currentPlan]}20`, border: `1px solid ${PLAN_COLORS[currentPlan]}40` }}>
                {(() => { const Icon = PLAN_ICONS[currentPlan] || Zap; return <Icon className="w-5 h-5" style={{ color: PLAN_COLORS[currentPlan] }} /> })()}
              </div>
              <div>
                <p className="text-[10px] font-mono text-os-muted uppercase tracking-widest">Current Plan</p>
                <p className="text-lg font-mono font-bold" style={{ color: PLAN_COLORS[currentPlan] }}>
                  {subscription.planDetails?.name || currentPlan}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!subscription.stripeConfigured && (
                <span className="text-[10px] font-mono px-2 py-1 rounded border border-os-warning/30 text-os-warning bg-os-warning/10">
                  Stripe not configured
                </span>
              )}
              {currentPlan !== 'FREE' && (
                <Button variant="ghost" size="sm" onClick={() => createPortal.mutate()} loading={createPortal.isPending}>
                  Manage Subscription
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Plan cards */}
      <div>
        <p className="os-label mb-5">Choose Your Plan</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {(plans || [
            { id: 'FREE', name: 'Free', priceMonthly: 0, features: ['5 Goals', '50 Tasks', '3 Habits', '100 Notes', '10 AI messages/month'] },
            { id: 'PRO',  name: 'Pro',  priceMonthly: 12, features: ['Unlimited Everything', 'AI Assistant', 'Finance Tracker', 'Analytics', '14-day trial'], popular: true },
            { id: 'TEAM', name: 'Team', priceMonthly: 29, features: ['Everything in Pro', 'Shared Projects', 'Team Analytics', 'Admin Controls'] },
          ]).map((plan: any) => {
            const isCurrent = plan.id === currentPlan
            const Icon = PLAN_ICONS[plan.id] || Zap
            const color = PLAN_COLORS[plan.id] || '#64748b'
            const isPopular = plan.id === 'PRO'

            return (
              <div key={plan.id} className="relative rounded-xl border p-5 sm:p-6 flex flex-col transition-all"
                style={{ borderColor: isCurrent ? color : 'rgba(100,255,218,0.1)' }}>
                {isPopular && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-mono bg-os-accent text-os-bg font-bold">
                      <Star className="w-2.5 h-2.5" /> Most Popular
                    </div>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-mono border font-bold"
                      style={{ color, borderColor: color, background: `${color}15` }}>
                      <Check className="w-2.5 h-2.5" /> Current Plan
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <div>
                    <p className="text-xs font-mono font-bold" style={{ color }}>{plan.name}</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-mono font-bold text-os-text">
                        {plan.priceMonthly === 0 ? 'Free' : `$${plan.priceMonthly}`}
                      </span>
                      {plan.priceMonthly > 0 && <span className="text-[10px] font-mono text-os-muted">/mo</span>}
                    </div>
                  </div>
                </div>

                <ul className="space-y-2 flex-1 mb-5">
                  {plan.features?.map((f: string) => (
                    <li key={f} className="flex items-start gap-2 text-[11px] font-mono text-os-text">
                      <Check className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color }} />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="text-center text-xs font-mono text-os-muted py-2.5 border border-os-border rounded-lg">
                    Your current plan
                  </div>
                ) : plan.id === 'FREE' ? (
                  <div className="text-center text-xs font-mono text-os-muted py-2">Always free</div>
                ) : (
                  <Button className="w-full justify-center" loading={upgrading === plan.id}
                    onClick={async () => { setUpgrading(plan.id); await createCheckout.mutateAsync(plan.id); setUpgrading(null) }}
                    style={{ color, background: `${color}15`, borderColor: `${color}40` }}>
                    Upgrade to {plan.name} <ArrowRight className="w-3 h-3" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Trust */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Shield, label: 'Secure Payments', desc: 'Powered by Stripe — PCI DSS compliant' },
          { icon: Check,  label: 'Cancel Anytime',  desc: 'No lock-in. Cancel in 2 clicks.' },
          { icon: Star,   label: '14-Day Trial',    desc: 'Try Pro free. No card required.' },
        ].map(({ icon: Icon, label, desc }) => (
          <div key={label} className="flex items-start gap-3 p-4 bg-white/[0.02] border border-os-border rounded-lg">
            <Icon className="w-4 h-4 text-os-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-mono font-semibold text-os-text mb-0.5">{label}</p>
              <p className="text-[10px] font-mono text-os-muted">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Outer page wraps in Suspense (required for useSearchParams in Next.js 14)
export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-os-accent/30 border-t-os-accent rounded-full animate-spin" />
      </div>
    }>
      <BillingContent />
    </Suspense>
  )
}

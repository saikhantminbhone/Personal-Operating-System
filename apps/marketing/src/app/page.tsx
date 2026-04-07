import Link from 'next/link'
import {
  Target, CheckSquare, Repeat2, PiggyBank, BookOpen,
  Bot, BarChart3, FolderKanban, Zap, Shield, Globe,
  ArrowRight, Star, Users, Hexagon, ChevronRight, Check
} from 'lucide-react'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const MODULES = [
  { icon: Target,       label: 'Goals & OKRs',     desc: 'Define north stars. Track key results. Auto-calculate progress across life pillars.', color: '#64ffda' },
  { icon: CheckSquare,  label: 'Task Manager',      desc: 'Energy-matched focus queue. Your tasks ranked by your real-time energy level.',      color: '#a78bfa' },
  { icon: Repeat2,      label: 'Habits & Streaks',  desc: 'Build systems. Track streaks. Daily, weekly, or custom frequency with heatmaps.',    color: '#22c55e' },
  { icon: PiggyBank,    label: 'Finance Tracker',   desc: 'Multi-account net worth. Transaction history. Monthly summaries. Multi-currency.',   color: '#f59e0b' },
  { icon: BookOpen,     label: 'Knowledge Base',    desc: 'Second brain with full-text search. Collections, daily notes, rich markdown editor.', color: '#00b4d8' },
  { icon: FolderKanban, label: 'Projects & Sprints',desc: 'Kanban board. Sprint planning. Link projects to goals. Ship faster.',               color: '#f97316' },
  { icon: BarChart3,    label: 'Analytics',         desc: 'Productivity trends, habit heatmaps, pillar breakdown, behavioral patterns.',        color: '#ec4899' },
  { icon: Bot,          label: 'AI Assistant',      desc: 'Claude-powered chief of staff. Full context of your OS. Plans your day.',           color: '#64ffda' },
]

const PLANS = [
  {
    name: 'Free', price: '$0', period: '/forever', color: '#64748b',
    features: ['5 Goals', '50 Tasks', '3 Habits', '100 Notes', '10 AI messages/month'],
    cta: 'Get Started Free', href: `${APP_URL}/auth/register`,
  },
  {
    name: 'Pro', price: '$12', period: '/month', color: '#64ffda', popular: true,
    features: ['Unlimited Everything', 'Full AI Assistant', 'Finance Tracker', 'Advanced Analytics', 'Priority Support', '14-day free trial'],
    cta: 'Start 14-Day Trial', href: `${APP_URL}/auth/register`,
  },
  {
    name: 'Team', price: '$29', period: '/user/month', color: '#a78bfa',
    features: ['Everything in Pro', 'Shared Projects', 'Team Analytics', 'Collaborative KB', 'Admin Controls'],
    cta: 'Start Team Trial', href: `${APP_URL}/auth/register`,
  },
]

const TESTIMONIALS = [
  { name: 'Marcus T.', role: 'Senior Engineer, Berlin', quote: 'Finally replaced 6 different apps. Everything talks to everything. The AI knows my goals and actually gives useful advice.', stars: 5 },
  { name: 'Priya K.', role: 'Product Manager, Singapore', quote: 'The energy-matched task queue alone is worth it. Stopped forcing myself to do deep work on drained days.', stars: 5 },
  { name: 'James W.', role: 'Indie Hacker, Bangkok', quote: 'Built for serious people. Not another pretty to-do list — an actual operating system for life.', stars: 5 },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(100,255,218,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(100,255,218,0.025) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Hexagon className="w-6 h-6 text-accent" strokeWidth={1.5} />
            <span className="font-mono text-sm font-bold tracking-widest uppercase text-accent">Saikhant OS</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {['Features', 'Pricing'].map(label => (
              <a key={label} href={`#${label.toLowerCase()}`}
                className="text-xs font-mono text-muted hover:text-text transition-colors tracking-widest uppercase">
                {label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href={`${APP_URL}/auth/login`}
              className="hidden sm:block text-xs font-mono text-muted hover:text-text transition-colors">
              Sign In
            </Link>
            <Link href={`${APP_URL}/auth/register`}
              className="flex items-center gap-2 px-4 py-2 bg-accent/15 text-accent border border-accent/20 rounded font-mono text-xs tracking-widest uppercase hover:bg-accent/25 transition-all">
              Get Started <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent font-mono text-xs tracking-widest uppercase mb-8">
          <Zap className="w-3 h-3" /> Now in Public Beta
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold leading-tight mb-6">
          Your Personal
          <span className="block" style={{ background: 'linear-gradient(135deg, #64ffda, #00b4d8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Operating System
          </span>
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-muted max-w-2xl mx-auto mb-10 leading-relaxed">
          Goals, Tasks, Habits, Finance, Knowledge, Projects, Analytics, and AI — all talking to each other. One system. Built for people who take their growth seriously.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <Link href={`${APP_URL}/auth/register`}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 bg-accent text-bg font-mono font-bold text-sm tracking-widest uppercase rounded-lg hover:opacity-90 transition-all">
            Start Free — No Card Required <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href={`${APP_URL}/auth/login`}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 border border-border text-muted font-mono text-sm tracking-widest uppercase rounded-lg hover:border-accent/30 hover:text-text transition-all">
            Demo Login
          </Link>
        </div>
        <div className="flex items-center justify-center gap-8 sm:gap-12">
          {[{ value: '8', label: 'Integrated Modules' }, { value: 'AI', label: 'Claude-Powered' }, { value: '∞', label: 'Scale with You' }].map(s => (
            <div key={s.label}>
              <div className="text-2xl sm:text-3xl font-mono font-bold text-accent">{s.value}</div>
              <div className="text-[9px] sm:text-[10px] font-mono text-muted tracking-widest uppercase mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* APP PREVIEW */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
        <div className="rounded-2xl border border-border overflow-hidden bg-surface"
          style={{ boxShadow: '0 0 80px rgba(100,255,218,0.06)' }}>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-bg">
            {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />)}
            <div className="flex-1 mx-4 px-3 py-1 bg-white/5 rounded text-xs font-mono text-muted truncate">
              app.saikhantlabs.com/dashboard
            </div>
          </div>
          <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 bg-bg">
            {[
              { label: 'Day Streak', value: '47 days', color: '#f97316' },
              { label: 'Active Goals', value: '6', color: '#64ffda' },
              { label: 'Done Today', value: '8 tasks', color: '#a78bfa' },
              { label: 'Goal Progress', value: '73%', color: '#22c55e' },
            ].map(s => (
              <div key={s.label} className="p-3 sm:p-4 bg-surface border border-border rounded-lg text-center">
                <div className="text-xl sm:text-2xl font-mono font-bold mb-1" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[9px] font-mono tracking-widest uppercase text-muted">{s.label}</div>
              </div>
            ))}
            <div className="col-span-2 p-4 bg-surface border border-accent/15 rounded-lg">
              <div className="text-[9px] font-mono tracking-widest uppercase text-accent mb-3">⬡ AI Briefing</div>
              <p className="text-xs font-mono text-text leading-relaxed">Good morning! Your energy is at Peak. Focus on the Berlin job application — it's your highest-impact task today.</p>
            </div>
            <div className="col-span-2 p-4 bg-surface border border-border rounded-lg">
              <div className="text-[9px] font-mono tracking-widest uppercase text-muted mb-3">⚡ Focus Queue</div>
              {['Research TU Munich companies', 'Review PR for PiAnalytics', 'Morning workout'].map(t => (
                <div key={t} className="flex items-center gap-2 py-1.5 border-b border-border last:border-0">
                  <div className="w-3 h-3 rounded border border-border flex-shrink-0" />
                  <span className="text-[10px] font-mono text-text truncate">{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-12 sm:mb-16">
          <div className="text-accent font-mono text-xs tracking-widest uppercase mb-4">8 Integrated Modules</div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Every tool you need. None you don't.</h2>
          <p className="text-muted text-base sm:text-lg max-w-xl mx-auto">All 8 modules share a single data model. Your AI assistant knows everything.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MODULES.map(({ icon: Icon, label, desc, color }) => (
            <div key={label} className="module-card p-5 bg-surface border border-border rounded-xl transition-colors duration-200"
              style={{ '--hover-color': color } as React.CSSProperties}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <h3 className="text-sm font-mono font-bold text-text mb-2">{label}</h3>
              <p className="text-xs font-mono text-muted leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI SECTION */}
      <section className="bg-surface border-y border-border py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-12 items-center">
            <div>
              <div className="text-accent font-mono text-xs tracking-widest uppercase mb-4">Powered by Anthropic Claude</div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-6">AI that actually knows your life</h2>
              <p className="text-muted mb-6 leading-relaxed">Most AI tools are isolated chatbots. Saikhant OS gives Claude full context of your goals, tasks, habits, and finances — then lets it give advice that actually matters.</p>
              <div className="space-y-3">
                {[
                  'Generates a personalized daily briefing based on your energy, goals, and deadlines',
                  'Answers cross-module questions: "Why am I not making progress on my health goal?"',
                  'Plans your day matching tasks to your real-time energy level',
                  'Writes weekly insights: "You complete 40% more tasks on Tuesdays"',
                ].map(f => (
                  <div key={f} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-mono text-muted">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-bg border border-border rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <Bot className="w-4 h-4 text-accent" />
                <span className="text-xs font-mono text-accent">AI Assistant</span>
                <div className="ml-auto flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] font-mono text-muted">online</span>
                </div>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-text" />
                  </div>
                  <div className="bg-white/[0.03] border border-border rounded-xl rounded-tl-sm p-3 max-w-xs">
                    <p className="text-xs font-mono text-text leading-relaxed">Good morning! You're at Peak energy today. Your Berlin job goal is 35% complete — I'd suggest 90 min of research before your 2pm meeting.</p>
                  </div>
                </div>
                <div className="flex gap-3 flex-row-reverse">
                  <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-mono text-accent">S</span>
                  </div>
                  <div className="bg-accent/10 border border-accent/15 rounded-xl rounded-tr-sm p-3 max-w-xs">
                    <p className="text-xs font-mono text-text">Why am I consistently missing my health goal?</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0">
                    <Bot className="w-3.5 h-3.5 text-text" />
                  </div>
                  <div className="bg-white/[0.03] border border-border rounded-xl rounded-tl-sm p-3 max-w-xs">
                    <p className="text-xs font-mono text-text leading-relaxed">80% of your completed tasks were tagged "work". Tuesday and Thursday are your highest energy days — schedule workouts then.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, honest pricing</h2>
          <p className="text-muted text-lg">Start free. Upgrade when you're ready. Cancel anytime.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map(plan => (
            <div key={plan.name} className={`relative p-6 rounded-2xl border flex flex-col ${plan.popular ? '' : 'border-border'}`}
              style={{ borderColor: plan.popular ? plan.color : undefined, borderWidth: plan.popular ? '1.5px' : undefined }}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-mono font-bold"
                  style={{ background: plan.color, color: '#080c12' }}>
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-sm font-mono font-bold mb-2" style={{ color: plan.color }}>{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-sm font-mono text-muted">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-3 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs font-mono text-text">
                    <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: plan.color }} /> {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href}
                className="block text-center py-3 rounded-lg font-mono text-xs font-bold tracking-widest uppercase transition-all border"
                style={{ background: plan.popular ? plan.color : 'transparent', color: plan.popular ? '#080c12' : plan.color, borderColor: `${plan.color}40` }}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-surface border-y border-border py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 sm:mb-12">From people who actually use it</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="p-6 bg-bg border border-border rounded-xl">
                <div className="flex gap-0.5 mb-4">
                  {Array(t.stars).fill(null).map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />)}
                </div>
                <p className="text-sm font-mono text-text leading-relaxed mb-4 italic">"{t.quote}"</p>
                <div>
                  <div className="text-xs font-mono font-bold text-accent">{t.name}</div>
                  <div className="text-[10px] font-mono text-muted">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-accent/5" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative">
          <h2 className="text-3xl sm:text-5xl font-bold mb-6">
            Start running your life
            <span className="block text-accent">like a system.</span>
          </h2>
          <p className="text-muted text-lg sm:text-xl mb-10">Free forever. Pro when you're ready. No credit card required.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={`${APP_URL}/auth/register`}
              className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 bg-accent text-bg font-mono font-bold text-sm tracking-widest uppercase rounded-lg hover:opacity-90 transition-all">
              Get Started Free <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="text-xs font-mono text-muted">Demo: sai@saikhant.com / demo123456</div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Hexagon className="w-5 h-5 text-accent" strokeWidth={1.5} />
              <span className="font-mono text-xs font-bold tracking-widest uppercase text-accent">Saikhant Labs</span>
            </div>
            <div className="flex items-center gap-6 flex-wrap justify-center">
              {[
                { label: 'API Docs', href: 'http://localhost:3001/api/docs' },
                { label: 'saikhant.com', href: 'https://saikhant.com' },
              ].map(l => (
                <a key={l.label} href={l.href}
                  className="text-xs font-mono text-muted hover:text-text transition-colors">
                  {l.label}
                </a>
              ))}
            </div>
            <div className="text-[10px] font-mono text-muted">Built by Sai Khant · Bangkok · {new Date().getFullYear()}</div>
          </div>
        </div>
      </footer>

      <style>{`
        .module-card:hover { border-color: rgba(100,255,218,0.25); }
      `}</style>
    </div>
  )
}

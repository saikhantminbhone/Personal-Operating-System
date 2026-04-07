'use client'
import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Hexagon } from 'lucide-react'
import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  // If already logged in, redirect
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard')
    }
  }, [status, router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email || !form.password) return
    setLoading(true)
    setError('')

    const res = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    if (res?.ok) {
      router.push(callbackUrl)
    } else {
      setError('Invalid email or password')
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-os-accent/30 border-t-os-accent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="os-card">
      <p className="os-label mb-5">Sign In</p>
      <form onSubmit={handleLogin} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="sai@saikhant.com"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          error={error}
          required
        />
        <Button type="submit" loading={loading} className="w-full justify-center min-h-[44px]">
          Sign In
        </Button>
      </form>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-os-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-os-surface px-3 text-[10px] font-mono text-os-muted uppercase tracking-widest">or</span>
        </div>
      </div>

      <button
        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
        className="w-full flex items-center justify-center gap-3 py-3 border border-os-border rounded-lg text-xs font-mono text-os-muted hover:border-os-accent/30 hover:text-os-text transition-all min-h-[44px] touch-manipulation"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center justify-between mt-4 text-[11px] font-mono text-os-muted">
        <Link href="/auth/reset-password" className="hover:text-os-accent transition-colors">
          Forgot password?
        </Link>
        <Link href="/auth/register" className="text-os-accent hover:underline">
          Register →
        </Link>
      </div>

      {/* Demo hint */}
      <div className="mt-4 p-3 bg-os-accent/5 border border-os-accent/10 rounded-lg">
        <p className="text-[10px] font-mono text-os-accent text-center">
          Demo: sai@saikhant.com / demo123456
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-os-bg flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(100,255,218,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(100,255,218,0.025) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }} />
      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-os-surface border border-os-border mb-4">
            <Hexagon className="w-6 h-6 text-os-accent" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-mono font-bold text-os-text">SAIKHANT OS</h1>
          <p className="text-xs font-mono text-os-muted mt-1">Your Personal Operating System</p>
        </div>
        <Suspense fallback={
          <div className="os-card flex items-center justify-center h-64">
            <div className="w-6 h-6 border-2 border-os-accent/30 border-t-os-accent rounded-full animate-spin" />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}

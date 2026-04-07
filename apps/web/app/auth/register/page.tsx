'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { authApi } from '@/lib/api'
import { Hexagon } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email.trim()) errs.email = 'Email is required'
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters'
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setGlobalError('')
    try {
      await authApi.register({ name: form.name, email: form.email, password: form.password })
      const res = await signIn('credentials', {
        email: form.email, password: form.password, redirect: false,
      })
      if (res?.ok) router.push('/onboarding')
      else setGlobalError('Account created — please sign in')
    } catch (err: any) {
      setGlobalError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-os-bg flex items-center justify-center p-4">
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(100,255,218,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(100,255,218,0.025) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div className="w-full max-w-sm relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-os-surface border border-os-border mb-4">
            <Hexagon className="w-6 h-6 text-os-accent" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-mono font-bold text-os-text">SAIKHANT OS</h1>
          <p className="text-xs font-mono text-os-muted mt-1">Create your account</p>
        </div>

        <div className="os-card">
          <p className="os-label mb-5">Get Started</p>
          <form onSubmit={handleRegister} className="space-y-4">
            <Input label="Full Name" placeholder="Sai Khant" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              error={errors.name} required />
            <Input label="Email" type="email" placeholder="sai@saikhant.com" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              error={errors.email} required />
            <Input label="Password" type="password" placeholder="Min 8 characters" value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              error={errors.password} required />
            <Input label="Confirm Password" type="password" placeholder="Repeat password" value={form.confirmPassword}
              onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
              error={errors.confirmPassword} required />

            {globalError && (
              <p className="text-[11px] text-os-danger font-mono bg-os-danger/10 border border-os-danger/20 rounded px-3 py-2">
                {globalError}
              </p>
            )}

            <Button type="submit" loading={loading} className="w-full justify-center min-h-[44px]">
              Create Account
            </Button>
          </form>

          <p className="text-center text-[11px] font-mono text-os-muted mt-4">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-os-accent hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

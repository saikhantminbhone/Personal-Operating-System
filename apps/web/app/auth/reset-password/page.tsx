'use client'
import { useState } from 'react'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Hexagon, Mail, Check } from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      // In production, this would call /auth/forgot-password
      // For now, we show the success state (email sending via SendGrid)
      await new Promise(r => setTimeout(r, 1000)) // Simulate API call
      setSent(true)
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email')
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
          <h1 className="text-xl font-mono font-bold">SAIKHANT OS</h1>
        </div>

        <div className="os-card">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-os-success/15 flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-os-success" />
              </div>
              <p className="text-sm font-mono font-bold text-os-success mb-2">Check your email</p>
              <p className="text-xs font-mono text-os-muted mb-4">
                We sent a password reset link to <span className="text-os-text">{email}</span>
              </p>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">← Back to Login</Button>
              </Link>
            </div>
          ) : (
            <>
              <p className="os-label mb-1">Reset Password</p>
              <p className="text-xs font-mono text-os-muted mb-5">Enter your email and we'll send a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Email" type="email" placeholder="sai@saikhant.com" value={email}
                  onChange={e => setEmail(e.target.value)} error={error} required />
                <Button type="submit" loading={loading} className="w-full justify-center">
                  <Mail className="w-3 h-3" /> Send Reset Link
                </Button>
              </form>
              <p className="text-center text-[11px] font-mono text-os-muted mt-4">
                Remember your password?{' '}
                <Link href="/auth/login" className="text-os-accent hover:underline">Sign In</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

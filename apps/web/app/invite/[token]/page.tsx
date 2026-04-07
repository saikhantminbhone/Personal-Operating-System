'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/Button'
import { Hexagon, Users, Check, X } from 'lucide-react'
import Link from 'next/link'

export default function InvitePage() {
  const { token } = useParams()
  const { data: session, status } = useSession()
  const router = useRouter()
  const [state, setState] = useState<'loading' | 'ready' | 'accepting' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')
  const [orgName, setOrgName] = useState('')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      // Save invite token and redirect to login
      localStorage.setItem('pendingInvite', token as string)
      router.push(`/auth/login?callbackUrl=/invite/${token}`)
      return
    }
    setState('ready')
  }, [session, status, token, router])

  async function handleAccept() {
    setState('accepting')
    try {
      const result = await api.post(`/organizations/invites/${token}/accept`)
      setState('success')
      setTimeout(() => router.push('/dashboard/team'), 2000)
    } catch (err: any) {
      setState('error')
      setError(err.message || 'This invitation is invalid or has expired')
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
        </div>

        <div className="os-card text-center">
          {state === 'loading' && (
            <div className="py-8">
              <div className="w-6 h-6 border-2 border-os-accent/30 border-t-os-accent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-mono text-os-muted">Verifying invitation...</p>
            </div>
          )}

          {state === 'ready' && (
            <>
              <div className="w-14 h-14 rounded-xl bg-os-accent/10 flex items-center justify-center mx-auto mb-4">
                <Users className="w-7 h-7 text-os-accent" />
              </div>
              <h2 className="text-base font-mono font-bold text-os-text mb-2">Team Invitation</h2>
              <p className="text-xs font-mono text-os-muted mb-6">
                You've been invited to join an organization on Saikhant OS. Accept to collaborate on shared projects and goals.
              </p>
              <div className="flex gap-3">
                <Button className="flex-1 justify-center" onClick={handleAccept}>
                  <Check className="w-3 h-3" /> Accept Invitation
                </Button>
                <Button variant="ghost" onClick={() => router.push('/dashboard')}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </>
          )}

          {state === 'accepting' && (
            <div className="py-8">
              <div className="w-6 h-6 border-2 border-os-accent/30 border-t-os-accent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-mono text-os-muted">Joining organization...</p>
            </div>
          )}

          {state === 'success' && (
            <div className="py-8">
              <div className="w-12 h-12 rounded-full bg-os-success/15 flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-os-success" />
              </div>
              <p className="text-sm font-mono font-bold text-os-success mb-2">Welcome to the team!</p>
              <p className="text-xs font-mono text-os-muted">Redirecting to your team dashboard...</p>
            </div>
          )}

          {state === 'error' && (
            <div className="py-8">
              <div className="w-12 h-12 rounded-full bg-os-danger/15 flex items-center justify-center mx-auto mb-4">
                <X className="w-6 h-6 text-os-danger" />
              </div>
              <p className="text-sm font-mono font-bold text-os-danger mb-2">Invitation Invalid</p>
              <p className="text-xs font-mono text-os-muted mb-4">{error}</p>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">Go to Dashboard</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

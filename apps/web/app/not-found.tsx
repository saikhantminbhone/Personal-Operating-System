import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-os-bg flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-6xl font-mono font-bold text-os-accent mb-4">404</div>
        <p className="text-os-muted font-mono text-sm mb-6">Page not found</p>
        <Link href="/auth/login"
          className="px-6 py-3 bg-os-accent/15 text-os-accent border border-os-accent/20 rounded font-mono text-xs tracking-widest uppercase hover:bg-os-accent/25 transition-all">
          Go to Login
        </Link>
      </div>
    </div>
  )
}

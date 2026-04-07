'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SessionProvider, useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { setAuthToken } from '@/lib/api'

function TokenSync() {
  const { data: session } = useSession()
  useEffect(() => {
    if (session?.accessToken) {
      setAuthToken(session.accessToken as string)
    } else {
      setAuthToken(null)
    }
  }, [session])
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () => new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 2,
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    })
  )

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <TokenSync />
        {children}
      </QueryClientProvider>
    </SessionProvider>
  )
}

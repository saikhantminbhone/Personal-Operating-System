'use client'
import { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

export function OfflineIndicator() {
  const [online, setOnline] = useState(true)
  const [showReconnected, setShowReconnected] = useState(false)

  useEffect(() => {
    setOnline(navigator.onLine)

    const handleOffline = () => {
      setOnline(false)
      setShowReconnected(false)
    }

    const handleOnline = () => {
      setOnline(true)
      setShowReconnected(true)
      const timer = setTimeout(() => setShowReconnected(false), 3000)
      return () => clearTimeout(timer)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (online && !showReconnected) return null

  return (
    <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-[99998] transition-all duration-300 ${
      online ? 'bg-os-success' : 'bg-os-danger'
    } text-white text-[11px] font-mono px-4 py-2 rounded-full flex items-center gap-2 shadow-lg whitespace-nowrap`}>
      {online ? (
        <><Wifi className="w-3 h-3" /> Back online — syncing...</>
      ) : (
        <><WifiOff className="w-3 h-3" /> Offline — changes will sync when reconnected</>
      )}
    </div>
  )
}

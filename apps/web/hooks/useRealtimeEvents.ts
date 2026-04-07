'use client'
import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/store/useAppStore'

export function useRealtimeEvents() {
  const { data: session } = useSession()
  const qc = useQueryClient()
  const { showToast } = useAppStore()
  const socketRef = useRef<any>(null)

  useEffect(() => {
    if (!session?.accessToken) return

    let socket: any = null

    const connect = async () => {
      try {
        const { io } = await import('socket.io-client')
        socket = io(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')||'http://localhost:3001'}/events`, {
          auth: { token: session.accessToken },
          transports: ['websocket', 'polling'],
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
        })

        socket.on('connect', () => console.log('🔌 Real-time connected'))
        socket.on('disconnect', () => console.log('🔌 Real-time disconnected'))

        socket.on('notification', (data: any) => {
          qc.invalidateQueries({ queryKey: ['notifications'] })
          showToast(data.title || 'New notification')
        })

        socket.on('dashboard:update', () => {
          qc.invalidateQueries({ queryKey: ['analytics'] })
        })

        socket.on('task:completed', () => {
          qc.invalidateQueries({ queryKey: ['tasks'] })
          qc.invalidateQueries({ queryKey: ['analytics'] })
        })

        socket.on('goal:progress', () => {
          qc.invalidateQueries({ queryKey: ['goals'] })
        })

        socket.on('streak:update', (data: any) => {
          qc.invalidateQueries({ queryKey: ['analytics'] })
          if (data.streak > 0 && data.streak % 7 === 0) {
            showToast(`🔥 ${data.streak}-day streak! Keep going!`)
          }
        })

        socketRef.current = socket
      } catch (err) {
        console.warn('Real-time connection failed — offline mode')
      }
    }

    connect()

    return () => {
      socket?.disconnect()
      socketRef.current = null
    }
  }, [session?.accessToken])

  return socketRef
}

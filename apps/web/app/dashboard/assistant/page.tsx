'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AssistantPage() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard/ai') }, [router])
  return null
}

import { useQuery, useMutation } from '@tanstack/react-query'
import { aiApi } from '@/lib/api'
import { useState } from 'react'

export function useAiBriefing() {
  return useQuery({
    queryKey: ['ai', 'briefing'],
    queryFn: () => aiApi.briefing(),
    staleTime: 1000 * 60 * 30,
  })
}

export function useAiChat() {
  const [history, setHistory] = useState<any[]>([])
  const mutation = useMutation({
    mutationFn: (message: string) => aiApi.chat(message, history),
    onSuccess: (data: any) => setHistory(data.conversationHistory || []),
  })
  return { ...mutation, history, clearHistory: () => setHistory([]) }
}

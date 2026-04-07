import { useQuery, useMutation } from '@tanstack/react-query'
import { aiApi, getAuthToken } from '@/lib/api'
import { useState, useCallback } from 'react'

export function useAiBriefing() {
  return useQuery({
    queryKey: ['ai', 'briefing'],
    queryFn: () => aiApi.briefing(),
    staleTime: 1000 * 60 * 30,
  })
}

export function useAiChat() {
  const [history, setHistory] = useState<any[]>([])
  const [streamingText, setStreamingText] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  const sendMessage = useCallback(async (message: string) => {
    setIsStreaming(true)
    setStreamingText('')

    // Optimistically add user message to history
    const newHistory = [...history, { role: 'user', content: message }]
    setHistory(newHistory)

    try {
      const token = getAuthToken()
      // Fallback to NextAuth session if no in-memory token
      let authHeader = token ? `Bearer ${token}` : ''
      if (!authHeader) {
        try {
          const { getSession } = await import('next-auth/react')
          const session = await getSession()
          if ((session as any)?.accessToken) {
            authHeader = `Bearer ${(session as any).accessToken}`
          }
        } catch {}
      }

      const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
      const res = await fetch(`${BASE_URL}/ai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({ message, conversationHistory: history }),
      })

      if (!res.ok || !res.body) {
        throw new Error('Stream request failed')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.type === 'chunk' && data.text) {
              accumulated += data.text
              setStreamingText(accumulated)
            } else if (data.type === 'done') {
              const finalHistory = data.conversationHistory || [...newHistory, { role: 'assistant', content: accumulated }]
              setStreamingText('')
              setHistory(finalHistory)
            }
          } catch {}
        }
      }
    } catch (err) {
      // Fallback to non-streaming on error
      try {
        const result: any = await aiApi.chat(message, history)
        const assistantMsg = result.conversationHistory?.slice(-1)[0]
        setHistory(result.conversationHistory || newHistory)
        setStreamingText('')
      } catch {}
    } finally {
      setIsStreaming(false)
      setStreamingText('')
    }
  }, [history])

  return {
    sendMessage,
    history,
    streamingText,
    isStreaming,
    clearHistory: () => { setHistory([]); setStreamingText('') },
  }
}

// ── Phase 2: Intelligence hooks ──────────────────────────────────────────────

export function useAiCategorizeTx() {
  return useMutation({
    mutationFn: ({ description, amount, type }: { description: string; amount: number; type: string }) =>
      aiApi.categorizeTransaction(description, amount, type),
  })
}

export function useAiCategorizeNote() {
  return useMutation({
    mutationFn: ({ title, content }: { title: string; content?: string }) =>
      aiApi.categorizeNote(title, content),
  })
}

export function useAiSuggestGoal() {
  return useMutation({
    mutationFn: (taskTitle: string) => aiApi.suggestGoal(taskTitle),
  })
}

export function useAiSemanticSearch() {
  return useMutation({
    mutationFn: ({ query, results }: { query: string; results: any[] }) =>
      aiApi.semanticSearch(query, results),
  })
}

export function useAiRecordFeedback() {
  return useMutation({
    mutationFn: ({ feature, input, suggestion, accepted }: {
      feature: string
      input: string
      suggestion: string
      accepted: boolean
    }) => aiApi.recordFeedback(feature, input, suggestion, accepted),
  })
}

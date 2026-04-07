import { useQuery, useMutation } from '@tanstack/react-query'
import { aiApi } from '@/lib/api'
import { useState, useCallback, useRef } from 'react'

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

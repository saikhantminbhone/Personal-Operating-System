import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { goalsApi } from '@/lib/api'
import type { Goal, CreateGoalDto, UpdateGoalDto } from '@/types'

export const GOALS_KEY = ['goals']

export function useGoals(params?: { status?: string; pillar?: string }) {
  return useQuery<Goal[]>({
    queryKey: [...GOALS_KEY, params],
    queryFn: () => goalsApi.list(params),
    retry: false,
  })
}

export function useGoal(id: string) {
  return useQuery<Goal>({
    queryKey: [...GOALS_KEY, id],
    queryFn: () => goalsApi.get(id),
    enabled: !!id,
    retry: false,
  })
}

export function useCreateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateGoalDto) => goalsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: GOALS_KEY }),
  })
}

export function useUpdateGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGoalDto }) => goalsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: GOALS_KEY }),
  })
}

export function useDeleteGoal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => goalsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: GOALS_KEY }),
  })
}

export function useAddKeyResult() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ goalId, data }: { goalId: string; data: any }) => goalsApi.addKeyResult(goalId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: GOALS_KEY }),
  })
}

export function useUpdateKeyResult() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ goalId, krId, data }: { goalId: string; krId: string; data: any }) =>
      goalsApi.updateKeyResult(goalId, krId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: GOALS_KEY }),
  })
}

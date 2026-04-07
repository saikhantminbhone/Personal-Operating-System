import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { tasksApi } from '@/lib/api'
import type { Task, CreateTaskDto, UpdateTaskDto } from '@/types'

export const TASKS_KEY = ['tasks']

export function useTasks(params?: any) {
  return useQuery<{ data: Task[]; total: number; totalPages: number }>({
    queryKey: [...TASKS_KEY, params],
    queryFn: () => tasksApi.list(params),
    retry: false,
  })
}

export function useFocusQueue(energyLevel?: number) {
  return useQuery<Task[]>({
    queryKey: [...TASKS_KEY, 'focus', energyLevel],
    queryFn: () => tasksApi.focusQueue(energyLevel),
    retry: false,
  })
}

export function useTodayTaskStats() {
  return useQuery<{ doneToday: number; pending: number }>({
    queryKey: [...TASKS_KEY, 'stats', 'today'],
    queryFn: () => tasksApi.todayStats(),
    refetchInterval: 30000,
    retry: false,
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateTaskDto) => tasksApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskDto }) => tasksApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  })
}

export function useCompleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tasksApi.complete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => tasksApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: TASKS_KEY }),
  })
}

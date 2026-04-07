import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/lib/api'
import type { DashboardStats } from '@/types'

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => analyticsApi.dashboard(),
    refetchInterval: 60000,
    retry: false,
  })
}

export function useGoalsByPillar() {
  return useQuery({
    queryKey: ['analytics', 'goals', 'pillar'],
    queryFn: () => analyticsApi.goalsByPillar(),
    retry: false,
  })
}

export function useProductivityTrend(days = 30) {
  return useQuery({
    queryKey: ['analytics', 'trend', days],
    queryFn: () => analyticsApi.productivityTrend(days),
    retry: false,
  })
}

export function useHabitHeatmap() {
  return useQuery({
    queryKey: ['analytics', 'heatmap'],
    queryFn: () => analyticsApi.habitHeatmap(),
    retry: false,
  })
}

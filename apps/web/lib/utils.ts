import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const PILLAR_META: Record<string, { label: string; color: string; icon: string }> = {
  GROWTH:   { label: 'Growth',   color: '#64ffda', icon: '🎯' },
  HEALTH:   { label: 'Health',   color: '#22c55e', icon: '💪' },
  WORK:     { label: 'Work',     color: '#00b4d8', icon: '💼' },
  PERSONAL: { label: 'Personal', color: '#a78bfa', icon: '🌱' },
  FINANCE:  { label: 'Finance',  color: '#f59e0b', icon: '💰' },
}

export const PRIORITY_META: Record<string, { label: string; color: string }> = {
  LOW:    { label: 'Low',    color: '#64748b' },
  MEDIUM: { label: 'Medium', color: '#f59e0b' },
  HIGH:   { label: 'High',   color: '#ef4444' },
  URGENT: { label: 'Urgent', color: '#dc2626' },
}

export const ENERGY_META = [
  { label: 'Drained',  icon: '🪫', color: '#ef4444' },
  { label: 'Low',      icon: '😐', color: '#f97316' },
  { label: 'Moderate', icon: '⚡', color: '#eab308' },
  { label: 'Peak',     icon: '🔥', color: '#22c55e' },
]

export function progressColor(pct: number): string {
  if (pct >= 80) return '#22c55e'
  if (pct >= 50) return '#64ffda'
  if (pct >= 25) return '#f59e0b'
  return '#ef4444'
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function timeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(date)
}

export function formatCurrency(cents: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency,
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(Math.abs(cents) / 100)
  } catch {
    return `${currency} ${(Math.abs(cents) / 100).toFixed(0)}`
  }
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n - 1) + '…' : str
}

export function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

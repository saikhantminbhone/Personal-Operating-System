import axios, { AxiosInstance, AxiosError } from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

// Store token in memory after login
let _token: string | null = null

export function setAuthToken(token: string | null) {
  _token = token
}

export function getAuthToken() {
  return _token
}

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 20000,
  })

  client.interceptors.request.use(async (config) => {
    // First try in-memory token
    if (_token) {
      config.headers.Authorization = `Bearer ${_token}`
      return config
    }

    // Fallback: get from NextAuth session
    try {
      const { getSession } = await import('next-auth/react')
      const session = await getSession()
      if (session?.accessToken) {
        _token = session.accessToken as string
        config.headers.Authorization = `Bearer ${session.accessToken}`
      }
    } catch {}

    return config
  })

  client.interceptors.response.use(
    (response) => response.data,
    (error: AxiosError<{ message: string | string[] }>) => {
      if (error.response?.status === 401) {
        _token = null
        // Notify the app that the session has expired
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('session-expired'))
        }
      }
      const raw = error.response?.data?.message || error.message || 'Request failed'
      // NestJS ValidationPipe returns an array of messages — show the first one
      const msg = Array.isArray(raw) ? raw[0] : raw
      return Promise.reject(new Error(msg))
    },
  )

  return client
}

export const api = createApiClient()

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; name: string; password: string; timezone?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  checkin: (energyLevel: number) => api.post('/auth/checkin', { energyLevel }),
  updateProfile: (data: any) => api.patch('/users/profile', data),
}

// ── GOALS ─────────────────────────────────────────────────────────────────────
export const goalsApi = {
  list: (params?: any) => api.get('/goals', { params }),
  get: (id: string) => api.get(`/goals/${id}`),
  create: (data: any) => api.post('/goals', data),
  update: (id: string, data: any) => api.patch(`/goals/${id}`, data),
  delete: (id: string) => api.delete(`/goals/${id}`),
  addKeyResult: (goalId: string, data: any) => api.post(`/goals/${goalId}/key-results`, data),
  updateKeyResult: (goalId: string, krId: string, data: any) =>
    api.patch(`/goals/${goalId}/key-results/${krId}`, data),
  deleteKeyResult: (goalId: string, krId: string) =>
    api.delete(`/goals/${goalId}/key-results/${krId}`),
}

// ── TASKS ─────────────────────────────────────────────────────────────────────
export const tasksApi = {
  list: (params?: any) => api.get('/tasks', { params }),
  focusQueue: (energyLevel?: number) =>
    api.get('/tasks/focus-queue', { params: energyLevel !== undefined ? { energyLevel } : {} }),
  todayStats: () => api.get('/tasks/stats/today'),
  get: (id: string) => api.get(`/tasks/${id}`),
  create: (data: any) => api.post('/tasks', data),
  update: (id: string, data: any) => api.patch(`/tasks/${id}`, data),
  complete: (id: string) => api.patch(`/tasks/${id}/complete`),
  delete: (id: string) => api.delete(`/tasks/${id}`),
}

// ── ANALYTICS ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard'),
  goalsByPillar: () => api.get('/analytics/goals/by-pillar'),
  productivityTrend: (days?: number) => api.get('/analytics/productivity/trend', { params: { days } }),
  habitHeatmap: () => api.get('/analytics/habits/heatmap'),
}

// ── AI ────────────────────────────────────────────────────────────────────────
export const aiApi = {
  briefing: () => api.get('/ai/briefing'),
  chat: (message: string, conversationHistory?: any[]) =>
    api.post('/ai/chat', { message, conversationHistory }),
  chatHistory: () => api.get('/ai/chat/history'),
  // Phase 2 intelligence
  categorizeTransaction: (description: string, amount: number, type: string) =>
    api.post('/ai/categorize/transaction', { description, amount, type }),
  categorizeNote: (title: string, content?: string) =>
    api.post('/ai/categorize/note', { title, content }),
  suggestGoal: (taskTitle: string) =>
    api.post('/ai/suggest/goal', { taskTitle }),
  semanticSearch: (query: string, results: any[]) =>
    api.post('/ai/search/semantic', { query, results }),
}

// ── HABITS ────────────────────────────────────────────────────────────────────
export const habitsApi = {
  list: () => api.get('/habits'),
  today: () => api.get('/habits/today'),
  weekly: () => api.get('/habits/weekly'),
  get: (id: string) => api.get(`/habits/${id}`),
  create: (data: any) => api.post('/habits', data),
  update: (id: string, data: any) => api.patch(`/habits/${id}`, data),
  archive: (id: string) => api.delete(`/habits/${id}`),
  log: (id: string, data?: any) => api.post(`/habits/${id}/log`, data || {}),
  unlog: (id: string, logId: string) => api.delete(`/habits/${id}/log/${logId}`),
}

// ── FINANCE ───────────────────────────────────────────────────────────────────
export const financeApi = {
  accounts: () => api.get('/finance/accounts'),
  createAccount: (data: any) => api.post('/finance/accounts', data),
  deleteAccount: (id: string) => api.delete(`/finance/accounts/${id}`),
  transactions: (params?: any) => api.get('/finance/transactions', { params }),
  createTransaction: (data: any) => api.post('/finance/transactions', data),
  deleteTransaction: (id: string) => api.delete(`/finance/transactions/${id}`),
  summary: (year?: number, month?: number) =>
    api.get('/finance/summary', { params: { year, month } }),
  netWorth: () => api.get('/finance/net-worth'),
  categories: () => api.get('/finance/categories'),
}

// ── KNOWLEDGE ─────────────────────────────────────────────────────────────────
export const knowledgeApi = {
  notes: (params?: any) => api.get('/knowledge/notes', { params }),
  dailyNote: () => api.get('/knowledge/notes/daily'),
  stats: () => api.get('/knowledge/notes/stats'),
  getNote: (id: string) => api.get(`/knowledge/notes/${id}`),
  createNote: (data: any) => api.post('/knowledge/notes', data),
  updateNote: (id: string, data: any) => api.patch(`/knowledge/notes/${id}`, data),
  deleteNote: (id: string) => api.delete(`/knowledge/notes/${id}`),
  collections: () => api.get('/knowledge/collections'),
  createCollection: (data: any) => api.post('/knowledge/collections', data),
  deleteCollection: (id: string) => api.delete(`/knowledge/collections/${id}`),
}

// ── PROJECTS ──────────────────────────────────────────────────────────────────
export const projectsApi = {
  list: () => api.get('/projects'),
  get: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: string, data: any) => api.patch(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  kanban: (id: string) => api.get(`/projects/${id}/kanban`),
  createSprint: (id: string, data: any) => api.post(`/projects/${id}/sprints`, data),
}

// ── BILLING ───────────────────────────────────────────────────────────────────
export const billingApi = {
  plans: () => api.get('/billing/plans'),
  subscription: () => api.get('/billing/subscription'),
  checkout: (plan: string) => api.post('/billing/checkout', { plan }),
  portal: () => api.post('/billing/portal'),
  checkLimit: (resource: string) => api.get(`/billing/limit/${resource}`),
}

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: (limit?: number) => api.get('/notifications', { params: { limit } }),
  unreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: string) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
}

// ── SEARCH ────────────────────────────────────────────────────────────────────
export const searchApi = {
  search: (q: string, types?: string[], limit?: number) =>
    api.get('/search', { params: { q, types: types?.join(','), limit } }),
  reindex: () => api.post('/search/reindex'),
}

// ── ORGANIZATIONS ─────────────────────────────────────────────────────────────
export const orgsApi = {
  list: () => api.get('/organizations'),
  get: (id: string) => api.get(`/organizations/${id}`),
  create: (data: any) => api.post('/organizations', data),
  update: (id: string, data: any) => api.patch(`/organizations/${id}`, data),
  delete: (id: string) => api.delete(`/organizations/${id}`),
  members: (id: string) => api.get(`/organizations/${id}/members`),
  invite: (id: string, data: any) => api.post(`/organizations/${id}/invite`, data),
  removeMember: (orgId: string, memberId: string) =>
    api.delete(`/organizations/${orgId}/members/${memberId}`),
  leave: (id: string) => api.post(`/organizations/${id}/leave`),
  stats: (id: string) => api.get(`/organizations/${id}/stats`),
  acceptInvite: (token: string) => api.post(`/organizations/invites/${token}/accept`),
}

// ── API KEYS ──────────────────────────────────────────────────────────────────
export const apiKeysApi = {
  list: () => api.get('/api-keys'),
  create: (data: any) => api.post('/api-keys', data),
  revoke: (id: string) => api.delete(`/api-keys/${id}`),
  scopes: () => api.get('/api-keys/scopes'),
}

// ─── ENUMS ────────────────────────────────────────────────────────────────────

export enum GoalPillar {
  GROWTH = 'GROWTH',
  HEALTH = 'HEALTH',
  WORK = 'WORK',
  PERSONAL = 'PERSONAL',
  FINANCE = 'FINANCE',
}

export enum GoalStatus {
  ACTIVE = 'ACTIVE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
  ARCHIVED = 'ARCHIVED',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum HabitFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  CUSTOM = 'CUSTOM',
}

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER',
}

export enum UserPlan {
  FREE = 'FREE',
  PRO = 'PRO',
  TEAM = 'TEAM',
  ENTERPRISE = 'ENTERPRISE',
}

// ─── SHARED TYPES ────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ApiError {
  success: false
  error: string
  message: string
  statusCode: number
}

// ─── USER TYPES ───────────────────────────────────────────────────────────────

export interface User {
  id: string
  email: string
  name: string
  avatarUrl?: string
  timezone: string
  energyLevel?: number
  streakCount: number
  lastCheckinAt?: string
  plan: UserPlan
  createdAt: string
}

// ─── GOAL TYPES ───────────────────────────────────────────────────────────────

export interface KeyResult {
  id: string
  goalId: string
  title: string
  metricType: 'PERCENTAGE' | 'NUMBER' | 'BOOLEAN' | 'CURRENCY'
  currentValue: number
  targetValue: number
  unit?: string
  createdAt: string
  updatedAt: string
}

export interface Goal {
  id: string
  userId: string
  title: string
  description?: string
  pillar: GoalPillar
  status: GoalStatus
  progress: number
  targetDate?: string
  parentGoalId?: string
  aiInsight?: string
  keyResults?: KeyResult[]
  createdAt: string
  updatedAt: string
}

export interface CreateGoalDto {
  title: string
  description?: string
  pillar: GoalPillar
  targetDate?: string
  parentGoalId?: string
}

export interface UpdateGoalDto {
  title?: string
  description?: string
  pillar?: GoalPillar
  status?: GoalStatus
  progress?: number
  targetDate?: string
  aiInsight?: string
}

export interface CreateKeyResultDto {
  goalId: string
  title: string
  metricType: 'PERCENTAGE' | 'NUMBER' | 'BOOLEAN' | 'CURRENCY'
  targetValue: number
  unit?: string
}

export interface UpdateKeyResultDto {
  title?: string
  currentValue?: number
  targetValue?: number
}

// ─── TASK TYPES ───────────────────────────────────────────────────────────────

export interface Task {
  id: string
  userId: string
  goalId?: string
  projectId?: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  energyRequired: number
  estimatedMinutes?: number
  dueDate?: string
  completedAt?: string
  recurrenceRule?: string
  tags: string[]
  goal?: Pick<Goal, 'id' | 'title' | 'pillar'>
  createdAt: string
  updatedAt: string
}

export interface CreateTaskDto {
  title: string
  description?: string
  goalId?: string
  projectId?: string
  priority?: TaskPriority
  energyRequired?: number
  estimatedMinutes?: number
  dueDate?: string
  recurrenceRule?: string
  tags?: string[]
}

export interface UpdateTaskDto {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  energyRequired?: number
  estimatedMinutes?: number
  dueDate?: string
  tags?: string[]
  goalId?: string
}

// ─── ANALYTICS TYPES ─────────────────────────────────────────────────────────

export interface DashboardStats {
  streakCount: number
  energyLevel: number | null
  activeGoalsCount: number
  tasksDoneToday: number
  tasksPendingCount: number
  overallGoalProgress: number
  habitsCompletedToday: number
  totalHabits: number
}

export interface GoalProgressByPillar {
  pillar: GoalPillar
  avgProgress: number
  goalsCount: number
}

// ─── AI TYPES ─────────────────────────────────────────────────────────────────

export interface DailyBriefing {
  date: string
  energyGreeting: string
  topTasks: Task[]
  goalInsights: string[]
  habitReminders: string[]
  motivationalNote: string
}

export interface AiPlanRequest {
  energyLevel: number
  focusArea?: GoalPillar
  availableMinutes?: number
}

// All shared types - no external package dependency

export enum GoalPillar { GROWTH = 'GROWTH', HEALTH = 'HEALTH', WORK = 'WORK', PERSONAL = 'PERSONAL', FINANCE = 'FINANCE' }
export enum GoalStatus { ACTIVE = 'ACTIVE', PAUSED = 'PAUSED', COMPLETED = 'COMPLETED', ARCHIVED = 'ARCHIVED' }
export enum TaskStatus { TODO = 'TODO', IN_PROGRESS = 'IN_PROGRESS', DONE = 'DONE', CANCELLED = 'CANCELLED' }
export enum TaskPriority { LOW = 'LOW', MEDIUM = 'MEDIUM', HIGH = 'HIGH', URGENT = 'URGENT' }
export enum UserPlan { FREE = 'FREE', PRO = 'PRO', TEAM = 'TEAM', ENTERPRISE = 'ENTERPRISE' }
export enum HabitFrequency { DAILY = 'DAILY', WEEKLY = 'WEEKLY', CUSTOM = 'CUSTOM' }
export enum NoteType { NOTE = 'NOTE', DAILY = 'DAILY', MEETING = 'MEETING', BOOK_REVIEW = 'BOOK_REVIEW', PROJECT_RETRO = 'PROJECT_RETRO' }
export enum ProjectStatus { PLANNING = 'PLANNING', ACTIVE = 'ACTIVE', ON_HOLD = 'ON_HOLD', COMPLETED = 'COMPLETED', CANCELLED = 'CANCELLED' }

export interface KeyResult {
  id: string; goalId: string; title: string
  metricType: 'PERCENTAGE' | 'NUMBER' | 'BOOLEAN' | 'CURRENCY'
  currentValue: number; targetValue: number; unit?: string
  createdAt: string; updatedAt: string
}

export interface Goal {
  id: string; userId: string; title: string; description?: string
  pillar: GoalPillar; status: GoalStatus; progress: number
  targetDate?: string; parentGoalId?: string; aiInsight?: string
  keyResults?: KeyResult[]
  createdAt: string; updatedAt: string; deletedAt?: string
}

export interface Task {
  id: string; userId: string; goalId?: string; projectId?: string
  title: string; description?: string; status: TaskStatus; priority: TaskPriority
  energyRequired: number; estimatedMinutes?: number; dueDate?: string
  completedAt?: string; tags: string[]
  goal?: { id: string; title: string; pillar: string }
  project?: { id: string; title: string }
  createdAt: string; updatedAt: string; deletedAt?: string
}

export interface Habit {
  id: string; userId: string; title: string; description?: string
  frequency: HabitFrequency; frequencyDays: number[]; targetCount: number
  currentStreak: number; longestStreak: number; totalCompleted: number
  color?: string; icon?: string; order: number
  completedToday?: boolean; loggedToday?: any
  createdAt: string; updatedAt: string; archivedAt?: string
}

export interface Note {
  id: string; userId: string; collectionId?: string
  title: string; content?: string; type: NoteType
  tags: string[]; sourceUrl?: string; pinned: boolean
  aiSummary?: string; wordCount: number
  collection?: Collection
  createdAt: string; updatedAt: string; deletedAt?: string
}

export interface Collection {
  id: string; userId: string; name: string; description?: string
  color?: string; icon?: string; parentId?: string
  noteCount?: number
  createdAt: string; updatedAt: string
}

export interface Account {
  id: string; userId: string; name: string; type: string
  currencyCode: string; balanceCents: number
  color?: string; icon?: string; isDefault: boolean
  createdAt: string; updatedAt: string
}

export interface Transaction {
  id: string; accountId: string; userId: string; categoryId?: string
  amountCents: number; currencyCode: string; type: string
  description?: string; transactionDate: string
  account?: { id: string; name: string; type: string }
  category?: { id: string; name: string }
  createdAt: string; updatedAt: string
}

export interface Project {
  id: string; userId: string; goalId?: string
  title: string; description?: string; status: ProjectStatus
  color?: string; startDate?: string; targetDate?: string
  goal?: { id: string; title: string; pillar: string }
  _count?: { tasks: number }
  createdAt: string; updatedAt: string; deletedAt?: string
}

export interface DashboardStats {
  streakCount: number; energyLevel: number | null; lastCheckinAt?: string
  activeGoalsCount: number; tasksDoneToday: number; tasksPendingCount: number
  overallGoalProgress: number; habitsCompletedToday: number; totalHabits: number; totalWins: number
}

export interface Organization {
  id: string; name: string; slug: string; avatarUrl?: string
  plan: UserPlan; maxMembers: number
  members?: OrgMember[]
  _count?: { members: number }
  createdAt: string; updatedAt: string
}

export interface OrgMember {
  id: string; organizationId: string; userId: string; role: string
  invitedAt: string; joinedAt?: string
  user: { id: string; name: string; email: string; avatarUrl?: string }
}

export interface ApiKey {
  id: string; userId: string; name: string
  keyPrefix: string; scopes: string[]
  lastUsedAt?: string; expiresAt?: string; requestCount: number
  createdAt: string
}

export interface Notification {
  id: string; userId: string; type: string
  title: string; body: string; data?: any
  read: boolean; readAt?: string; createdAt: string
}

// DTO types
export interface CreateGoalDto { title: string; description?: string; pillar: GoalPillar; targetDate?: string }
export interface UpdateGoalDto { title?: string; description?: string; pillar?: GoalPillar; status?: GoalStatus; progress?: number; targetDate?: string }
export interface CreateTaskDto { title: string; description?: string; goalId?: string; projectId?: string; priority?: TaskPriority; energyRequired?: number; estimatedMinutes?: number; dueDate?: string; tags?: string[] }
export interface UpdateTaskDto { title?: string; description?: string; status?: TaskStatus; priority?: TaskPriority; energyRequired?: number; estimatedMinutes?: number; dueDate?: string; tags?: string[]; goalId?: string }

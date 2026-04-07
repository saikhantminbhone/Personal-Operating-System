import { PrismaClient, GoalPillar, GoalStatus, TaskPriority, TaskStatus, UserPlan } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo user
  const passwordHash = await bcrypt.hash('demo123456', 12)
  
  const user = await prisma.user.upsert({
    where: { email: 'sai@saikhant.com' },
    update: {},
    create: {
      email: 'sai@saikhant.com',
      name: 'Sai Khant',
      timezone: 'Asia/Bangkok',
      plan: UserPlan.PRO,
      passwordHash,
      streakCount: 14,
      lastCheckinAt: new Date(),
      energyLevel: 2,
    },
  })

  console.log('✓ User created:', user.email)

  // Create goals
  const goals = await Promise.all([
    prisma.goal.upsert({
      where: { id: 'goal-1' },
      update: {},
      create: {
        id: 'goal-1',
        userId: user.id,
        title: 'Land Senior SWE role in Germany',
        description: 'Target TU Berlin / TU Munich ecosystem companies for EU Blue Card pathway',
        pillar: GoalPillar.WORK,
        status: GoalStatus.ACTIVE,
        progress: 35,
        targetDate: new Date('2026-12-31'),
      },
    }),
    prisma.goal.upsert({
      where: { id: 'goal-2' },
      update: {},
      create: {
        id: 'goal-2',
        userId: user.id,
        title: 'Launch Saikhant Labs OS to 100 beta users',
        description: 'Build, ship, and iterate the personal OS platform',
        pillar: GoalPillar.GROWTH,
        status: GoalStatus.ACTIVE,
        progress: 15,
        targetDate: new Date('2026-10-01'),
      },
    }),
    prisma.goal.upsert({
      where: { id: 'goal-3' },
      update: {},
      create: {
        id: 'goal-3',
        userId: user.id,
        title: 'Build daily workout habit — 4x/week',
        pillar: GoalPillar.HEALTH,
        status: GoalStatus.ACTIVE,
        progress: 60,
        targetDate: new Date('2026-07-01'),
      },
    }),
  ])

  console.log('✓ Goals created:', goals.length)

  // Create key results
  await Promise.all([
    prisma.keyResult.create({
      data: {
        goalId: 'goal-1',
        title: 'CV Score above 95/100',
        metricType: 'NUMBER',
        currentValue: 96,
        targetValue: 95,
        unit: 'score',
      },
    }),
    prisma.keyResult.create({
      data: {
        goalId: 'goal-1',
        title: 'Applications submitted',
        metricType: 'NUMBER',
        currentValue: 3,
        targetValue: 20,
        unit: 'applications',
      },
    }),
    prisma.keyResult.create({
      data: {
        goalId: 'goal-2',
        title: 'Modules shipped',
        metricType: 'NUMBER',
        currentValue: 2,
        targetValue: 8,
        unit: 'modules',
      },
    }),
    prisma.keyResult.create({
      data: {
        goalId: 'goal-2',
        title: 'Beta users acquired',
        metricType: 'NUMBER',
        currentValue: 0,
        targetValue: 100,
        unit: 'users',
      },
    }),
  ])

  console.log('✓ Key results created')

  // Create tasks
  await Promise.all([
    prisma.task.create({
      data: {
        userId: user.id,
        goalId: 'goal-1',
        title: 'Update LinkedIn headline with Senior SWE focus',
        priority: TaskPriority.HIGH,
        energyRequired: 2,
        estimatedMinutes: 30,
        status: TaskStatus.TODO,
        tags: ['career', 'linkedin'],
      },
    }),
    prisma.task.create({
      data: {
        userId: user.id,
        goalId: 'goal-1',
        title: 'Research top 10 Berlin tech companies hiring backend engineers',
        priority: TaskPriority.HIGH,
        energyRequired: 3,
        estimatedMinutes: 90,
        status: TaskStatus.TODO,
        tags: ['career', 'research'],
      },
    }),
    prisma.task.create({
      data: {
        userId: user.id,
        goalId: 'goal-2',
        title: 'Build Goals module backend — controllers, service, prisma',
        priority: TaskPriority.URGENT,
        energyRequired: 3,
        estimatedMinutes: 180,
        status: TaskStatus.IN_PROGRESS,
        tags: ['dev', 'backend'],
      },
    }),
    prisma.task.create({
      data: {
        userId: user.id,
        goalId: 'goal-2',
        title: 'Design dashboard UI components',
        priority: TaskPriority.MEDIUM,
        energyRequired: 2,
        estimatedMinutes: 120,
        status: TaskStatus.TODO,
        tags: ['dev', 'frontend'],
      },
    }),
    prisma.task.create({
      data: {
        userId: user.id,
        title: 'Reply to Anoc99 about PiAnalytics sidebar fix',
        priority: TaskPriority.HIGH,
        energyRequired: 1,
        estimatedMinutes: 20,
        status: TaskStatus.TODO,
        tags: ['work', 'pianalytics'],
      },
    }),
  ])

  console.log('✓ Tasks created')

  // Create habits
  await Promise.all([
    prisma.habit.create({
      data: {
        userId: user.id,
        title: 'Morning Workout',
        icon: '💪',
        color: '#22c55e',
        frequency: 'WEEKLY',
        frequencyDays: [1, 2, 4, 6],
        targetCount: 4,
        currentStreak: 3,
        longestStreak: 12,
        totalCompleted: 47,
        order: 1,
      },
    }),
    prisma.habit.create({
      data: {
        userId: user.id,
        title: 'Read 20 pages',
        icon: '📚',
        color: '#00B4D8',
        frequency: 'DAILY',
        targetCount: 1,
        currentStreak: 7,
        longestStreak: 21,
        totalCompleted: 89,
        order: 2,
      },
    }),
    prisma.habit.create({
      data: {
        userId: user.id,
        title: 'Code on personal project',
        icon: '💻',
        color: '#64ffda',
        frequency: 'DAILY',
        targetCount: 1,
        currentStreak: 14,
        longestStreak: 14,
        totalCompleted: 45,
        order: 3,
      },
    }),
    prisma.habit.create({
      data: {
        userId: user.id,
        title: 'Meditate 10 min',
        icon: '🧘',
        color: '#a78bfa',
        frequency: 'DAILY',
        targetCount: 1,
        currentStreak: 2,
        longestStreak: 30,
        totalCompleted: 62,
        order: 4,
      },
    }),
  ])

  console.log('✓ Habits created')

  // Create wins
  await Promise.all([
    prisma.win.create({
      data: {
        userId: user.id,
        title: 'Graduated with First Class Honours — GPA 3.85',
        details: 'BSc Applied Computing from University of Portsmouth',
        pillar: GoalPillar.GROWTH,
        date: new Date('2026-03-15'),
      },
    }),
    prisma.win.create({
      data: {
        userId: user.id,
        title: 'Launched saikhant.com portfolio',
        details: 'Dark Web3/cyberpunk aesthetic — fully deployed',
        pillar: GoalPillar.WORK,
        date: new Date('2026-03-20'),
      },
    }),
    prisma.win.create({
      data: {
        userId: user.id,
        title: 'CV score reached 96/100',
        details: 'After extensive multi-session rebuild targeting Senior SWE roles',
        pillar: GoalPillar.WORK,
        date: new Date('2026-04-01'),
      },
    }),
  ])

  console.log('✓ Wins created')
  console.log('\n🎉 Seed complete!')
  console.log('📧 Login: sai@saikhant.com')
  console.log('🔑 Password: demo123456')
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })

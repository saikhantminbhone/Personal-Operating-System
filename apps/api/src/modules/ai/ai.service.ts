import { Injectable, Logger } from '@nestjs/common'
import Anthropic from '@anthropic-ai/sdk'
import { PrismaService } from '../../common/prisma/prisma.service'

@Injectable()
export class AiService {
  private anthropic: Anthropic
  private readonly logger = new Logger(AiService.name)

  constructor(private prisma: PrismaService) {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }

  async getDailyBriefing(userId: string) {
    const [user, goals, tasks, habits] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.goal.findMany({ where: { userId, deletedAt: null, status: 'ACTIVE' }, take: 5 }),
      this.prisma.task.findMany({
        where: { userId, deletedAt: null, status: { in: ['TODO', 'IN_PROGRESS'] } },
        orderBy: [{ priority: 'desc' }],
        take: 10,
        include: { goal: { select: { title: true } } },
      }),
      this.prisma.habit.findMany({ where: { userId, archivedAt: null }, take: 5 }),
    ])

    const energyLabels = ['Drained', 'Low', 'Moderate', 'Peak']
    const energy = user?.energyLevel !== null && user?.energyLevel !== undefined
      ? energyLabels[user.energyLevel]
      : 'Unknown'

    const prompt = `You are the AI layer of ${user?.name}'s Personal Operating System. Generate a concise, motivating daily briefing.

Context:
- Energy level: ${energy}
- Streak: ${user?.streakCount} days
- Active goals: ${goals.map(g => `${g.title} (${g.progress}%)`).join(', ')}
- Top tasks: ${tasks.slice(0, 5).map(t => t.title).join(', ')}
- Habits to track: ${habits.map(h => h.title).join(', ')}
- Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}

Generate a JSON response with these exact fields:
{
  "greeting": "personalized energetic greeting based on energy level",
  "focusSuggestion": "one clear focus recommendation for today based on goals and energy",
  "topTasksTitles": ["task1", "task2", "task3"],
  "goalInsight": "one insight about goal progress",
  "habitReminder": "which habit to prioritize today",
  "motivationalNote": "short, genuine motivational message — not generic"
}

Respond ONLY with valid JSON, no other text.`

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      const briefing = JSON.parse(text)
      return { ...briefing, date: new Date().toISOString(), energyLevel: user?.energyLevel }
    } catch (err) {
      this.logger.error('AI briefing failed', err)
      return {
        greeting: `Good morning, ${user?.name}! Ready to make progress today?`,
        focusSuggestion: 'Focus on your highest priority task first.',
        topTasksTitles: tasks.slice(0, 3).map(t => t.title),
        goalInsight: `You have ${goals.length} active goals. Keep pushing.`,
        habitReminder: habits[0]?.title || 'Stay consistent with your habits.',
        motivationalNote: 'Every small step compounds into big results.',
        date: new Date().toISOString(),
        energyLevel: user?.energyLevel,
      }
    }
  }

  async chat(userId: string, message: string, conversationHistory: any[] = []) {
    const [user, goals, tasks] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.goal.findMany({ where: { userId, deletedAt: null, status: 'ACTIVE' }, take: 5 }),
      this.prisma.task.findMany({
        where: { userId, deletedAt: null, status: { in: ['TODO', 'IN_PROGRESS'] } },
        take: 5, orderBy: [{ priority: 'desc' }],
      }),
    ])

    const systemPrompt = `You are the AI assistant inside ${user?.name}'s Personal Operating System (Saikhant Labs OS).

You have full context about the user's life:
- Name: ${user?.name}
- Energy level: ${user?.energyLevel !== null ? ['Drained', 'Low', 'Moderate', 'Peak'][user?.energyLevel!] : 'Not checked in'}
- Current streak: ${user?.streakCount} days
- Active goals: ${goals.map(g => `"${g.title}" (${g.progress}%)`).join(', ')}
- Pending tasks: ${tasks.map(t => `"${t.title}" [${t.priority}]`).join(', ')}

You are their trusted chief of staff. Be direct, insightful, and action-oriented. 
Keep responses concise unless they ask for detail. 
You can help them: plan their day, analyze their goals, break down tasks, 
reflect on progress, manage their time, and think through decisions.`

    const messages = [
      ...conversationHistory.slice(-10),
      { role: 'user' as const, content: message },
    ]

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    })

    const aiMessage = response.content[0].type === 'text' ? response.content[0].text : ''

    // Save to DB
    await this.prisma.aiMessage.createMany({
      data: [
        { userId, role: 'user', content: message },
        { userId, role: 'assistant', content: aiMessage },
      ],
    })

    return {
      message: aiMessage,
      conversationHistory: [...messages, { role: 'assistant', content: aiMessage }],
    }
  }

  async getChatHistory(userId: string, limit = 50) {
    return this.prisma.aiMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })
  }
}

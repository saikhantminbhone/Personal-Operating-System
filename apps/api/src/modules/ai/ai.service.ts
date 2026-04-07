import { Injectable, Logger } from '@nestjs/common'
import { Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { PrismaService } from '../../common/prisma/prisma.service'

@Injectable()
export class AiService {
  private anthropic: Anthropic
  private readonly logger = new Logger(AiService.name)

  constructor(private prisma: PrismaService) {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }

  // ── Rich context builder ────────────────────────────────────────────────────

  private async buildUserContext(userId: string): Promise<string> {
    const [user, goals, tasks, habits, habitLogs, accounts, recentTx, recentNotes, projects] =
      await Promise.all([
        this.prisma.user.findUnique({ where: { id: userId } }),
        this.prisma.goal.findMany({
          where: { userId, deletedAt: null, status: 'ACTIVE' },
          include: { keyResults: { select: { title: true, currentValue: true, targetValue: true, unit: true } } },
        }),
        this.prisma.task.findMany({
          where: { userId, deletedAt: null, status: { in: ['TODO', 'IN_PROGRESS'] } },
          orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
          take: 10,
          include: { goal: { select: { title: true } } },
        }),
        this.prisma.habit.findMany({
          where: { userId, archivedAt: null },
          include: { logs: { where: { completedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }, select: { completedAt: true } } },
        }),
        this.prisma.habitLog.findMany({
          where: { userId, completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
          select: { habitId: true },
        }),
        this.prisma.account.findMany({ where: { userId }, select: { name: true, type: true, balanceCents: true, currencyCode: true } }),
        this.prisma.transaction.findMany({
          where: { userId, transactionDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
          orderBy: { transactionDate: 'desc' },
          take: 10,
          select: { description: true, amountCents: true, type: true, transactionDate: true },
        }),
        this.prisma.note.findMany({
          where: { userId, deletedAt: null },
          orderBy: { updatedAt: 'desc' },
          take: 5,
          select: { title: true, type: true, updatedAt: true, tags: true },
        }),
        this.prisma.project.findMany({
          where: { userId, deletedAt: null, status: { in: ['ACTIVE', 'PLANNING'] } },
          select: { title: true, status: true, _count: { select: { tasks: true } } },
        }),
      ])

    const energyLabels = ['Drained', 'Low', 'Moderate', 'Peak']
    const energy = user?.energyLevel != null ? energyLabels[user.energyLevel] : 'Not checked in'
    const completedHabitIds = new Set(habitLogs.map(l => l.habitId))
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

    const netWorthCents = accounts.reduce((sum, a) => sum + a.balanceCents, 0)
    const monthlyExpenses = recentTx.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amountCents, 0)
    const monthlyIncome   = recentTx.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amountCents, 0)

    const lines: string[] = [
      `User: ${user?.name} | Date: ${today}`,
      `Energy: ${energy} | Streak: ${user?.streakCount} days`,
      ``,
      `=== GOALS (${goals.length} active) ===`,
      ...goals.map(g => {
        const krs = g.keyResults.length
          ? `\n    KRs: ${g.keyResults.map(k => `${k.title} ${k.currentValue}/${k.targetValue}${k.unit ? ' ' + k.unit : ''}`).join('; ')}`
          : ''
        return `• ${g.title} — ${g.progress}% progress${krs}`
      }),
      ``,
      `=== TASKS (${tasks.length} pending) ===`,
      ...tasks.slice(0, 8).map(t => `• [${t.priority}] ${t.title}${t.goal ? ` → ${t.goal.title}` : ''}${t.dueDate ? ` (due ${new Date(t.dueDate).toLocaleDateString()})` : ''}`),
      ``,
      `=== HABITS (${habits.length} total) ===`,
      ...habits.map(h => {
        const streak = (h as any).currentStreak ?? 0
        const doneToday = completedHabitIds.has(h.id) ? '✓' : '○'
        const last7 = h.logs.length
        return `• ${doneToday} ${h.title} — streak: ${streak}d, last 7 days: ${last7}/${7}`
      }),
      ``,
      `=== FINANCE ===`,
      `Net worth: $${(netWorthCents / 100).toFixed(0)}`,
      `Last 30d — Income: $${(monthlyIncome / 100).toFixed(0)} | Expenses: $${(monthlyExpenses / 100).toFixed(0)}`,
      accounts.length ? `Accounts: ${accounts.map(a => `${a.name} ($${(a.balanceCents / 100).toFixed(0)})`).join(', ')}` : '',
      ``,
      `=== KNOWLEDGE (recent notes) ===`,
      ...recentNotes.map(n => `• [${n.type}] ${n.title}${n.tags?.length ? ` [${n.tags.join(', ')}]` : ''}`),
      ``,
      `=== PROJECTS ===`,
      ...projects.map(p => `• ${p.title} (${p.status}) — ${p._count.tasks} tasks`),
    ]

    return lines.filter(Boolean).join('\n')
  }

  // ── Past feedback loader ────────────────────────────────────────────────────

  private async loadFeedbackContext(userId: string, feature: string): Promise<string> {
    const feedback = await this.prisma.aiFeedback.findMany({
      where: { userId, feature, accepted: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { input: true, suggestion: true },
    })
    if (!feedback.length) return ''
    return `\nPast accepted suggestions for ${feature}: ${feedback.map(f => `"${f.input}" → "${f.suggestion}"`).join(' | ')}`
  }

  // ── Briefing ────────────────────────────────────────────────────────────────

  async getDailyBriefing(userId: string) {
    const [context, user, goals, tasks, habits] = await Promise.all([
      this.buildUserContext(userId),
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.goal.findMany({ where: { userId, deletedAt: null, status: 'ACTIVE' }, take: 5 }),
      this.prisma.task.findMany({ where: { userId, deletedAt: null, status: { in: ['TODO', 'IN_PROGRESS'] } }, take: 10 }),
      this.prisma.habit.findMany({ where: { userId, archivedAt: null }, take: 5 }),
    ])

    const prompt = `You are the AI layer of ${user?.name}'s Personal Operating System. Generate a concise, motivating daily briefing.

USER CONTEXT:
${context}

Generate a JSON response with these exact fields:
{
  "greeting": "personalized energetic greeting based on energy level and streak",
  "focusSuggestion": "one clear focus recommendation for today based on goals and energy",
  "topTasksTitles": ["task1", "task2", "task3"],
  "goalInsight": "one specific insight about goal progress — reference actual numbers",
  "habitReminder": "which habit to prioritize today and why",
  "motivationalNote": "short, genuine motivational message — not generic, reference their actual situation"
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

  // ── Chat (non-streaming, kept for backwards compat) ─────────────────────────

  async chat(userId: string, message: string, conversationHistory: any[] = []) {
    const [context, user] = await Promise.all([
      this.buildUserContext(userId),
      this.prisma.user.findUnique({ where: { id: userId } }),
    ])

    const systemPrompt = this.buildSystemPrompt(user?.name || 'User', context)
    const messages = [
      ...conversationHistory.slice(-10),
      { role: 'user' as const, content: message },
    ]

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages,
    })

    const aiMessage = response.content[0].type === 'text' ? response.content[0].text : ''

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

  // ── Streaming chat ──────────────────────────────────────────────────────────

  async chatStream(userId: string, message: string, conversationHistory: any[] = [], res: Response) {
    const [context, user] = await Promise.all([
      this.buildUserContext(userId),
      this.prisma.user.findUnique({ where: { id: userId } }),
    ])

    const systemPrompt = this.buildSystemPrompt(user?.name || 'User', context)
    const messages = [
      ...conversationHistory.slice(-10),
      { role: 'user' as const, content: message },
    ]

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    let fullText = ''

    try {
      const stream = await this.anthropic.messages.stream({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompt,
        messages,
      })

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const chunk = event.delta.text
          fullText += chunk
          res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`)
        }
      }

      // Save to DB after stream completes
      await this.prisma.aiMessage.createMany({
        data: [
          { userId, role: 'user', content: message },
          { userId, role: 'assistant', content: fullText },
        ],
      })

      res.write(`data: ${JSON.stringify({ type: 'done', conversationHistory: [...messages, { role: 'assistant', content: fullText }] })}\n\n`)
    } catch (err) {
      this.logger.error('Stream chat failed', err)
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Stream failed' })}\n\n`)
    } finally {
      res.end()
    }
  }

  private buildSystemPrompt(name: string, context: string): string {
    return `You are the AI chief of staff inside ${name}'s Personal Operating System (Saikhant Labs OS).

You have FULL real-time context about their life:

${context}

Your role: trusted advisor who knows everything about their goals, tasks, habits, finances, and projects.
Be direct, specific, and reference their actual data. Never be generic.
Keep responses concise unless depth is requested.
Format with markdown when helpful (bullet points, bold for key items).`
  }

  // ── Chat history ────────────────────────────────────────────────────────────

  async getChatHistory(userId: string, limit = 50) {
    return this.prisma.aiMessage.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    })
  }

  // ── Phase 2: Intelligence Layer ─────────────────────────────────────────────

  async categorizeTransaction(userId: string, description: string, amount: number, txType: string) {
    const [categories, feedbackCtx] = await Promise.all([
      this.prisma.financeCategory.findMany({ where: { userId }, select: { name: true } }),
      this.loadFeedbackContext(userId, 'tx_categorization'),
    ])
    const categoryNames = categories.map(c => c.name).join(', ')

    const prompt = `Categorize this ${txType.toLowerCase()} transaction for a personal finance tracker.
Description: "${description}"
Amount: ${(amount / 100).toFixed(2)}
Existing categories: ${categoryNames || 'none yet'}${feedbackCtx}

Return JSON only:
{ "category": "category name", "isNew": boolean, "icon": "single emoji", "confidence": 0.0 }

Use an existing category if it fits. Keep names short (1-2 words). Confidence 0-1.
Respond ONLY with valid JSON.`

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
      return JSON.parse(text)
    } catch {
      return { category: 'Other', isNew: false, icon: '💸', confidence: 0.5 }
    }
  }

  async categorizeNote(userId: string, title: string, content: string) {
    const [collections, feedbackCtx] = await Promise.all([
      this.prisma.collection.findMany({ where: { userId }, select: { id: true, name: true } }),
      this.loadFeedbackContext(userId, 'note_categorization'),
    ])

    const prompt = `Analyze this note and suggest how to organize it.
Title: "${title}"
Content (first 400 chars): "${(content || '').slice(0, 400)}"
Available collections: ${collections.length ? collections.map(c => `"${c.name}" [id:${c.id}]`).join(', ') : 'none'}${feedbackCtx}

Return JSON only:
{
  "collectionId": "existing-id or null",
  "tags": ["tag1", "tag2", "tag3"],
  "summary": "one sentence"
}

Match to an existing collection if it fits. Tags should be 1-2 words, 2-3 max.
Respond ONLY with valid JSON.`

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
      return JSON.parse(text)
    } catch {
      return { collectionId: null, tags: [], summary: '' }
    }
  }

  async suggestGoalForTask(userId: string, taskTitle: string) {
    const [goals, feedbackCtx] = await Promise.all([
      this.prisma.goal.findMany({ where: { userId, deletedAt: null, status: 'ACTIVE' }, select: { id: true, title: true, pillar: true } }),
      this.loadFeedbackContext(userId, 'goal_suggestion'),
    ])

    if (!goals.length) return { goalId: null, goalTitle: null, confidence: 0 }

    const prompt = `Match this task to the most relevant active goal, if any.
Task: "${taskTitle}"
Goals: ${goals.map(g => `"${g.title}" (${g.pillar}) [id:${g.id}]`).join(' | ')}${feedbackCtx}

Return JSON only: { "goalId": "id or null", "goalTitle": "title or null", "confidence": 0.0 }
Only suggest a goal if confidence > 0.65. Otherwise return null for both.
Respond ONLY with valid JSON.`

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 80,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
      return JSON.parse(text)
    } catch {
      return { goalId: null, goalTitle: null, confidence: 0 }
    }
  }

  async semanticSearch(userId: string, query: string, results: any[]) {
    if (!results.length) return { results: [], intent: null, topInsight: null }

    const prompt = `User searched for: "${query}"
Search results:
${results.map((r, i) => `[${i}] ${r.entityType}: "${r.title}" — ${r.subtitle || ''}`).join('\n')}

Re-rank by semantic relevance. What is the user trying to find?

Return JSON only:
{
  "rankedIndexes": [0, 1, 2, ...],
  "intent": "brief description of what user wants",
  "topInsight": "one helpful observation about the top result (or null)"
}
Respond ONLY with valid JSON.`

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = response.content[0].type === 'text' ? response.content[0].text.trim() : '{}'
      const { rankedIndexes, intent, topInsight } = JSON.parse(text)
      const ranked = (rankedIndexes as number[] || []).map(i => results[i]).filter(Boolean)
      return { results: ranked.length ? ranked : results, intent, topInsight }
    } catch {
      return { results, intent: null, topInsight: null }
    }
  }

  // ── Feedback recording ──────────────────────────────────────────────────────

  async recordFeedback(userId: string, feature: string, input: string, suggestion: string, accepted: boolean) {
    return this.prisma.aiFeedback.create({
      data: { userId, feature, input, suggestion, accepted },
    })
  }
}

import { Injectable, Logger } from '@nestjs/common'
import { Response } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { PrismaService } from '../../common/prisma/prisma.service'

export type AiProvider = 'claude' | 'chatgpt'

@Injectable()
export class AiService {
  private anthropic: Anthropic
  private openai: OpenAI
  private readonly logger = new Logger(AiService.name)

  constructor(private prisma: PrismaService) {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || '' })
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
    const [user, goals, tasks, habits, habitLogs] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.goal.findMany({ where: { userId, deletedAt: null, status: 'ACTIVE' }, take: 4, select: { title: true, progress: true } }),
      this.prisma.task.findMany({ where: { userId, deletedAt: null, status: { in: ['TODO', 'IN_PROGRESS'] } }, orderBy: [{ priority: 'desc' }], take: 5, select: { title: true, priority: true } }),
      this.prisma.habit.findMany({ where: { userId, archivedAt: null }, take: 5, select: { title: true, currentStreak: true } }),
      this.prisma.habitLog.findMany({ where: { userId, completedAt: { gte: new Date(new Date().setHours(0,0,0,0)) } }, select: { habitId: true } }),
    ])

    const energyLabels = ['Drained', 'Low', 'Moderate', 'Peak']
    const energy = user?.energyLevel != null ? energyLabels[user.energyLevel] : 'unknown'
    const completedToday = habitLogs.length

    // Compact context — minimal tokens
    const ctx = [
      `${user?.name} | Energy:${energy} | Streak:${user?.streakCount}d`,
      goals.length ? `Goals: ${goals.map(g => `${g.title}(${g.progress}%)`).join(', ')}` : '',
      tasks.length ? `Top tasks: ${tasks.slice(0,3).map(t => t.title).join(', ')}` : '',
      habits.length ? `Habits: ${completedToday}/${habits.length} done today` : '',
    ].filter(Boolean).join('\n')

    const prompt = `Briefing for personal OS user. Context:\n${ctx}\n\nReply ONLY valid JSON:\n{"greeting":"...","focusSuggestion":"...","topTasksTitles":["..."],"goalInsight":"...","habitReminder":"...","motivationalNote":"..."}`

    try {
      const res = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: 400,
        temperature: 0.7,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      })
      const briefing = JSON.parse(res.choices[0]?.message?.content || '{}')
      return { ...briefing, date: new Date().toISOString(), energyLevel: user?.energyLevel }
    } catch (err) {
      this.logger.error('AI briefing failed', err)
      return {
        greeting: `Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}, ${user?.name}!`,
        focusSuggestion: tasks[0]?.title || 'Focus on your highest priority task.',
        topTasksTitles: tasks.slice(0, 3).map(t => t.title),
        goalInsight: goals.length ? `${goals.length} active goals — keep pushing.` : 'Set your first goal today.',
        habitReminder: habits[0]?.title || 'Build your habits.',
        motivationalNote: 'Every small step compounds.',
        date: new Date().toISOString(),
        energyLevel: user?.energyLevel,
      }
    }
  }

  // ── Chat (non-streaming, kept for backwards compat) ─────────────────────────

  async chat(userId: string, message: string, conversationHistory: any[] = [], provider: AiProvider = 'claude') {
    const [context, user] = await Promise.all([
      this.buildUserContext(userId),
      this.prisma.user.findUnique({ where: { id: userId } }),
    ])

    const name = user?.name || 'User'
    const systemPrompt = this.buildSystemPrompt(name, context)
    const safeHistory = this.sanitizeMessages(conversationHistory.slice(-10))
    const messages = [
      ...safeHistory,
      { role: 'user' as const, content: message },
    ]

    let aiMessage = ''

    if (provider === 'chatgpt') {
      aiMessage = await this.openaiChat(systemPrompt, messages)
    } else {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        system: systemPrompt,
        messages,
      })
      aiMessage = response.content[0].type === 'text' ? response.content[0].text : ''
    }

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

  // ── OpenAI message sanitizer ────────────────────────────────────────────────
  // Strips any message where role is missing/invalid before sending to OpenAI.
  // JSON.stringify silently drops `undefined` fields, so `{ role: undefined }`
  // becomes `{}` over the wire — OpenAI rejects it with a 400.
  private sanitizeMessages(raw: any[]): Array<{ role: 'user' | 'assistant'; content: string }> {
    return raw
      .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
  }

  // ── OpenAI / ChatGPT helper ─────────────────────────────────────────────────
  // gpt-4o-mini: fast, cheap ($0.15/1M input tokens), great for chat

  private async openaiChat(systemPrompt: string, messages: any[]): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 1500,
      messages: [
        { role: 'system' as const, content: systemPrompt },
        ...this.sanitizeMessages(messages),
      ],
    })
    return response.choices[0]?.message?.content || ''
  }

  // ── Streaming chat ──────────────────────────────────────────────────────────

  async chatStream(userId: string, message: string, conversationHistory: any[] = [], res: Response, provider: AiProvider = 'claude') {
    const [context, user] = await Promise.all([
      this.buildUserContext(userId),
      this.prisma.user.findUnique({ where: { id: userId } }),
    ])

    const name = user?.name || 'User'
    const systemPrompt = this.buildSystemPrompt(name, context)
    const safeHistory = this.sanitizeMessages(conversationHistory.slice(-10))
    const messages = [
      ...safeHistory,
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
      if (provider === 'chatgpt') {
        // OpenAI streaming — messages already sanitized above
        const stream = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          max_tokens: 1500,
          stream: true,
          messages: [
            { role: 'system' as const, content: systemPrompt },
            ...messages, // already typed as { role: 'user'|'assistant', content: string }
          ],
        })
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || ''
          if (text) {
            fullText += text
            res.write(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`)
          }
        }
      } else {
        // Claude streaming
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
      }

      // Save to DB after stream completes
      await this.prisma.aiMessage.createMany({
        data: [
          { userId, role: 'user', content: message },
          { userId, role: 'assistant', content: fullText },
        ],
      })

      res.write(`data: ${JSON.stringify({ type: 'done', conversationHistory: [...messages, { role: 'assistant', content: fullText }] })}\n\n`)
    } catch (err: any) {
      this.logger.error('Stream chat failed', err)
      // Surface rate-limit retry delay if present (OpenAI includes it in error headers)
      const retryAfter = err?.headers?.['retry-after'] ? parseInt(err.headers['retry-after'], 10) : null
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Stream failed', retryAfter })}\n\n`)
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

  // ── Shared gpt-4o-mini JSON helper ──────────────────────────────────────────
  private async gptJson<T>(prompt: string, maxTokens = 120, fallback: T): Promise<T> {
    try {
      const res = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        max_tokens: maxTokens,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [{ role: 'user', content: prompt }],
      })
      return JSON.parse(res.choices[0]?.message?.content || '{}') as T
    } catch {
      return fallback
    }
  }

  async categorizeTransaction(userId: string, description: string, amount: number, txType: string) {
    const categories = await this.prisma.financeCategory.findMany({ where: { userId }, select: { name: true } })
    const cats = categories.map(c => c.name).join(', ') || 'none'
    const prompt = `Categorize: "${description}" ${txType} $${(amount/100).toFixed(2)}. Categories: ${cats}.\nJSON: {"category":"name","isNew":bool,"icon":"emoji","confidence":0.0}`
    return this.gptJson(prompt, 60, { category: 'Other', isNew: false, icon: '💸', confidence: 0.5 })
  }

  async categorizeNote(userId: string, title: string, content: string) {
    const collections = await this.prisma.collection.findMany({ where: { userId }, select: { id: true, name: true } })
    const cols = collections.map(c => `"${c.name}"[${c.id}]`).join(', ') || 'none'
    const snippet = (content || '').slice(0, 200)
    const prompt = `Note: "${title}" — ${snippet}\nCollections: ${cols}\nJSON: {"collectionId":"id or null","tags":["tag"],"summary":"one sentence"}`
    return this.gptJson(prompt, 100, { collectionId: null, tags: [], summary: '' })
  }

  async suggestGoalForTask(userId: string, taskTitle: string) {
    const goals = await this.prisma.goal.findMany({ where: { userId, deletedAt: null, status: 'ACTIVE' }, select: { id: true, title: true, pillar: true } })
    if (!goals.length) return { goalId: null, goalTitle: null, confidence: 0 }
    const prompt = `Task: "${taskTitle}"\nGoals: ${goals.map(g => `"${g.title}"[${g.id}]`).join(' | ')}\nBest match? JSON: {"goalId":"id or null","goalTitle":"title or null","confidence":0.0} — null if confidence<0.65`
    return this.gptJson(prompt, 60, { goalId: null, goalTitle: null, confidence: 0 })
  }

  async semanticSearch(userId: string, query: string, results: any[]) {
    if (!results.length) return { results: [], intent: null, topInsight: null }
    const items = results.slice(0, 10).map((r, i) => `[${i}]${r.entityType}:"${r.title}"`).join(' ')
    const prompt = `Query:"${query}" Results:${items}\nJSON: {"rankedIndexes":[0,1,2],"intent":"brief","topInsight":"or null"}`
    const data = await this.gptJson<any>(prompt, 120, { rankedIndexes: [], intent: null, topInsight: null })
    const ranked = ((data.rankedIndexes || []) as number[]).map(i => results[i]).filter(Boolean)
    return { results: ranked.length ? ranked : results, intent: data.intent, topInsight: data.topInsight }
  }

  // ── Feedback recording ──────────────────────────────────────────────────────

  async recordFeedback(userId: string, feature: string, input: string, suggestion: string, accepted: boolean) {
    return this.prisma.aiFeedback.create({
      data: { userId, feature, input, suggestion, accepted },
    })
  }
}

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'

export const PLANS = {
  FREE: {
    name: 'Free', price: 0, priceId: null,
    limits: { goals: 5, tasks: 50, habits: 3, notes: 100, aiMessages: 10 },
    features: ['5 Goals', '50 Tasks', '3 Habits', '100 Notes', '10 AI messages/month'],
  },
  PRO: {
    name: 'Pro', price: 1200, priceId: process.env.STRIPE_PRO_PRICE_ID,
    limits: { goals: -1, tasks: -1, habits: -1, notes: -1, aiMessages: -1 },
    features: ['Unlimited Goals & Tasks', 'Unlimited Habits', 'Unlimited Notes', 'Unlimited AI', 'Finance Tracker', 'Advanced Analytics'],
  },
  TEAM: {
    name: 'Team', price: 2900, priceId: process.env.STRIPE_TEAM_PRICE_ID,
    limits: { goals: -1, tasks: -1, habits: -1, notes: -1, aiMessages: -1 },
    features: ['Everything in Pro', 'Shared Projects', 'Team Analytics', 'Collaborative KB', 'Admin Controls'],
  },
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name)
  private stripe: any = null

  constructor(private prisma: PrismaService) {
    if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_placeholder') {
      try {
        const Stripe = require('stripe')
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' })
      } catch (e) {
        this.logger.warn('Stripe not available — billing in mock mode')
      }
    }
  }

  getPlans() {
    return Object.entries(PLANS).map(([id, plan]) => ({ id, ...plan, priceMonthly: plan.price / 100 }))
  }

  async getSubscription(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { plan: true, email: true, name: true } })
    if (!user) throw new NotFoundException('User not found')
    return {
      currentPlan: user.plan,
      planDetails: PLANS[user.plan as keyof typeof PLANS] || PLANS.FREE,
      stripeConfigured: !!this.stripe,
      isActive: true,
    }
  }

  async createCheckoutSession(userId: string, plan: 'PRO' | 'TEAM') {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundException('User not found')

    // Mock mode when Stripe not configured
    if (!this.stripe) {
      return { url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/billing?mock=success&plan=${plan}`, mock: true }
    }

    const customer = await this.stripe.customers.create({ email: user.email, name: user.name, metadata: { userId } })
    const session = await this.stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=true`,
      metadata: { userId, plan },
      subscription_data: { trial_period_days: 14, metadata: { userId, plan } },
    })
    return { url: session.url, sessionId: session.id }
  }

  async createPortalSession(userId: string) {
    if (!this.stripe) return { url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/billing`, mock: true }
    throw new BadRequestException('Portal requires active Stripe subscription')
  }

  async handleWebhook(signature: string, payload: Buffer) {
    if (!this.stripe || !process.env.STRIPE_WEBHOOK_SECRET) return { received: true }
    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, process.env.STRIPE_WEBHOOK_SECRET)
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan
        if (userId && plan) await this.prisma.user.update({ where: { id: userId }, data: { plan: plan as any } })
      } else if (event.type === 'customer.subscription.deleted') {
        const sub = event.data.object
        const userId = sub.metadata?.userId
        if (userId) await this.prisma.user.update({ where: { id: userId }, data: { plan: 'FREE' } })
      }
    } catch (err: any) {
      throw new BadRequestException(`Webhook error: ${err.message}`)
    }
    return { received: true }
  }

  async checkLimit(userId: string, resource: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { plan: true } })
    const plan = PLANS[(user?.plan || 'FREE') as keyof typeof PLANS] || PLANS.FREE
    const limit = (plan.limits as any)[resource] as number
    if (limit === -1) return { allowed: true, limit: -1, current: 0 }

    let current = 0
    if (resource === 'goals') current = await this.prisma.goal.count({ where: { userId, deletedAt: null } })
    if (resource === 'tasks') current = await this.prisma.task.count({ where: { userId, deletedAt: null } })
    if (resource === 'habits') current = await this.prisma.habit.count({ where: { userId, archivedAt: null } })
    if (resource === 'notes') current = await this.prisma.note.count({ where: { userId, deletedAt: null } })
    return { allowed: current < limit, limit, current }
  }
}

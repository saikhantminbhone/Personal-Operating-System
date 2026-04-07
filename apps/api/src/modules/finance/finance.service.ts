import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'
import { CreateAccountDto, CreateTransactionDto } from './finance.dto'

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  // ── ACCOUNTS ──────────────────────────────────────────────────────────────
  async getAccounts(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId, deletedAt: null },
      include: { _count: { select: { transactions: true } } },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    })
    return accounts
  }

  async createAccount(userId: string, dto: CreateAccountDto) {
    const isFirst = (await this.prisma.account.count({ where: { userId } })) === 0
    return this.prisma.account.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type as any,
        currencyCode: dto.currencyCode || 'USD',
        balanceCents: dto.initialBalanceCents || 0,
        color: dto.color || '#64ffda',
        icon: dto.icon || '🏦',
        isDefault: isFirst,
      },
    })
  }

  async deleteAccount(userId: string, id: string) {
    await this.assertAccountOwner(userId, id)
    await this.prisma.account.update({ where: { id }, data: { deletedAt: new Date() } })
    return { success: true }
  }

  // ── TRANSACTIONS ──────────────────────────────────────────────────────────
  async getTransactions(userId: string, options: { accountId?: string; limit?: number; page?: number } = {}) {
    const { accountId, limit = 50, page = 1 } = options
    const skip = (page - 1) * limit
    const where: any = { userId }
    if (accountId) where.accountId = accountId

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: { account: { select: { name: true, type: true, color: true } }, category: { select: { name: true, icon: true, color: true } } },
        orderBy: { transactionDate: 'desc' },
        skip, take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ])

    return { data: transactions, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async createTransaction(userId: string, dto: CreateTransactionDto) {
    await this.assertAccountOwner(userId, dto.accountId)

    const tx = await this.prisma.transaction.create({
      data: {
        userId,
        accountId: dto.accountId,
        amountCents: dto.amountCents,
        type: dto.type as any,
        description: dto.description,
        categoryId: dto.categoryId,
        transactionDate: new Date(dto.transactionDate),
        currencyCode: dto.currencyCode || 'USD',
      },
    })

    // Update account balance
    const delta = dto.type === 'INCOME' ? dto.amountCents : dto.type === 'EXPENSE' ? -dto.amountCents : 0
    await this.prisma.account.update({
      where: { id: dto.accountId },
      data: { balanceCents: { increment: delta } },
    })

    return tx
  }

  async deleteTransaction(userId: string, id: string) {
    const tx = await this.prisma.transaction.findFirst({ where: { id, userId } })
    if (!tx) throw new ForbiddenException('Transaction not found')

    // Reverse balance change
    const delta = tx.type === 'INCOME' ? -tx.amountCents : tx.type === 'EXPENSE' ? tx.amountCents : 0
    await this.prisma.account.update({
      where: { id: tx.accountId },
      data: { balanceCents: { increment: delta } },
    })
    await this.prisma.transaction.delete({ where: { id } })
    return { success: true }
  }

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  async getMonthlySummary(userId: string, year?: number, month?: number) {
    const now = new Date()
    const y = year || now.getFullYear()
    const m = month !== undefined ? month : now.getMonth()
    const start = new Date(y, m, 1)
    const end = new Date(y, m + 1, 0, 23, 59, 59)

    const transactions = await this.prisma.transaction.findMany({
      where: { userId, transactionDate: { gte: start, lte: end } },
      include: { category: { select: { name: true, color: true, icon: true } } },
    })

    const income = transactions.filter(t => t.type === 'INCOME').reduce((a, t) => a + t.amountCents, 0)
    const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((a, t) => a + t.amountCents, 0)

    const byCategory: Record<string, { name: string; color: string; icon: string; total: number }> = {}
    for (const t of transactions.filter(tx => tx.type === 'EXPENSE')) {
      const key = t.categoryId || 'uncategorized'
      if (!byCategory[key]) {
        byCategory[key] = {
          name: t.category?.name || 'Uncategorized',
          color: t.category?.color || '#64748b',
          icon: t.category?.icon || '•',
          total: 0,
        }
      }
      byCategory[key].total += t.amountCents
    }

    const accounts = await this.getAccounts(userId)
    const netWorth = accounts.reduce((a, acc) => a + acc.balanceCents, 0)

    return {
      period: { year: y, month: m },
      income,
      expenses,
      savings: income - expenses,
      savingsRate: income > 0 ? Math.round(((income - expenses) / income) * 100) : 0,
      netWorthCents: netWorth,
      byCategory: Object.values(byCategory).sort((a, b) => b.total - a.total),
      transactionCount: transactions.length,
    }
  }

  async getNetWorthHistory(userId: string) {
    const accounts = await this.getAccounts(userId)
    const total = accounts.reduce((a, acc) => a + acc.balanceCents, 0)
    return { currentNetWorthCents: total, accounts: accounts.map(a => ({ name: a.name, balanceCents: a.balanceCents, type: a.type })) }
  }

  async getCategories(userId: string) {
    return this.prisma.financeCategory.findMany({
      where: { OR: [{ userId }, { isDefault: true }] },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    })
  }

  private async assertAccountOwner(userId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({ where: { id: accountId, userId, deletedAt: null } })
    if (!account) throw new ForbiddenException('Account not found or access denied')
    return account
  }
}

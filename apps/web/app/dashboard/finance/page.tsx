'use client'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input, Select } from '@/components/ui/Input'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useAppStore } from '@/store/useAppStore'
import { PiggyBank, Plus, Trash2, ArrowUpRight, ArrowDownLeft, TrendingUp, Wallet, Sparkles } from 'lucide-react'
import { useAiCategorizeTx } from '@/hooks/useAi'
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const ACCOUNT_ICONS: Record<string, string> = { CASH: '💵', BANK: '🏦', SAVINGS: '🏧', INVESTMENT: '📈', CRYPTO: '₿', CREDIT: '💳' }
const ACCOUNT_TYPES = ['CASH','BANK','SAVINGS','INVESTMENT','CRYPTO','CREDIT']
const CURRENCIES = ['USD','THB','EUR','GBP','SGD','JPY']
const PIE_COLORS = ['#64ffda','#00b4d8','#a78bfa','#f59e0b','#22c55e','#ef4444','#f97316']

function fmt(cents: number, currency = 'USD') {
  const abs = Math.abs(cents) / 100
  const sign = cents < 0 ? '-' : ''
  try { return sign + new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(abs) }
  catch { return `${sign}${currency} ${abs.toFixed(0)}` }
}

export default function FinancePage() {
  const qc = useQueryClient()
  const { showToast } = useAppStore()
  const [accountModal, setAccountModal] = useState(false)
  const [txModal, setTxModal] = useState(false)
  const [accountForm, setAccountForm] = useState({ name: '', type: 'BANK', currencyCode: 'USD', initialBalanceCents: '' })
  const [txForm, setTxForm] = useState({ accountId: '', amountCents: '', type: 'EXPENSE', description: '', transactionDate: new Date().toISOString().slice(0,10) })
  const [categorySuggestion, setCategorySuggestion] = useState<{ category: string; icon: string } | null>(null)
  const categorizeTx = useAiCategorizeTx()

  async function handleDescriptionBlur() {
    if (!txForm.description.trim() || txForm.type === 'TRANSFER') return
    const amount = parseFloat(txForm.amountCents || '0') * 100
    const result = await categorizeTx.mutateAsync({ description: txForm.description, amount, type: txForm.type }).catch(() => null) as any
    if (result?.category) setCategorySuggestion({ category: result.category, icon: result.icon || '💸' })
  }

  const { data: accounts } = useQuery<any[]>({ queryKey: ['finance','accounts'], queryFn: () => api.get('/finance/accounts') })
  const { data: txData } = useQuery<any>({ queryKey: ['finance','transactions'], queryFn: () => api.get('/finance/transactions', { params: { limit: 30 } }) })
  const { data: summary } = useQuery<any>({ queryKey: ['finance','summary'], queryFn: () => api.get('/finance/summary') })
  const { data: netWorth } = useQuery<any>({ queryKey: ['finance','networth'], queryFn: () => api.get('/finance/net-worth') })

  const createAccount = useMutation({
    mutationFn: (data: any) => api.post('/finance/accounts', { ...data, initialBalanceCents: Math.round(parseFloat(data.initialBalanceCents || '0') * 100) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance'] }); setAccountModal(false); showToast('Account added') },
    onError: (err: any) => showToast(err.message || 'Failed to add account', 'error'),
  })

  const createTx = useMutation({
    mutationFn: (data: any) => api.post('/finance/transactions', { ...data, amountCents: Math.round(parseFloat(data.amountCents) * 100) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance'] }); setTxModal(false); showToast('Transaction added') },
    onError: (err: any) => showToast(err.message || 'Failed to add transaction', 'error'),
  })

  const deleteTx = useMutation({
    mutationFn: (id: string) => api.delete(`/finance/transactions/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance'] }); showToast('Deleted') },
  })

  const transactions = txData?.data || []
  const nwCents = netWorth?.currentNetWorthCents || 0

  // Spending by category for pie chart
  const pieData = summary?.byCategory?.slice(0, 6).map((c: any) => ({
    name: c.name, value: c.total / 100,
  })) || []

  // Mock trend data (last 6 months net worth growth)
  const trendData = [
    { month: 'Nov', value: Math.max(0, nwCents * 0.7 / 100) },
    { month: 'Dec', value: Math.max(0, nwCents * 0.78 / 100) },
    { month: 'Jan', value: Math.max(0, nwCents * 0.85 / 100) },
    { month: 'Feb', value: Math.max(0, nwCents * 0.91 / 100) },
    { month: 'Mar', value: Math.max(0, nwCents * 0.97 / 100) },
    { month: 'Apr', value: Math.max(0, nwCents / 100) },
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-xs font-mono text-os-muted">{accounts?.length ?? 0} accounts</p>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setAccountModal(true)}><Plus className="w-3 h-3" /> Account</Button>
          <Button size="sm" onClick={() => setTxModal(true)}><Plus className="w-3 h-3" /> Transaction</Button>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="col-span-2 sm:col-span-1">
          <div className="text-[10px] font-mono tracking-widest uppercase text-os-muted mb-2 flex items-center gap-2">
            <Wallet className="w-3 h-3" /> Net Worth
          </div>
          <div className={`text-2xl font-mono font-bold ${nwCents >= 0 ? 'text-os-success' : 'text-os-danger'}`}>
            {fmt(nwCents)}
          </div>
        </Card>
        {summary && (
          <>
            <Card>
              <div className="flex items-center gap-2 mb-2 text-[10px] font-mono text-os-muted">
                <ArrowUpRight className="w-3 h-3 text-os-success" /> Income
              </div>
              <div className="text-xl font-mono font-bold text-os-success">{fmt(summary.income)}</div>
              <div className="text-[9px] font-mono text-os-muted mt-1">This month</div>
            </Card>
            <Card>
              <div className="flex items-center gap-2 mb-2 text-[10px] font-mono text-os-muted">
                <ArrowDownLeft className="w-3 h-3 text-os-danger" /> Expenses
              </div>
              <div className="text-xl font-mono font-bold text-os-danger">{fmt(summary.expenses)}</div>
              <div className="text-[9px] font-mono text-os-muted mt-1">This month</div>
            </Card>
            <Card>
              <div className="flex items-center gap-2 mb-2 text-[10px] font-mono text-os-muted">
                <TrendingUp className="w-3 h-3 text-os-accent" /> Savings Rate
              </div>
              <div className={`text-xl font-mono font-bold ${summary.savingsRate >= 20 ? 'text-os-success' : summary.savingsRate >= 0 ? 'text-os-warning' : 'text-os-danger'}`}>
                {summary.savingsRate}%
              </div>
              <div className="text-[9px] font-mono text-os-muted mt-1">
                {summary.savingsRate >= 20 ? '✓ Healthy' : summary.savingsRate >= 0 ? 'Could improve' : 'In deficit'}
              </div>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Net worth trend */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>📈 Net Worth Trend</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={trendData} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
              <defs>
                <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#64ffda" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#64ffda" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} />
              <YAxis tick={{ fontSize: 9, fill: '#64748b', fontFamily: 'monospace' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#0d1520', border: '1px solid rgba(100,255,218,0.2)', borderRadius: 6, fontFamily: 'monospace', fontSize: 11 }}
                formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Net Worth']} />
              <Area type="monotone" dataKey="value" stroke="#64ffda" strokeWidth={2} fill="url(#nwGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Spending by category */}
        {pieData.length > 0 && (
          <Card>
            <CardHeader><CardTitle>🍰 Spending Breakdown</CardTitle></CardHeader>
            <ResponsiveContainer width="100%" height={130}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                  {pieData.map((_: any, i: number) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0d1520', border: '1px solid rgba(100,255,218,0.2)', borderRadius: 6, fontFamily: 'monospace', fontSize: 11 }}
                  formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {pieData.slice(0, 4).map((item: any, i: number) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                  <span className="text-[10px] font-mono text-os-muted flex-1 truncate">{item.name}</span>
                  <span className="text-[10px] font-mono text-os-text">${item.value.toFixed(0)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Accounts */}
        <div>
          <p className="os-label mb-3">Accounts</p>
          <div className="space-y-2">
            {accounts?.map((acc: any) => (
              <Card key={acc.id} className="p-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{ACCOUNT_ICONS[acc.type] || '💰'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono text-os-text">{acc.name}</div>
                    <div className="text-[10px] font-mono text-os-muted">{acc.type} · {acc.currencyCode}</div>
                  </div>
                  <div className={`text-sm font-mono font-bold ${acc.balanceCents >= 0 ? 'text-os-success' : 'text-os-danger'}`}>
                    {fmt(acc.balanceCents, acc.currencyCode)}
                  </div>
                </div>
                {netWorth && nwCents > 0 && acc.balanceCents > 0 && (
                  <div className="mt-2">
                    <ProgressBar value={Math.min(100, Math.round((acc.balanceCents / nwCents) * 100))} color="#64ffda" />
                    <p className="text-[9px] font-mono text-os-muted mt-1">{Math.round((acc.balanceCents / nwCents) * 100)}% of net worth</p>
                  </div>
                )}
              </Card>
            ))}
            {(!accounts || accounts.length === 0) && (
              <Card className="text-center py-8">
                <PiggyBank className="w-6 h-6 text-os-muted mx-auto mb-2" />
                <p className="text-xs font-mono text-os-muted mb-3">No accounts yet</p>
                <Button size="sm" onClick={() => setAccountModal(true)}><Plus className="w-3 h-3" /> Add Account</Button>
              </Card>
            )}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="lg:col-span-2">
          <p className="os-label mb-3">Recent Transactions</p>
          <div className="space-y-1.5">
            {transactions.map((tx: any) => (
              <div key={tx.id}
                className="flex items-center gap-3 p-3 bg-white/[0.02] border border-os-border rounded-lg group hover:border-os-accent/15 transition-all touch-manipulation">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${tx.type === 'INCOME' ? 'bg-os-success/10 text-os-success' : 'bg-os-danger/10 text-os-danger'}`}>
                  {tx.type === 'INCOME' ? '↑' : '↓'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-mono text-os-text truncate">{tx.description || 'No description'}</div>
                  <div className="text-[9px] font-mono text-os-muted">
                    {tx.account?.name} · {new Date(tx.transactionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className={`text-sm font-mono font-bold flex-shrink-0 ${tx.type === 'INCOME' ? 'text-os-success' : 'text-os-danger'}`}>
                  {tx.type === 'INCOME' ? '+' : '-'}{fmt(Math.abs(tx.amountCents), tx.currencyCode)}
                </div>
                <button onClick={() => deleteTx.mutate(tx.id)}
                  className="text-os-muted hover:text-os-danger transition-all p-1 sm:opacity-0 sm:group-hover:opacity-100">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {transactions.length === 0 && (
              <Card className="text-center py-8">
                <p className="text-xs font-mono text-os-muted">No transactions yet. Start tracking your money.</p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Account Modal */}
      <Modal open={accountModal} onClose={() => setAccountModal(false)} title="Add Account">
        <div className="space-y-4">
          <Input label="Name" placeholder="Main Bank" value={accountForm.name} onChange={e => setAccountForm(f => ({ ...f, name: e.target.value }))} />
          <Select label="Type" value={accountForm.type} onChange={e => setAccountForm(f => ({ ...f, type: e.target.value }))}>
            {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{ACCOUNT_ICONS[t]} {t}</option>)}
          </Select>
          <Input label="Current Balance" type="number" placeholder="1000.00" value={accountForm.initialBalanceCents}
            onChange={e => setAccountForm(f => ({ ...f, initialBalanceCents: e.target.value }))} />
          <Select label="Currency" value={accountForm.currencyCode} onChange={e => setAccountForm(f => ({ ...f, currencyCode: e.target.value }))}>
            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
          </Select>
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" loading={createAccount.isPending} onClick={() => {
              if (!accountForm.name.trim()) { showToast('Account name is required', 'error'); return }
              createAccount.mutate(accountForm)
            }}>Add Account</Button>
            <Button variant="ghost" onClick={() => setAccountModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Transaction Modal */}
      <Modal open={txModal} onClose={() => setTxModal(false)} title="Add Transaction">
        <div className="space-y-4">
          <Select label="Account" value={txForm.accountId} onChange={e => setTxForm(f => ({ ...f, accountId: e.target.value }))}>
            <option value="">Select account...</option>
            {accounts?.map((a: any) => <option key={a.id} value={a.id}>{ACCOUNT_ICONS[a.type]} {a.name}</option>)}
          </Select>
          <Select label="Type" value={txForm.type} onChange={e => setTxForm(f => ({ ...f, type: e.target.value }))}>
            <option value="EXPENSE">Expense</option>
            <option value="INCOME">Income</option>
            <option value="TRANSFER">Transfer</option>
          </Select>
          <Input label="Amount" type="number" placeholder="50.00" value={txForm.amountCents} onChange={e => setTxForm(f => ({ ...f, amountCents: e.target.value }))} />
          <Input label="Description" placeholder="Grab delivery, Salary..." value={txForm.description}
            onChange={e => { setTxForm(f => ({ ...f, description: e.target.value })); setCategorySuggestion(null) }}
            onBlur={handleDescriptionBlur} />
          {categorySuggestion && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-os-accent/20 bg-os-accent/5">
              <Sparkles className="w-3 h-3 text-os-accent flex-shrink-0" />
              <span className="text-[10px] font-mono text-os-accent flex-1">
                AI category: {categorySuggestion.icon} <strong>{categorySuggestion.category}</strong>
              </span>
              <button onClick={() => setCategorySuggestion(null)} className="text-os-muted hover:text-os-text text-[10px] font-mono">dismiss</button>
            </div>
          )}
          <Input label="Date" type="date" value={txForm.transactionDate} onChange={e => setTxForm(f => ({ ...f, transactionDate: e.target.value }))} />
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" loading={createTx.isPending} onClick={() => {
              if (!txForm.accountId) { showToast('Please select an account', 'error'); return }
              if (!txForm.amountCents || parseFloat(txForm.amountCents) <= 0) { showToast('Amount must be greater than 0', 'error'); return }
              if (!txForm.transactionDate) { showToast('Transaction date is required', 'error'); return }
              createTx.mutate(txForm)
            }}>Add Transaction</Button>
            <Button variant="ghost" onClick={() => setTxModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

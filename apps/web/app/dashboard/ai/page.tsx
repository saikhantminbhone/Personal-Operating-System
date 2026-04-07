'use client'
import { useState, useRef, useEffect } from 'react'
import { useAiChat, useAiBriefing } from '@/hooks/useAi'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Send, Bot, User, Sparkles, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AiPage() {
  const [input, setInput] = useState('')
  const [briefingOpen, setBriefingOpen] = useState(false)
  const { mutateAsync: sendMessage, isPending, history, clearHistory } = useAiChat()
  const { data: briefing, refetch: refetchBriefing, isFetching } = useAiBriefing()
  const bottomRef = useRef<HTMLDivElement>(null)

  const messages = history.filter(m => m.role === 'user' || m.role === 'assistant')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function handleSend() {
    if (!input.trim() || isPending) return
    const msg = input.trim()
    setInput('')
    await sendMessage(msg)
  }

  const STARTERS = [
    'Plan my day based on my energy and goals',
    'What should I focus on this week?',
    'Analyze my goal progress and suggest adjustments',
    'Help me break down my biggest goal into tasks',
  ]

  const briefingContent = briefing ? (
    <div className="space-y-3 text-xs font-mono">
      <p className="text-os-text">{(briefing as any).greeting}</p>
      <div className="p-2 bg-os-accent/5 border border-os-accent/10 rounded">
        <p className="text-[10px] text-os-muted mb-1">FOCUS TODAY</p>
        <p className="text-os-accent">{(briefing as any).focusSuggestion}</p>
      </div>
      {(briefing as any).goalInsight && (
        <div className="p-2 bg-white/[0.02] border border-os-border rounded">
          <p className="text-[10px] text-os-muted mb-1">GOAL INSIGHT</p>
          <p className="text-os-text">{(briefing as any).goalInsight}</p>
        </div>
      )}
      {(briefing as any).habitReminder && (
        <div className="p-2 bg-white/[0.02] border border-os-border rounded">
          <p className="text-[10px] text-os-muted mb-1">HABIT REMINDER</p>
          <p className="text-os-text">{(briefing as any).habitReminder}</p>
        </div>
      )}
      {(briefing as any).motivationalNote && (
        <p className="text-os-muted italic mt-2">{(briefing as any).motivationalNote}</p>
      )}
    </div>
  ) : (
    <div className="text-xs font-mono text-os-muted animate-pulse">Generating briefing...</div>
  )

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col sm:flex-row gap-4 sm:gap-6">

      {/* ── MOBILE: collapsible briefing strip ── */}
      <div className="sm:hidden flex-shrink-0">
        <button
          onClick={() => setBriefingOpen(o => !o)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-os-surface border border-os-border rounded-lg text-xs font-mono text-os-muted hover:border-os-accent/20 transition-all"
        >
          <span className="flex items-center gap-2 text-os-accent">
            <Sparkles className="w-3 h-3" /> Daily Briefing
          </span>
          {briefingOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {briefingOpen && (
          <div className="mt-2 p-4 bg-os-surface border border-os-border rounded-lg space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="os-label">☀️ Briefing</span>
              <button onClick={() => refetchBriefing()} disabled={isFetching}
                className="text-os-muted hover:text-os-accent transition-colors">
                <RefreshCw className={cn('w-3 h-3', isFetching && 'animate-spin')} />
              </button>
            </div>
            {briefingContent}
          </div>
        )}
      </div>

      {/* ── DESKTOP: sidebar ── */}
      <div className="hidden sm:block w-72 flex-shrink-0 space-y-4 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle>☀️ Daily Briefing</CardTitle>
            <button onClick={() => refetchBriefing()} disabled={isFetching}
              className="text-os-muted hover:text-os-accent transition-colors">
              <RefreshCw className={cn('w-3 h-3', isFetching && 'animate-spin')} />
            </button>
          </CardHeader>
          {briefingContent}
        </Card>

        <Card>
          <CardTitle>💬 Quick Starters</CardTitle>
          <div className="mt-3 space-y-2">
            {STARTERS.map(s => (
              <button key={s} onClick={() => setInput(s)}
                className="w-full text-left text-[10px] font-mono text-os-muted hover:text-os-accent p-2 rounded border border-os-border hover:border-os-accent/20 transition-all">
                {s}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Chat (full width on mobile, flex-1 on desktop) ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <Card className="flex-1 flex flex-col overflow-hidden p-0 min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Sparkles className="w-8 h-8 text-os-accent/40 mb-3" />
                <p className="text-sm font-mono text-os-muted">Your AI chief of staff is ready.</p>
                <p className="text-xs font-mono text-os-muted/60 mt-1 hidden sm:block">Ask me anything about your goals, tasks, or how to plan your day.</p>
                {/* Mobile quick starters */}
                <div className="sm:hidden mt-4 w-full space-y-2">
                  {STARTERS.map(s => (
                    <button key={s} onClick={() => setInput(s)}
                      className="w-full text-left text-[10px] font-mono text-os-muted hover:text-os-accent p-2.5 rounded border border-os-border hover:border-os-accent/20 transition-all">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : messages.map((msg, i) => (
              <div key={i} className={cn('flex gap-2 sm:gap-3', msg.role === 'user' && 'flex-row-reverse')}>
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                  msg.role === 'user' ? 'bg-os-accent/20' : 'bg-os-surface border border-os-border'
                )}>
                  {msg.role === 'user'
                    ? <User className="w-3.5 h-3.5 text-os-accent" />
                    : <Bot className="w-3.5 h-3.5 text-os-text" />
                  }
                </div>
                <div className={cn(
                  'max-w-[80%] sm:max-w-[75%] p-3 rounded-xl text-sm font-mono leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-os-accent/10 text-os-text border border-os-accent/15 rounded-tr-sm'
                    : 'bg-white/[0.03] text-os-text border border-os-border rounded-tl-sm'
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isPending && (
              <div className="flex gap-2 sm:gap-3">
                <div className="w-7 h-7 rounded-full bg-os-surface border border-os-border flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-os-text" />
                </div>
                <div className="p-3 bg-white/[0.03] border border-os-border rounded-xl rounded-tl-sm">
                  <div className="flex gap-1">
                    {[0,1,2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-os-accent/60 animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-os-border p-3 sm:p-4">
            <div className="flex gap-2 sm:gap-3">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask your AI chief of staff..."
                className="flex-1 os-input text-sm"
                disabled={isPending}
              />
              <Button onClick={handleSend} loading={isPending} disabled={!input.trim()}>
                <Send className="w-3 h-3" />
              </Button>
              {messages.length > 0 && (
                <Button variant="ghost" onClick={clearHistory} title="Clear chat">
                  <RefreshCw className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

'use client'
import { useState, useRef, useEffect } from 'react'
import { useAiChat, useAiBriefing } from '@/hooks/useAi'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Send, Bot, User, Sparkles, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAppStore, type AiProvider } from '@/store/useAppStore'

export default function AiPage() {
  const [input, setInput] = useState('')
  const [briefingOpen, setBriefingOpen] = useState(false)
  const { sendMessage, isStreaming, isThinking, streamingText, history, clearHistory } = useAiChat()
  const { data: briefing, refetch: refetchBriefing, isFetching } = useAiBriefing()
  const { aiProvider, setAiProvider } = useAppStore()
  const bottomRef = useRef<HTMLDivElement>(null)

  const messages = history.filter(m => m.role === 'user' || m.role === 'assistant')

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, streamingText])

  async function handleSend() {
    if (!input.trim() || isStreaming) return
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

      {/* ── Chat ── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <Card className="flex-1 flex flex-col overflow-hidden p-0 min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {messages.length === 0 && !isStreaming ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Sparkles className="w-8 h-8 text-os-accent/40 mb-3" />
                <p className="text-sm font-mono text-os-muted">
                  {aiProvider === 'chatgpt' ? '✦ ChatGPT' : '◆ Claude'} is ready.
                </p>
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
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div key={i} className={cn('flex gap-2 sm:gap-3', msg.role === 'user' && 'flex-row-reverse')}>
                    <div className={cn(
                      'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
                      msg.role === 'user' ? 'bg-os-accent/20' : (msg as any).isError ? 'bg-os-danger/20' : 'bg-os-surface border border-os-border'
                    )}>
                      {msg.role === 'user'
                        ? <User className="w-3.5 h-3.5 text-os-accent" />
                        : <Bot className={cn('w-3.5 h-3.5', (msg as any).isError ? 'text-os-danger' : 'text-os-text')} />
                      }
                    </div>
                    <div className={cn(
                      'max-w-[80%] sm:max-w-[75%] p-3 rounded-xl text-sm font-mono leading-relaxed whitespace-pre-wrap',
                      msg.role === 'user'
                        ? 'bg-os-accent/10 text-os-text border border-os-accent/15 rounded-tr-sm'
                        : (msg as any).isError
                          ? 'bg-os-danger/5 text-os-danger border border-os-danger/20 rounded-tl-sm'
                          : 'bg-white/[0.03] text-os-text border border-os-border rounded-tl-sm'
                    )}>
                      {msg.content}
                    </div>
                  </div>
                ))}

                {/* Thinking indicator — waiting for first token */}
                {isThinking && !streamingText && (
                  <div className="flex gap-2 sm:gap-3">
                    <div className="w-7 h-7 rounded-full bg-os-surface border border-os-accent/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_8px_rgba(100,255,218,0.15)]">
                      <Sparkles className="w-3.5 h-3.5 text-os-accent animate-pulse" />
                    </div>
                    <div className="p-3 bg-white/[0.03] border border-os-border rounded-xl rounded-tl-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-os-muted">
                          {aiProvider === 'chatgpt' ? 'ChatGPT' : 'Claude'} is thinking
                        </span>
                        <span className="flex gap-0.5">
                          {[0, 1, 2].map(i => (
                            <span key={i} className="inline-block w-1 h-1 rounded-full bg-os-accent/70"
                              style={{ animation: 'thinkDot 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
                          ))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Streaming response — text appearing */}
                {isStreaming && streamingText && (
                  <div className="flex gap-2 sm:gap-3">
                    <div className="w-7 h-7 rounded-full bg-os-surface border border-os-border flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3.5 h-3.5 text-os-text" />
                    </div>
                    <div className="max-w-[80%] sm:max-w-[75%] p-3 bg-white/[0.03] border border-os-border rounded-xl rounded-tl-sm text-sm font-mono leading-relaxed text-os-text whitespace-pre-wrap">
                      {streamingText}
                      <span className="inline-block w-0.5 h-3.5 bg-os-accent ml-0.5 animate-pulse align-text-bottom" />
                    </div>
                  </div>
                )}
              </>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-os-border p-3 sm:p-4 space-y-2">
            {/* Provider toggle */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-os-muted">AI:</span>
              <div className="flex rounded-lg border border-os-border overflow-hidden">
                {(['chatgpt', 'claude'] as AiProvider[]).map(p => (
                  <button
                    key={p}
                    onClick={() => setAiProvider(p)}
                    className={cn(
                      'px-3 py-1 text-[10px] font-mono tracking-wide transition-all',
                      aiProvider === p
                        ? p === 'chatgpt'
                          ? 'bg-green-500/20 text-green-400 border-r border-os-border'
                          : 'bg-os-accent/15 text-os-accent'
                        : 'text-os-muted hover:text-os-text border-r last:border-r-0 border-os-border'
                    )}
                  >
                    {p === 'chatgpt' ? '✦ ChatGPT' : '◆ Claude'}
                  </button>
                ))}
              </div>
              {messages.length > 0 && !isStreaming && (
                <button onClick={clearHistory} title="Clear chat"
                  className="ml-auto text-os-muted hover:text-os-text transition-colors p-1">
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex gap-2 sm:gap-3">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder={`Ask ${aiProvider === 'chatgpt' ? 'ChatGPT' : 'Claude'} anything...`}
                className="flex-1 os-input text-sm"
                disabled={isStreaming}
              />
              <Button onClick={handleSend} loading={isStreaming} disabled={!input.trim()}>
                <Send className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

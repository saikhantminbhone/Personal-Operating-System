'use client'
import { useState, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import {
  Bold, Italic, Strikethrough, Code, Link2, List, ListOrdered,
  Heading1, Heading2, Heading3, Quote, Minus, Eye, Edit3
} from 'lucide-react'

interface RichEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  minHeight?: number
}

// Pure markdown-based editor — no heavy deps needed
// Renders markdown preview client-side with a simple parser
export function RichEditor({ value, onChange, placeholder, className, minHeight = 300 }: RichEditorProps) {
  const [mode, setMode] = useState<'edit' | 'preview' | 'split'>('edit')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const insert = useCallback((before: string, after = '', placeholder = 'text') => {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = value.slice(start, end) || placeholder
    const newValue = value.slice(0, start) + before + selected + after + value.slice(end)
    onChange(newValue)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + before.length, start + before.length + selected.length)
    }, 0)
  }, [value, onChange])

  const tools = [
    { icon: Heading1, label: 'H1', action: () => insert('# ', '', 'Heading 1') },
    { icon: Heading2, label: 'H2', action: () => insert('## ', '', 'Heading 2') },
    { icon: Heading3, label: 'H3', action: () => insert('### ', '', 'Heading 3') },
    { type: 'divider' },
    { icon: Bold, label: 'Bold', action: () => insert('**', '**', 'bold text') },
    { icon: Italic, label: 'Italic', action: () => insert('_', '_', 'italic text') },
    { icon: Strikethrough, label: 'Strike', action: () => insert('~~', '~~', 'strikethrough') },
    { icon: Code, label: 'Code', action: () => insert('`', '`', 'code') },
    { type: 'divider' },
    { icon: List, label: 'Bullet', action: () => insert('- ', '', 'list item') },
    { icon: ListOrdered, label: 'Numbered', action: () => insert('1. ', '', 'list item') },
    { icon: Quote, label: 'Quote', action: () => insert('> ', '', 'quoted text') },
    { icon: Minus, label: 'Divider', action: () => { const pos = textareaRef.current?.selectionStart || 0; onChange(value.slice(0, pos) + '\n---\n' + value.slice(pos)) } },
    { icon: Link2, label: 'Link', action: () => insert('[', '](url)', 'link text') },
  ]

  return (
    <div className={cn('border border-os-border rounded-xl overflow-hidden bg-os-surface', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-os-border bg-white/[0.02] flex-wrap">
        {tools.map((tool, i) => {
          if ((tool as any).type === 'divider') return <div key={i} className="w-px h-4 bg-os-border mx-1" />
          const Icon = (tool as any).icon
          return (
            <button key={i} onClick={(tool as any).action} title={(tool as any).label}
              className="p-1.5 rounded text-os-muted hover:text-os-text hover:bg-white/[0.06] transition-all">
              <Icon className="w-3.5 h-3.5" />
            </button>
          )
        })}

        <div className="ml-auto flex items-center gap-1 border border-os-border rounded-lg overflow-hidden">
          {(['edit', 'split', 'preview'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={cn('px-2.5 py-1 text-[10px] font-mono tracking-widest uppercase transition-all', mode === m ? 'bg-os-accent/15 text-os-accent' : 'text-os-muted hover:text-os-text')}>
              {m === 'edit' ? <><Edit3 className="w-3 h-3 inline mr-1" />Edit</> : m === 'preview' ? <><Eye className="w-3 h-3 inline mr-1" />Preview</> : 'Split'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className={cn('flex', mode === 'split' && 'divide-x divide-os-border')}>
        {/* Editor pane */}
        {(mode === 'edit' || mode === 'split') && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder || 'Write in markdown...'}
            className="flex-1 bg-transparent font-mono text-sm text-os-text placeholder:text-os-muted/40 outline-none resize-none p-4 leading-relaxed"
            style={{ minHeight }}
            spellCheck
            onKeyDown={e => {
              // Auto-indent on Enter for lists
              if (e.key === 'Enter') {
                const ta = e.currentTarget
                const pos = ta.selectionStart
                const lineStart = value.lastIndexOf('\n', pos - 1) + 1
                const currentLine = value.slice(lineStart, pos)
                const listMatch = currentLine.match(/^(\s*)([-*+]|\d+\.)\s/)
                if (listMatch) {
                  e.preventDefault()
                  const indent = listMatch[1]
                  const bullet = listMatch[2].match(/\d/) ? `${parseInt(listMatch[2]) + 1}.` : listMatch[2]
                  const insertion = `\n${indent}${bullet} `
                  onChange(value.slice(0, pos) + insertion + value.slice(pos))
                  setTimeout(() => { ta.selectionStart = ta.selectionEnd = pos + insertion.length }, 0)
                }
              }
              // Tab for indent
              if (e.key === 'Tab') {
                e.preventDefault()
                const pos = e.currentTarget.selectionStart
                onChange(value.slice(0, pos) + '  ' + value.slice(pos))
                setTimeout(() => { e.currentTarget.selectionStart = e.currentTarget.selectionEnd = pos + 2 }, 0)
              }
            }}
          />
        )}

        {/* Preview pane */}
        {(mode === 'preview' || mode === 'split') && (
          <div className="flex-1 p-4 prose-os overflow-y-auto" style={{ minHeight }}>
            <MarkdownPreview content={value} />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 px-4 py-2 border-t border-os-border">
        <span className="text-[9px] font-mono text-os-muted">
          {value.split(/\s+/).filter(Boolean).length} words · {value.length} chars
        </span>
        <span className="text-[9px] font-mono text-os-muted ml-auto">Markdown supported</span>
      </div>
    </div>
  )
}

// Simple markdown preview renderer
function MarkdownPreview({ content }: { content: string }) {
  if (!content.trim()) {
    return <p className="text-os-muted text-xs font-mono italic">Nothing to preview yet...</p>
  }

  const lines = content.split('\n')
  const elements: JSX.Element[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-xl font-bold font-mono text-os-text mt-6 mb-3 pb-2 border-b border-os-border">{inline(line.slice(2))}</h1>)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-lg font-bold font-mono text-os-text mt-5 mb-2">{inline(line.slice(3))}</h2>)
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-base font-bold font-mono text-os-text mt-4 mb-2">{inline(line.slice(4))}</h3>)
    } else if (line.startsWith('> ')) {
      elements.push(<blockquote key={i} className="border-l-2 border-os-accent pl-4 my-2 text-os-muted text-sm font-mono italic">{line.slice(2)}</blockquote>)
    } else if (line === '---') {
      elements.push(<hr key={i} className="border-os-border my-4" />)
    } else if (line.match(/^[-*+]\s/)) {
      elements.push(<li key={i} className="text-sm font-mono text-os-text ml-4 list-disc my-0.5">{inline(line.slice(2))}</li>)
    } else if (line.match(/^\d+\.\s/)) {
      elements.push(<li key={i} className="text-sm font-mono text-os-text ml-4 list-decimal my-0.5">{inline(line.replace(/^\d+\.\s/, ''))}</li>)
    } else if (line.startsWith('```')) {
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++ }
      elements.push(<pre key={i} className="bg-white/[0.04] border border-os-border rounded-lg p-3 my-3 overflow-x-auto"><code className="text-xs font-mono text-os-accent">{codeLines.join('\n')}</code></pre>)
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-3" />)
    } else {
      elements.push(<p key={i} className="text-sm font-mono text-os-text leading-relaxed my-1">{inline(line)}</p>)
    }
    i++
  }

  return <div className="space-y-0">{elements}</div>
}

function inline(text: string): React.ReactNode {
  // Bold, italic, code, links
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`|\[[^\]]+\]\([^)]+\)|~~[^~]+~~)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} className="font-bold text-os-text">{part.slice(2, -2)}</strong>
    if (part.startsWith('_') && part.endsWith('_')) return <em key={i} className="italic text-os-text">{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} className="bg-white/[0.08] px-1.5 py-0.5 rounded text-os-accent font-mono text-xs">{part.slice(1, -1)}</code>
    if (part.startsWith('~~') && part.endsWith('~~')) return <del key={i} className="line-through text-os-muted">{part.slice(2, -2)}</del>
    const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/)
    if (linkMatch) return <a key={i} href={linkMatch[2]} target="_blank" rel="noreferrer" className="text-os-accent underline underline-offset-2">{linkMatch[1]}</a>
    return part
  })
}

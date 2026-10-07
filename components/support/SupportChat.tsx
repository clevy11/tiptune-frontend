'use client'

import { FormEvent, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, MessageCircle, Send, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ChatMessage = { role: 'user' | 'assistant'; content: string }

export function SupportChat() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const message = input.trim()
    if (!message || loading) return

    setInput('')
    setMessages((current) => [...current, { role: 'user', content: message }])
    setLoading(true)
    try {
      const response = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })
      const data = await response.json() as { answer?: string; error?: string }
      setMessages((current) => [...current, {
        role: 'assistant',
        content: data.answer ?? data.error ?? 'Sorry, support chat is unavailable right now.',
      }])
    } catch {
      setMessages((current) => [...current, {
        role: 'assistant',
        content: 'Sorry, support chat is unavailable right now.',
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {open && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="mb-3 flex h-[min(36rem,calc(100vh-8rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl glass border border-white/10 shadow-2xl shadow-black/50"
            aria-label="TipTune support chat"
          >
          <header className="flex items-center justify-between bg-surface-secondary px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-neon-teal">TipTune Support</h2>
              <p className="text-xs text-muted-foreground">Ask about events and song requests</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-muted-foreground hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-neon-teal focus:ring-offset-2 focus:ring-offset-surface-primary"
              aria-label="Close support chat"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4 text-sm scrollbar-hide">
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-surface-secondary border border-white/10 px-4 py-3 text-slate-100"
              >
                Hi! How can we help with your TipTune event?
              </motion.div>
            )}
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
              >
                <ChatMessage role={message.role} content={message.content} />
              </motion.div>
            ))}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-muted-foreground"
                aria-label="Loading response"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-xs">Typing...</span>
              </motion.div>
            )}
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 border-t border-white/10 bg-surface-secondary p-3">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              maxLength={1000}
              placeholder="Type your question..."
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-surface-primary px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:border-neon-teal focus:outline-none focus:ring-1 focus:ring-neon-teal"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-lg bg-neon-teal px-4 py-2 text-sm font-medium text-surface-primary disabled:cursor-not-allowed disabled:opacity-40 transition-opacity hover:bg-teal-400 focus:outline-none focus:ring-2 focus:ring-neon-teal focus:ring-offset-2 focus:ring-offset-surface-primary"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
                  </motion.section>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-neon-teal text-surface-primary shadow-lg shadow-neon-teal/25 transition hover:bg-teal-400 focus:outline-none focus:ring-2 focus:ring-neon-teal focus:ring-offset-2 focus:ring-offset-surface-primary"
        aria-label={open ? 'Close support chat' : 'Open support chat'}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  )
}

function ChatMessage({ role, content }: { role: 'user' | 'assistant'; content: string }) {
  const isUser = role === 'user'

  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-surface-secondary border border-white/10 text-slate-100',
          'whitespace-pre-wrap break-words'
        )}
        dangerouslySetInnerHTML={renderMarkdown(content)}
      />
    </div>
  )
}

// Minimal markdown renderer: handles **bold**, - list items, emojis, plain text
// Safe: only interprets patterns we explicitly allow, preserves everything else
function renderMarkdown(text: string): { __html: string } {
  // Step 1: Wrap **-delimited text in <strong>
  let result = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

  // Step 2: Split into lines and group list items
  const lines = result.split('\n')
  const outputLines: string[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const stripped = line.trimStart()

    // Detect list item: starts with "- " or "• " (possibly indented)
    const isListItem = /^[-•] /.test(stripped)
    if (isListItem) {
      const listItems: string[] = []
      while (i < lines.length) {
        const currentLine = lines[i]
        const currentStripped = currentLine.trimStart()
        const itemMatch = currentStripped.match(/^[-•] +(.*)$/)
        if (itemMatch && currentStripped.length > 0) {
          listItems.push(itemMatch[1])
          i++
        } else {
          break
        }
      }
      outputLines.push(
        `<ul class="list-disc list-inside mb-2 text-slate-100">` +
        listItems.map((item) => `<li>${item}</li>`).join('') +
        `</ul>`
      )
      continue
    }

    // Regular paragraph line (skip empty lines)
    if (line.trim()) {
      outputLines.push(`<p class="mb-2 text-slate-100 leading-relaxed">${line}</p>`)
    }
    i++
  }

  return { __html: outputLines.join('') || '' }
}
import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUpIcon, SparklesIcon } from '@heroicons/react/24/solid'
import { Card } from '@/components/ui/Card'
import { buildCoachContext } from '@/features/coach/services/coachContext'
import { sendToCoach } from '@/features/coach/services/coachClient'
import { useCoachStore } from '@/features/coach/store/coachStore'
import { cn } from '@/utils/cn'

const SUGGESTIONS = [
  "How's my recovery looking?",
  'What should I train today?',
  'Am I hitting my protein goal?',
  'Any tips to hit a bench PR?',
]

type Notice = { kind: 'setup' } | { kind: 'network' } | { kind: 'error'; message: string }

function TypingDots() {
  return (
    <div className="flex gap-1 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="size-1.5 rounded-full bg-content-tertiary"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  )
}

export default function CoachPage() {
  const messages = useCoachStore((s) => s.messages)
  const addMessage = useCoachStore((s) => s.addMessage)
  const reset = useCoachStore((s) => s.reset)

  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [notice, setNotice] = useState<Notice | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending, notice])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setInput('')
    setNotice(null)
    addMessage('user', trimmed)
    setSending(true)

    const history = useCoachStore.getState().messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))
    const result = await sendToCoach(history, buildCoachContext())
    setSending(false)

    if (result.ok) {
      addMessage('assistant', result.text)
    } else if (result.reason === 'not_configured') {
      setNotice({ kind: 'setup' })
    } else if (result.reason === 'network') {
      setNotice({ kind: 'network' })
    } else {
      setNotice({ kind: 'error', message: result.message ?? 'Something went wrong.' })
    }
  }

  const isEmpty = messages.length === 0

  return (
    <div className="mx-auto flex h-dvh max-w-lg flex-col px-4 pt-safe">
      <header className="flex items-center justify-between pt-6 pb-3">
        <div>
          <p className="text-[13px] font-semibold tracking-wide text-content-secondary uppercase">
            More
          </p>
          <h1 className="text-[28px] leading-tight font-bold tracking-tight">AI Coach</h1>
        </div>
        {!isEmpty ? (
          <button
            type="button"
            onClick={() => {
              reset()
              setNotice(null)
            }}
            className="rounded-full bg-surface px-3.5 py-1.5 text-[13px] font-semibold text-content-secondary"
          >
            New chat
          </button>
        ) : null}
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto overscroll-contain pb-2">
        {isEmpty ? (
          <div className="flex flex-col items-center gap-4 px-4 pt-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-accent-muted">
              <SparklesIcon className="size-7 text-accent" />
            </div>
            <div>
              <p className="text-[17px] font-semibold">Your personal coach</p>
              <p className="mt-1 text-[14px] leading-relaxed text-content-secondary">
                Ask about training, recovery, or nutrition. I read your logged data to give advice
                tailored to you.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void send(s)}
                  className="rounded-control bg-surface px-4 py-3 text-left text-[14px] font-medium"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap',
                  m.role === 'user'
                    ? 'bg-accent text-black'
                    : 'bg-surface text-content',
                )}
              >
                {m.content}
              </div>
            </motion.div>
          ))
        )}

        {sending ? (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-surface px-3 py-2">
              <TypingDots />
            </div>
          </div>
        ) : null}

        {notice ? (
          <Card className="bg-surface-raised">
            {notice.kind === 'setup' ? (
              <div className="text-[13px] leading-relaxed text-content-secondary">
                <p className="font-semibold text-content">Coach isn't connected yet</p>
                <p className="mt-1">
                  The AI Coach needs an Anthropic API key added to this site on Netlify (Site
                  settings → Environment variables → <span className="text-content">ANTHROPIC_API_KEY</span>),
                  then a redeploy. Once that's set, ask away.
                </p>
              </div>
            ) : notice.kind === 'network' ? (
              <p className="text-[13px] text-content-secondary">
                Couldn't reach the coach. Check your connection and try again.
              </p>
            ) : (
              <p className="text-[13px] text-content-secondary">{notice.message}</p>
            )}
          </Card>
        ) : null}
      </div>

      <div className="pb-tabbar pt-2">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void send(input)
              }
            }}
            rows={1}
            placeholder="Ask your coach…"
            aria-label="Message"
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl bg-surface px-4 py-2.5 text-[16px] outline-none placeholder:text-content-tertiary focus:ring-2 focus:ring-accent/60"
          />
          <button
            type="button"
            onClick={() => void send(input)}
            disabled={!input.trim() || sending}
            aria-label="Send"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-black disabled:opacity-40"
          >
            <ArrowUpIcon className="size-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

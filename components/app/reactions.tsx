'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { SmilePlus } from 'lucide-react'
import { toast } from 'sonner'
import { SPRING, DUR, EASE } from '@/components/motion'
import { cn } from '@/lib/utils'

export type ReactionAgg = { emoji: string; count: number; mine: boolean }

// Must mirror the API's allowlist (internal/reactions/reactions.go).
const PALETTE = ['👍', '❤️', '🎉', '💡', '🤔'] as const

// applyToggle mirrors the server's flip so the UI can react instantly; it is its own inverse, so a
// failed request is undone by applying it again. The server response then reconciles to the truth.
function applyToggle(list: ReactionAgg[], emoji: string): ReactionAgg[] {
  const existing = list.find((r) => r.emoji === emoji)
  if (!existing) return [...list, { emoji, count: 1, mine: true }]
  const count = existing.count + (existing.mine ? -1 : 1)
  if (count <= 0) return list.filter((r) => r.emoji !== emoji)
  return list.map((r) => (r.emoji === emoji ? { emoji, count, mine: !existing.mine } : r))
}

export function Reactions({
  targetType,
  targetId,
  initial,
  className,
}: {
  targetType: 'lesson' | 'comment'
  targetId: string
  initial?: ReactionAgg[] // comments embed their reactions; a lesson fetches on mount
  className?: string
}) {
  const [reactions, setReactions] = useState<ReactionAgg[]>(initial ?? [])
  const [loaded, setLoaded] = useState(initial != null)
  const [picking, setPicking] = useState(false)

  // A lesson's reactions aren't embedded anywhere, so pull them once.
  useEffect(() => {
    if (loaded) return
    let alive = true
    fetch(`/api/reactions?type=${targetType}&id=${targetId}`)
      .then((r) => (r.ok ? r.json() : { reactions: [] }))
      .then((d) => alive && (setReactions(d.reactions ?? []), setLoaded(true)))
      .catch(() => alive && setLoaded(true))
    return () => {
      alive = false
    }
  }, [loaded, targetType, targetId])

  const toggle = useCallback(
    async (emoji: string) => {
      setPicking(false)
      setReactions((cur) => applyToggle(cur, emoji)) // optimistic
      try {
        const res = await fetch('/api/reactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targetType, targetId, emoji }),
        })
        if (!res.ok) throw new Error()
        const d = await res.json()
        setReactions(d.reactions ?? []) // reconcile to server truth
      } catch {
        setReactions((cur) => applyToggle(cur, emoji)) // revert
        toast.error('Could not save your reaction')
      }
    },
    [targetType, targetId],
  )

  const mine = new Set(reactions.filter((r) => r.mine).map((r) => r.emoji))

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      <AnimatePresence initial={false} mode="popLayout">
        {reactions.map((r) => (
          <m.button
            key={r.emoji}
            layout
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            whileTap={{ scale: 0.9 }}
            transition={SPRING.press}
            onClick={() => toggle(r.emoji)}
            aria-pressed={r.mine}
            aria-label={`${r.emoji} ${r.count}${r.mine ? ' — you reacted' : ''}`}
            className={cn(
              'focus-ring inline-flex items-center gap-1 rounded-full border px-2 py-0.5 leading-none transition-colors',
              r.mine
                ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/15 dark:text-indigo-200'
                : 'border-border bg-card text-muted-foreground hover:bg-muted',
            )}
          >
            <span className="text-[15px]">{r.emoji}</span>
            <m.span
              key={r.count}
              initial={{ scale: 1.35 }}
              animate={{ scale: 1 }}
              transition={SPRING.press}
              className="text-xs font-semibold tabular-nums"
            >
              {r.count}
            </m.span>
          </m.button>
        ))}
      </AnimatePresence>

      <Picker open={picking} setOpen={setPicking} mine={mine} onPick={toggle} hasReactions={reactions.length > 0} />
    </div>
  )
}

function Picker({
  open,
  setOpen,
  mine,
  onPick,
  hasReactions,
}: {
  open: boolean
  setOpen: (v: boolean) => void
  mine: Set<string>
  onPick: (emoji: string) => void
  hasReactions: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click / Escape — a lightweight popover (no portal needed at this scale).
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, setOpen])

  return (
    <div ref={ref} className="relative">
      <m.button
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.9 }}
        transition={SPRING.press}
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Add a reaction"
        className={cn(
          'focus-ring inline-flex items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-indigo-300 hover:bg-muted hover:text-foreground dark:hover:border-indigo-500/40',
          hasReactions ? 'size-7' : 'h-7 gap-1 px-2.5',
        )}
      >
        <SmilePlus className="size-4 shrink-0" aria-hidden />
        {!hasReactions && <span className="text-xs font-medium">React</span>}
      </m.button>

      <AnimatePresence>
        {open && (
          <m.div
            role="menu"
            initial={{ opacity: 0, scale: 0.85, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 4 }}
            transition={{ duration: DUR.fast, ease: EASE.out }}
            style={{ transformOrigin: 'bottom left' }}
            className="absolute bottom-full left-0 z-20 mb-1.5 flex gap-0.5 rounded-full border border-border bg-popover p-1 shadow-lg"
          >
            {PALETTE.map((e, i) => (
              <m.button
                key={e}
                role="menuitem"
                initial={{ opacity: 0, scale: 0.4, y: 8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  transition: { delay: i * 0.035, type: 'spring', stiffness: 520, damping: 16 },
                }}
                whileHover={{ scale: 1.45, y: -5 }}
                whileTap={{ scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 400, damping: 11 }}
                onClick={() => onPick(e)}
                aria-label={`React ${e}${mine.has(e) ? ' (selected)' : ''}`}
                className={cn(
                  'focus-ring grid size-9 origin-bottom place-items-center rounded-full text-xl leading-none transition-colors',
                  mine.has(e) ? 'bg-indigo-100 dark:bg-indigo-500/20' : 'hover:bg-indigo-50 dark:hover:bg-indigo-500/15',
                )}
              >
                {e}
              </m.button>
            ))}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

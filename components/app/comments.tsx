'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { MessageSquare, Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FadeInUp } from '@/components/motion'
import { Reactions, type ReactionAgg } from './reactions'
import { cn } from '@/lib/utils'

// A small set of calm tints; each author gets a stable one (functional color — tells people apart).
const AVATAR_TINTS = [
  'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300',
  'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-300',
  'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
  'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
  'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
  'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
]
function tint(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_TINTS[h % AVATAR_TINTS.length]
}

type Node = {
  id: string
  author: string
  authorId: string
  body: string
  deleted: boolean
  createdAt: string
  reactions: ReactionAgg[]
  replies: Node[]
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}
function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?'
}

export function Comments({ lessonId, userId, role }: { lessonId: string; userId: string; role: string }) {
  const [tree, setTree] = useState<Node[]>([])
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [posting, setPosting] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/lessons/${lessonId}/comments`)
    if (res.ok) {
      const d = await res.json()
      setTree(d.comments ?? [])
      setCount(d.count ?? 0)
    }
    setLoading(false)
  }, [lessonId])
  useEffect(() => {
    void load()
  }, [load])

  // Post then refetch — the authoritative tree is built server-side (O(n)); no client-side surgery.
  const post = useCallback(
    async (text: string, parentId: string | null): Promise<boolean> => {
      const t = text.trim()
      if (!t) return false
      const res = await fetch(`/api/lessons/${lessonId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: t, parentId }),
      })
      if (res.ok) {
        await load()
        return true
      }
      toast.error('Could not post', { description: (await res.json().catch(() => ({}))).error })
      return false
    },
    [lessonId, load],
  )
  const del = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' })
      if (res.ok) await load()
      else toast.error('Could not delete comment')
    },
    [load],
  )

  async function submitTop(e: React.FormEvent) {
    e.preventDefault()
    setPosting(true)
    const okk = await post(body, null)
    setPosting(false)
    if (okk) setBody('')
  }

  return (
    <section className="mt-12 border-t border-border pt-8">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
        <MessageSquare className="size-5" aria-hidden /> Comments
        <span className="font-mono text-sm tabular-nums text-muted-foreground">{count}</span>
      </h2>

      <form onSubmit={submitTop} className="mb-6 flex gap-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a comment…"
          rows={2}
          aria-label="Add a comment"
          className="focus-ring min-h-[2.75rem] flex-1 resize-y rounded-md border border-input bg-card px-3 py-2 text-sm"
        />
        <Button type="submit" disabled={posting || !body.trim()} className="self-end">
          {posting ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Send className="size-4" aria-hidden />}
          Post
        </Button>
      </form>

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 animate-pulse rounded bg-muted motion-reduce:animate-none" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-muted motion-reduce:animate-none" />
              </div>
            </div>
          ))}
        </div>
      ) : tree.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 py-8 text-center text-sm text-muted-foreground">
          No comments yet — start the discussion.
        </p>
      ) : (
        <FadeInUp>
          <ul className="space-y-5">
            {tree.map((n) => (
              <CommentItem key={n.id} node={n} depth={0} userId={userId} role={role} onReply={post} onDelete={del} />
            ))}
          </ul>
        </FadeInUp>
      )}
    </section>
  )
}

function CommentItem({
  node,
  depth,
  userId,
  role,
  onReply,
  onDelete,
}: {
  node: Node
  depth: number
  userId: string
  role: string
  onReply: (text: string, parentId: string) => Promise<boolean>
  onDelete: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const canDelete = !node.deleted && (node.authorId === userId || role === 'teacher')

  return (
    <li className={cn(depth > 0 && 'border-l border-border pl-4')}>
      <div className="flex gap-3">
        <div
          className={cn(
            'grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold',
            node.deleted ? 'bg-muted text-muted-foreground' : tint(node.author),
          )}
          aria-hidden
        >
          {node.deleted ? '—' : initials(node.author)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <span className="font-medium">{node.author}</span>
            {!node.deleted && node.authorId === userId && (
              <span className="ml-1.5 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                You
              </span>
            )}
            <span className="text-xs text-muted-foreground"> · {timeAgo(node.createdAt)}</span>
          </p>
          <p className={cn('mt-0.5 whitespace-pre-wrap break-words text-sm', node.deleted && 'italic text-muted-foreground')}>
            {node.body}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
            {!node.deleted && <Reactions targetType="comment" targetId={node.id} initial={node.reactions ?? []} />}
            {!node.deleted && (
              <button onClick={() => setOpen((o) => !o)} className="focus-ring rounded font-medium text-muted-foreground hover:text-foreground">
                Reply
              </button>
            )}
            {canDelete && (
              <button onClick={() => onDelete(node.id)} className="focus-ring rounded font-medium text-muted-foreground hover:text-destructive">
                Delete
              </button>
            )}
          </div>

          {open && (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                setBusy(true)
                const okk = await onReply(text, node.id)
                setBusy(false)
                if (okk) {
                  setText('')
                  setOpen(false)
                }
              }}
              className="mt-2 flex gap-2"
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={`Reply to ${node.author}…`}
                aria-label="Reply"
                className="focus-ring flex-1 rounded-md border border-input bg-card px-2.5 py-1.5 text-sm"
              />
              <Button type="submit" size="sm" disabled={busy || !text.trim()}>
                {busy && <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden />}
                Reply
              </Button>
            </form>
          )}

          {node.replies.length > 0 && (
            <ul className="mt-4 space-y-4">
              {node.replies.map((c) => (
                <CommentItem key={c.id} node={c} depth={depth + 1} userId={userId} role={role} onReply={onReply} onDelete={onDelete} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  )
}

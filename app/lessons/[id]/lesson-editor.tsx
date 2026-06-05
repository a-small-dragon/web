'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, Save, Globe, EyeOff, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Markdown } from '@/components/app/markdown'
import { cn } from '@/lib/utils'

type Lesson = { id: string; title: string; bodyMd: string; status: string; visibility: string; classIds: string[] }
type ClassRef = { id: string; name: string }

export default function LessonEditor({ lesson, classes }: { lesson: Lesson; classes: ClassRef[] }) {
  const router = useRouter()
  const [title, setTitle] = useState(lesson.title)
  const [body, setBody] = useState(lesson.bodyMd)
  const [status, setStatus] = useState(lesson.status)
  const [visibility, setVisibility] = useState(lesson.visibility || 'teacher')
  const [classIds, setClassIds] = useState<string[]>(lesson.classIds ?? [])
  const [busy, setBusy] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const published = status === 'published'

  // Persist the current on-screen edits (title/body/audience). Shared by Save and Publish so Publish
  // can never lose unsaved content.
  function persist() {
    return fetch(`/api/lessons/${lesson.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim(),
        bodyMd: body,
        visibility,
        classIds: visibility === 'class' ? classIds : [],
      }),
    })
  }

  async function save() {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    setBusy(true)
    const res = await persist()
    setBusy(false)
    if (res.ok) toast.success('Saved')
    else toast.error('Could not save', { description: (await res.json().catch(() => ({}))).error })
  }

  async function togglePublish() {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    setPublishing(true)
    // Save first → Publish always reflects what's on screen (otherwise typed-but-unsaved body is lost).
    const saved = await persist()
    if (!saved.ok) {
      setPublishing(false)
      toast.error('Could not save before publishing')
      return
    }
    const res = await fetch(`/api/lessons/${lesson.id}/publish`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published: !published }),
    })
    setPublishing(false)
    if (res.ok) {
      const updated = await res.json()
      setStatus(updated.status)
      toast.success(updated.status === 'published' ? 'Published — students can read it' : 'Unpublished')
    } else {
      toast.error('Could not update', { description: (await res.json().catch(() => ({}))).error })
    }
  }

  async function del() {
    const res = await fetch(`/api/lessons/${lesson.id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Lesson deleted')
      router.push('/lessons')
    } else {
      toast.error('Could not delete')
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
      <Link href="/lessons" className="focus-ring mb-4 inline-flex items-center gap-1 rounded text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All lessons
      </Link>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          aria-label="Lesson title"
          className="min-w-[14rem] flex-1 text-lg font-semibold"
        />
        <Badge variant={published ? 'success' : 'outline'}>{status}</Badge>
        <div className="flex gap-2">
          <Button variant="outline" onClick={save} disabled={busy}>
            {busy ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <Save className="size-4" aria-hidden />}
            Save
          </Button>
          <Button onClick={togglePublish} disabled={publishing}>
            {publishing ? (
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
            ) : published ? (
              <EyeOff className="size-4" aria-hidden />
            ) : (
              <Globe className="size-4" aria-hidden />
            )}
            {published ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3 text-sm">
        <span className="font-medium">Audience</span>
        <div role="radiogroup" aria-label="Lesson audience" className="flex gap-1 rounded-md bg-muted p-1">
          {([['teacher', 'All my students'], ['class', 'Specific classes']] as const).map(([v, label]) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={visibility === v}
              onClick={() => setVisibility(v)}
              className={cn(
                'focus-ring rounded px-2.5 py-1 transition-colors',
                visibility === v ? 'bg-card font-medium shadow-e1' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {visibility === 'class' ? (
          classes.length === 0 ? (
            <span className="text-muted-foreground">No classes yet — create one to scope this lesson.</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {classes.map((c) => {
                const on = classIds.includes(c.id)
                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setClassIds((p) => (on ? p.filter((x) => x !== c.id) : [...p, c.id]))}
                    className={cn(
                      'focus-ring rounded-full border px-2.5 py-0.5 text-xs transition-colors',
                      on ? 'border-primary bg-accent text-foreground' : 'border-input text-muted-foreground hover:bg-accent',
                    )}
                  >
                    {c.name}
                  </button>
                )
              })}
            </div>
          )
        ) : (
          <span className="text-muted-foreground">Everyone enrolled in any of your classes.</span>
        )}
        <span className="ml-auto text-xs text-muted-foreground">Save to apply</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Markdown</p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            spellCheck={false}
            placeholder={'# Heading\n\nWrite with **Markdown** — lists, `code`, tables, > quotes…'}
            aria-label="Lesson Markdown"
            className="focus-ring h-[60vh] w-full resize-y rounded-md border border-input bg-card px-3 py-2 font-mono text-sm leading-relaxed"
          />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preview</p>
          <div className="h-[60vh] overflow-auto rounded-md border border-border bg-card p-5">
            <Markdown>{body.trim() || '*Nothing to preview yet — start writing on the left.*'}</Markdown>
          </div>
        </div>
      </div>

      <div className="mt-6">
        {confirmDel ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Delete this lesson?</span>
            <Button variant="destructive" size="sm" onClick={del}>Yes, delete</Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDel(false)}>Cancel</Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfirmDel(true)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" aria-hidden /> Delete lesson
          </Button>
        )}
      </div>
    </div>
  )
}

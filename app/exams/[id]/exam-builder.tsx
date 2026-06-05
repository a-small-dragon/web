'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { Loader2, ArrowLeft, BarChart3, Pencil, GripVertical, X, Plus, AlertTriangle, Users } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Button, buttonVariants } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

type Option = { id: string; text: string }
type Question = { id: string; stem: string; options: Option[]; correctOptionId: string; tags: string[] }
type Exam = { id: string; title: string; durationMin: number; passMark: number; status: string }
type ExamQ = { question: Question; position: number; points: number }
type Chosen = { id: string; points: number }
type ExamClass = { classId: string; name: string; studentCount: number; assigned: boolean; dueAt: string | null }

export default function ExamBuilder({
  exam,
  examQuestions,
  bank,
  initialClasses,
}: {
  exam: Exam
  examQuestions: ExamQ[]
  bank: Question[]
  initialClasses: ExamClass[]
}) {
  const router = useRouter()
  // Which classes this exam is assigned to. An exam is only visible to a student once it is BOTH
  // published AND assigned to a class they're enrolled in — assigning here is what makes it visible.
  const [classes, setClasses] = useState<ExamClass[]>(initialClasses)
  const [savingClasses, setSavingClasses] = useState(false)
  const assignedCount = classes.filter((c) => c.assigned).length
  // Ordered list (position = array index). examQuestions arrive ordered by position from the API.
  const [chosen, setChosen] = useState<Chosen[]>(examQuestions.map((eq) => ({ id: eq.question.id, points: eq.points })))
  const [busy, setBusy] = useState(false)
  const [publishing, setPublishing] = useState(false)

  // Editable exam meta (title/duration/pass-mark) — questions are managed below, untouched by this.
  const [meta, setMeta] = useState({ title: exam.title, durationMin: exam.durationMin, passMark: exam.passMark })
  const [editingMeta, setEditingMeta] = useState(false)
  const [draft, setDraft] = useState(meta)
  const [savingMeta, setSavingMeta] = useState(false)

  const byId = useMemo(() => Object.fromEntries(bank.map((q) => [q.id, q])), [bank])
  const chosenIds = useMemo(() => new Set(chosen.map((c) => c.id)), [chosen])
  const available = bank.filter((q) => !chosenIds.has(q.id))
  const totalPoints = chosen.reduce((s, c) => s + (c.points || 1), 0)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (over && active.id !== over.id) {
      setChosen((prev) => {
        const from = prev.findIndex((c) => c.id === active.id)
        const to = prev.findIndex((c) => c.id === over.id)
        return from < 0 || to < 0 ? prev : arrayMove(prev, from, to)
      })
    }
  }
  function addQuestion(id: string) {
    setChosen((prev) => (prev.some((c) => c.id === id) ? prev : [...prev, { id, points: 1 }]))
  }
  function removeQuestion(id: string) {
    setChosen((prev) => prev.filter((c) => c.id !== id))
  }
  function setPoints(id: string, v: number) {
    setChosen((prev) => prev.map((c) => (c.id === id ? { ...c, points: Math.max(1, v || 1) } : c)))
  }

  function openEdit() {
    setDraft(meta)
    setEditingMeta(true)
  }
  async function saveMeta(e: React.FormEvent) {
    e.preventDefault()
    const title = draft.title.trim()
    if (!title) {
      toast.error('Title is required')
      return
    }
    setSavingMeta(true)
    const body = { title, durationMin: Number(draft.durationMin), passMark: Number(draft.passMark) }
    const res = await fetch(`/api/exams/${exam.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSavingMeta(false)
    if (res.ok) {
      setMeta(body)
      setEditingMeta(false)
      toast.success('Exam updated')
    } else {
      toast.error('Could not update exam', { description: (await res.json().catch(() => ({}))).error })
    }
  }

  // PUT replaces the whole assignment set; send the assigned classes with their due dates (date-only).
  async function persistClasses(next: ExamClass[]) {
    const snapshot = classes
    setClasses(next) // optimistic
    setSavingClasses(true)
    const payload = next.filter((c) => c.assigned).map((c) => ({ classId: c.classId, dueAt: c.dueAt ? c.dueAt.slice(0, 10) : null }))
    const res = await fetch(`/api/exams/${exam.id}/classes`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classes: payload }),
    })
    setSavingClasses(false)
    if (res.ok) {
      const d = await res.json().catch(() => ({}))
      if (Array.isArray(d.classes)) setClasses(d.classes) // reconcile (server normalizes dueAt to end-of-day)
    } else {
      setClasses(snapshot) // revert
      toast.error('Could not update classes', { description: (await res.json().catch(() => ({}))).error })
    }
  }
  function toggleClass(classId: string) {
    void persistClasses(classes.map((c) => (c.classId === classId ? { ...c, assigned: !c.assigned } : c)))
  }
  function setClassDue(classId: string, date: string) {
    void persistClasses(classes.map((c) => (c.classId === classId ? { ...c, dueAt: date ? `${date}T23:59:59Z` : null } : c)))
  }

  async function save() {
    setBusy(true)
    const questions = chosen.map((c) => ({ questionId: c.id, points: c.points || 1 }))
    const res = await fetch(`/api/exams/${exam.id}/questions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions }),
    })
    setBusy(false)
    if (res.ok) {
      toast.success('Exam saved')
      router.refresh()
    } else {
      toast.error('Could not save exam', { description: (await res.json().catch(() => ({}))).error })
    }
  }

  async function publish() {
    if (chosen.length === 0) {
      toast.error('Add at least one question before publishing')
      return
    }
    setPublishing(true)
    // Save the current (possibly reordered/added) question set first, so Publish uses what's on screen.
    const questions = chosen.map((c) => ({ questionId: c.id, points: c.points || 1 }))
    const saved = await fetch(`/api/exams/${exam.id}/questions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions }),
    })
    if (!saved.ok) {
      setPublishing(false)
      toast.error('Could not save before publishing', { description: (await saved.json().catch(() => ({}))).error })
      return
    }
    const res = await fetch(`/api/exams/${exam.id}/publish`, { method: 'PUT' })
    setPublishing(false)
    if (res.ok) {
      // Publishing alone doesn't reveal it — it must also be assigned to a class.
      if (assignedCount > 0) toast.success('Published — assigned students can now take it')
      else toast.warning('Published, but not visible yet', { description: 'Assign it to a class below so students can see it.' })
      router.refresh()
    } else {
      toast.error('Could not publish', { description: (await res.json().catch(() => ({}))).error })
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:py-10">
      <Link href="/exams" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All exams
      </Link>
      <header className="mb-6">
        {editingMeta ? (
          <form onSubmit={saveMeta} className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-xs">
            <div className="space-y-1.5">
              <Label htmlFor="ex-title">Title</Label>
              <Input id="ex-title" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ex-dur">Duration (min)</Label>
                <Input id="ex-dur" type="number" min={1} value={draft.durationMin} onChange={(e) => setDraft((d) => ({ ...d, durationMin: Number(e.target.value) }))} className="w-32" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ex-pass">Pass %</Label>
                <Input id="ex-pass" type="number" min={0} max={100} value={draft.passMark} onChange={(e) => setDraft((d) => ({ ...d, passMark: Number(e.target.value) }))} className="w-28" />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={savingMeta}>
                {savingMeta && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />}
                Save
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditingMeta(false)}>
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight">{meta.title}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-mono tabular-nums">{meta.durationMin}</span> min · pass{' '}
                <span className="font-mono tabular-nums">{meta.passMark}%</span>
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={openEdit} className="shrink-0">
              <Pencil className="size-4" aria-hidden /> Edit
            </Button>
          </div>
        )}
      </header>

      <Card className="mb-6 lg:sticky lg:top-20 z-10">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Badge variant="secondary" className="font-mono tabular-nums">
            {chosen.length} questions · {totalPoints} pts
          </Badge>
          <Badge variant={exam.status === 'published' ? 'success' : 'outline'}>{exam.status}</Badge>
          <div className="ml-auto flex gap-2">
            <Link href={`/exams/${exam.id}/results`} className={cn(buttonVariants({ variant: 'ghost' }))}>
              <BarChart3 className="size-4" aria-hidden /> Results
            </Link>
            <Button variant="outline" onClick={save} disabled={busy}>
              {busy && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />}
              {busy ? 'Saving…' : 'Save'}
            </Button>
            <Button onClick={publish} disabled={publishing || chosen.length === 0}>
              {publishing && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />}
              {publishing ? 'Publishing…' : exam.status === 'published' ? 'Re-publish' : 'Publish'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Published but reaching nobody — the #1 "students don't see my exam" trap. */}
      {exam.status === 'published' && assignedCount === 0 && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>
            <strong>No students can see this exam yet.</strong> It’s published but not assigned to any class.
            Tick a class below to make it visible.
          </p>
        </div>
      )}

      {/* Assign to classes — the step that actually makes a published exam visible to students. */}
      <section className="mb-8">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold">
          Assign to classes
          {assignedCount > 0 && (
            <Badge variant="secondary" className="font-mono tabular-nums">
              {assignedCount}
            </Badge>
          )}
          {savingClasses && <Loader2 className="size-4 animate-spin text-muted-foreground motion-reduce:animate-none" aria-hidden />}
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          Students see this exam only once it’s <strong>published</strong> and assigned to a class they’re in.
        </p>
        {classes.length === 0 ? (
          <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            You have no classes yet — <Link href="/classes" className="text-primary hover:underline">create one</Link> to assign this exam.
          </div>
        ) : (
          <ul className="space-y-2">
            {classes.map((c) => (
              <li key={c.classId}>
                <Card className={cn('transition-colors', c.assigned && 'ring-1 ring-primary/30')}>
                  <CardContent className="flex flex-wrap items-center gap-3 p-3">
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={c.assigned}
                        onChange={() => toggleClass(c.classId)}
                        disabled={savingClasses}
                        className="size-4 shrink-0 accent-primary"
                        aria-label={`Assign this exam to ${c.name}`}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{c.name}</span>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="size-3" aria-hidden />
                          {c.studentCount} student{c.studentCount === 1 ? '' : 's'}
                        </span>
                      </span>
                    </label>
                    {c.assigned && (
                      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        Due
                        <input
                          type="date"
                          value={c.dueAt ? c.dueAt.slice(0, 10) : ''}
                          onChange={(e) => setClassDue(c.classId, e.target.value)}
                          aria-label={`Due date for ${c.name}`}
                          className="focus-ring rounded-md border border-input bg-card px-2 py-1 text-xs text-foreground"
                        />
                      </label>
                    )}
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* In this exam — ordered, drag to reorder */}
      <section className="mb-8">
        <h2 className="mb-1 text-lg font-semibold">In this exam</h2>
        <p className="mb-3 text-sm text-muted-foreground">Drag to set the order students see — then Save.</p>
        {chosen.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            No questions yet — add them from your bank below.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={chosen.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <ul className="space-y-2">
                {chosen.map((c, i) => {
                  const q = byId[c.id]
                  if (!q) return null
                  return (
                    <SortableRow
                      key={c.id}
                      id={c.id}
                      index={i}
                      stem={q.stem}
                      points={c.points}
                      onPoints={(v) => setPoints(c.id, v)}
                      onRemove={() => removeQuestion(c.id)}
                    />
                  )
                })}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </section>

      {/* Question bank — add source */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Question bank</h2>
        {bank.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
            No questions yet — <Link href="/questions" className="text-primary hover:underline">add some</Link> first.
          </div>
        ) : available.length === 0 ? (
          <p className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
            All your questions are in this exam.
          </p>
        ) : (
          <ul className="space-y-3">
            {available.map((q) => (
              <li key={q.id}>
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{q.stem}</p>
                      <p className="text-sm text-muted-foreground">{q.options.length} options</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => addQuestion(q.id)} aria-label={`Add "${q.stem}" to exam`}>
                      <Plus className="size-4" aria-hidden /> Add
                    </Button>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function SortableRow({
  id,
  index,
  stem,
  points,
  onPoints,
  onRemove,
}: {
  id: string
  index: number
  stem: string
  points: number
  onPoints: (v: number) => void
  onRemove: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <li ref={setNodeRef} style={style} className={cn(isDragging && 'relative z-10')}>
      <Card className={cn('transition-shadow', isDragging && 'shadow-e3 ring-1 ring-primary/40')}>
        <CardContent className="flex items-center gap-3 p-3">
          <button
            type="button"
            className="focus-ring -ml-1 cursor-grab touch-none rounded p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
            aria-label={`Reorder: ${stem}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted font-mono text-xs tabular-nums text-muted-foreground">
            {index + 1}
          </span>
          <p className="min-w-0 flex-1 truncate text-sm font-medium">{stem}</p>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            pts
            <Input
              type="number"
              min={1}
              value={points}
              onChange={(e) => onPoints(Number(e.target.value))}
              aria-label={`Points for ${stem}`}
              className="w-16"
            />
          </label>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${stem} from exam`}
            className="focus-ring rounded p-1 text-muted-foreground hover:text-destructive"
          >
            <X className="size-4" aria-hidden />
          </button>
        </CardContent>
      </Card>
    </li>
  )
}

'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Plus, X, AlertCircle, FileQuestion, Search } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { QuestionCard } from './question-card'
import { AnimatedList, AnimatedListItem } from '@/components/motion'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { useQuestions, useCreateQuestion, useUpdateQuestion, useDeleteQuestion, isTemp } from '@/lib/use-questions'

const LETTERS = ['a', 'b', 'c', 'd', 'e', 'f']

type Option = { id: string; text: string }
export type Question = { id: string; stem: string; options: Option[]; correctOptionId: string; tags: string[] }

export default function QuestionsManager({ initial }: { initial: Question[] }) {
  const { data: questions = [] } = useQuestions(initial)
  const create = useCreateQuestion()
  const update = useUpdateQuestion()
  const del = useDeleteQuestion()
  const saving = create.isPending || update.isPending

  const stemRef = useRef<HTMLInputElement>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [stem, setStem] = useState('')
  const [options, setOptions] = useState<string[]>(['', ''])
  const [correct, setCorrect] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [tagDraft, setTagDraft] = useState('')
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  function reset() {
    setEditingId(null); setStem(''); setOptions(['', '']); setCorrect(0); setTags([]); setTagDraft(''); setError('')
  }
  function startEdit(q: Question) {
    setEditingId(q.id)
    setStem(q.stem)
    setOptions(q.options.map((o) => o.text))
    const idx = q.options.findIndex((o) => o.id === q.correctOptionId)
    setCorrect(idx < 0 ? 0 : idx)
    setTags(q.tags ?? [])
    setTagDraft('')
    setError('')
    stemRef.current?.focus()
  }
  function setOpt(i: number, v: string) {
    setOptions((p) => p.map((o, idx) => (idx === i ? v : o)))
  }
  function addOpt() {
    if (options.length < 6) setOptions((p) => [...p, ''])
  }
  function removeOpt(i: number) {
    if (options.length <= 2) return
    setOptions((p) => p.filter((_, idx) => idx !== i))
    if (correct >= i && correct > 0) setCorrect((c) => c - 1)
  }
  function addTag(raw: string) {
    const t = raw.trim().toLowerCase().replace(/,+$/, '').trim()
    if (t && !tags.includes(t) && tags.length < 8) setTags((p) => [...p, t])
    setTagDraft('')
  }
  function removeTag(t: string) {
    setTags((p) => p.filter((x) => x !== t))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const input = {
      stem,
      options: options.map((text, i) => ({ id: LETTERS[i], text })),
      correctOptionId: LETTERS[correct],
      tags,
    }
    if (editingId) {
      update.mutate(
        { id: editingId, input },
        { onSuccess: () => { reset(); toast.success('Question saved') }, onError: () => setError('could not save question') },
      )
    } else {
      create.mutate(input, {
        onSuccess: () => { reset(); toast.success('Question added') },
        onError: () => setError('could not save question'),
      })
    }
  }

  const needle = query.trim().toLowerCase()
  const filtered = needle
    ? questions.filter(
        (it) => it.stem.toLowerCase().includes(needle) || (it.tags ?? []).some((t) => t.toLowerCase().includes(needle)),
      )
    : questions

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
      <PageHeader
        title="Question bank"
        count={questions.length}
        description="Author multiple-choice questions — the reusable bank every exam draws from."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(380px,440px)_1fr] lg:items-start">
        {/* EDITOR (sticky on lg) */}
        <section>
          <Card className="shadow-xs lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">{editingId ? 'Edit question' : 'New question'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="stem">Question</Label>
                  <Input id="stem" ref={stemRef} value={stem} required placeholder="e.g. 2 + 2 = ?" onChange={(e) => setStem(e.target.value)} />
                </div>

                <div className="space-y-3">
                  <p id="correct-label" className="text-sm font-medium">Options — select the correct answer</p>
                  <div role="radiogroup" aria-labelledby="correct-label" className="space-y-2">
                    {options.map((o, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 rounded-md border border-input bg-card px-3 py-2 transition-colors duration-150 has-[:checked]:border-success/40 has-[:checked]:bg-success-subtle/50"
                      >
                        <input
                          type="radio"
                          name="correct"
                          value={i}
                          checked={correct === i}
                          onChange={() => setCorrect(i)}
                          aria-label={`Mark option ${LETTERS[i]} as correct`}
                          className="size-4 accent-success focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <span className="grid size-6 place-items-center rounded-md bg-muted font-mono text-xs font-medium uppercase tabular-nums text-muted-foreground">
                          {LETTERS[i]}
                        </span>
                        <Input
                          value={o}
                          required
                          placeholder={`Option ${LETTERS[i]}`}
                          onChange={(e) => setOpt(i, e.target.value)}
                          className="flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                        />
                        {options.length > 2 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Remove option ${LETTERS[i]}`}
                            onClick={() => removeOpt(i)}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <X className="size-4" aria-hidden />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  {options.length < 6 && (
                    <Button type="button" variant="outline" size="sm" onClick={addOpt}>
                      <Plus className="size-4" aria-hidden /> Add option
                    </Button>
                  )}
                  <p className="text-xs text-muted-foreground">2–6 options.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">
                    Tags <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((t) => (
                        <span key={t} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                          {t}
                          <button
                            type="button"
                            onClick={() => removeTag(t)}
                            aria-label={`Remove tag ${t}`}
                            className="focus-ring rounded-full text-muted-foreground hover:text-destructive"
                          >
                            <X className="size-3" aria-hidden />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                  <Input
                    id="tags"
                    value={tagDraft}
                    placeholder="Add a tag, press Enter"
                    onChange={(e) => {
                      const v = e.target.value
                      if (v.endsWith(',')) addTag(v)
                      else setTagDraft(v)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); addTag(tagDraft) }
                    }}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="size-4" aria-hidden />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button type="submit" disabled={saving} className="active:scale-[0.98] motion-reduce:active:scale-100">
                    {saving && <Loader2 className="size-4 animate-spin" aria-hidden />}
                    {saving ? 'Saving…' : editingId ? 'Save changes' : 'Add question'}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="ghost" onClick={reset}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        {/* LIST */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold">Your questions</h2>
            <Badge variant="secondary" className="font-mono tabular-nums">{questions.length}</Badge>
            {questions.length > 0 && (
              <div className="relative ml-auto w-full sm:w-60">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search questions or tags"
                  aria-label="Search questions"
                  className="pl-8"
                />
              </div>
            )}
          </div>

          {questions.length === 0 ? (
            <EmptyState
              icon={FileQuestion}
              title="No questions yet"
              description="Create your first multiple-choice question using the editor."
              action={
                <Button variant="outline" size="sm" onClick={() => stemRef.current?.focus()}>
                  Start writing
                </Button>
              }
            />
          ) : filtered.length === 0 ? (
            <p className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
              No questions match “{query}”.
            </p>
          ) : (
            <AnimatedList>
              {filtered.map((q) => (
                <AnimatedListItem key={q.clientId} id={q.clientId}>
                  <QuestionCard
                    q={q}
                    isEditing={editingId === q.id}
                    isPending={isTemp(q.id) || (update.isPending && update.variables?.id === q.id)}
                    onEdit={startEdit}
                    onDelete={(id) => del.mutate(id)}
                  />
                </AnimatedListItem>
              ))}
            </AnimatedList>
          )}
        </section>
      </div>
    </div>
  )
}

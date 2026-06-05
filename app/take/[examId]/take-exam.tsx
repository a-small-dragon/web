'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FadeInUp, NumberTicker } from '@/components/motion'
import { cn } from '@/lib/utils'

type Option = { id: string; text: string }
type TakingQuestion = { id: string; stem: string; options: Option[]; points: number }
type ResultItem = {
  questionId: string
  stem: string
  options: Option[]
  selectedOptionId: string
  correctOptionId: string
  correct: boolean
  points: number
}
type Result = {
  attemptId: string
  examTitle: string
  score: number
  maxScore: number
  passMark: number
  passed: boolean
  items: ResultItem[]
}

export default function TakeExam({ examId }: { examId: string }) {
  const [loading, setLoading] = useState(true)
  const [exam, setExam] = useState<{ title: string; durationMin: number; passMark: number } | null>(null)
  const [attemptId, setAttemptId] = useState('')
  const [questions, setQuestions] = useState<TakingQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const submit = useCallback(async () => {
    if (submitting || result) return
    setSubmitting(true)
    const body = {
      answers: Object.entries(answers).map(([questionId, selectedOptionId]) => ({ questionId, selectedOptionId })),
    }
    const res = await fetch(`/api/attempts/${attemptId}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setSubmitting(false)
    if (res.ok) setResult(await res.json())
    else setError('Could not submit the exam')
  }, [answers, attemptId, submitting, result])

  // start (idempotent) on mount
  useEffect(() => {
    let alive = true
    ;(async () => {
      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examId }),
      })
      if (!alive) return
      if (!res.ok) {
        setError('Could not start this exam')
        setLoading(false)
        return
      }
      const d = await res.json()
      setExam(d.exam)
      setAttemptId(d.attempt.id)
      setQuestions(d.questions ?? [])
      if (d.attempt.status === 'submitted') {
        const r = await fetch(`/api/attempts/${d.attempt.id}`)
        if (alive && r.ok) setResult(await r.json())
      } else {
        setSecondsLeft(d.exam.durationMin * 60)
      }
      setLoading(false)
    })()
    return () => {
      alive = false
    }
  }, [examId])

  // countdown → auto-submit at 0
  useEffect(() => {
    if (secondsLeft === null || result) return
    if (secondsLeft <= 0) {
      void submit()
      return
    }
    const t = setTimeout(() => setSecondsLeft((s) => (s === null ? null : s - 1)), 1000)
    return () => clearTimeout(t)
  }, [secondsLeft, result, submit])

  if (loading) {
    // Skeleton matching the taking layout (header bar + question cards) — no blank flash.
    return (
      <div className="mx-auto max-w-2xl px-4 py-8" aria-busy="true" aria-label="Loading exam">
        <div className="mb-4 h-4 w-24 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="mb-6 rounded-xl bg-card p-4 shadow-e2 ring-1 ring-border">
          <div className="h-5 w-40 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="mt-2 h-3 w-24 animate-pulse rounded bg-muted motion-reduce:animate-none" />
          <div className="mt-3 h-1.5 w-full animate-pulse rounded-full bg-muted motion-reduce:animate-none" />
        </div>
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl bg-card p-4 ring-1 ring-border">
              <div className="h-4 w-3/4 animate-pulse rounded bg-muted motion-reduce:animate-none" />
              <div className="mt-3 space-y-2">
                <div className="h-9 w-full animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
                <div className="h-9 w-full animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  if (error && !result) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <p className="text-destructive">{error}</p>
        <Link href="/take" className="text-primary hover:underline">Back to exams</Link>
      </div>
    )
  }

  if (result) {
    const pct = result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0
    return (
      <FadeInUp className="mx-auto max-w-2xl px-4 py-10">
        <Link href="/take" className="focus-ring mb-4 inline-flex items-center gap-1 rounded text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> All exams
        </Link>
        <Card className={result.passed ? 'ring-2 ring-success/40' : 'ring-2 ring-warning/40'}>
          <CardHeader className="items-center text-center">
            <Badge variant={result.passed ? 'success' : 'warning'} className="text-sm">
              {result.passed ? 'Passed' : 'Not yet — keep going'}
            </Badge>
            <CardTitle className="mt-2 font-mono text-3xl font-semibold tabular-nums tracking-tight">
              <NumberTicker value={result.score} />/{result.maxScore}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {result.examTitle} · <span className="font-mono tabular-nums">{pct}%</span> (pass{' '}
              <span className="font-mono tabular-nums">{result.passMark}%</span>)
            </p>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.items.map((it) => (
              <div key={it.questionId} className="rounded-md p-3 ring-1 ring-border/70">
                <p className="flex items-start gap-2 text-sm font-medium">
                  {it.correct ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success-text" aria-hidden />
                  ) : (
                    <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
                  )}
                  {it.stem}
                </p>
                <ul className="mt-2 space-y-1 pl-6 text-sm">
                  {it.options.map((o) => {
                    const isCorrect = o.id === it.correctOptionId
                    const isSel = o.id === it.selectedOptionId
                    return (
                      <li
                        key={o.id}
                        className={cn(
                          isCorrect && 'font-medium text-success-text',
                          !isCorrect && isSel && 'text-destructive',
                          !isCorrect && !isSel && 'text-muted-foreground',
                        )}
                      >
                        {o.text}
                        {isCorrect ? ' ✓' : isSel ? ' (your answer)' : ''}
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      </FadeInUp>
    )
  }

  // taking
  const answered = Object.keys(answers).length
  const unanswered = questions.length - answered
  const pct = questions.length ? Math.round((answered / questions.length) * 100) : 0
  const mmss =
    secondsLeft !== null
      ? `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`
      : '--:--'
  // Timer escalates neutral → amber (≤2:00) → red (≤0:30), always with a text label, never color alone.
  const low30 = secondsLeft !== null && secondsLeft <= 30
  const low120 = secondsLeft !== null && secondsLeft <= 120 && !low30
  const timerTone = low30 ? 'text-destructive' : low120 ? 'text-warning-text' : 'text-foreground'
  const timerNote = low30 ? '30 seconds left' : low120 ? '2 minutes left' : ''

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/take" className="focus-ring mb-4 inline-flex items-center gap-1 rounded text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All exams
      </Link>

      <div className="sticky top-4 z-10 mb-6 overflow-hidden rounded-xl bg-card shadow-e2 ring-1 ring-border">
        <div className="flex items-center gap-3 p-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{exam?.title}</p>
            <p className="text-sm text-muted-foreground">
              <span className="font-mono tabular-nums">{answered}</span>/{questions.length} answered
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className={cn('inline-flex items-center gap-1.5 font-mono text-lg font-medium tabular-nums', timerTone)}>
              <Clock className="size-4" aria-hidden /> {mmss}
            </span>
            {timerNote && <span className={cn('text-xs font-medium', timerTone)}>{timerNote}</span>}
          </div>
        </div>
        <div
          className="h-1.5 w-full bg-muted"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Answered progress"
        >
          <div className="h-full bg-primary transition-[width] duration-300 ease-out motion-reduce:transition-none" style={{ width: `${pct}%` }} />
        </div>
        {/* announce only at thresholds (the per-second digits stay aria-hidden via this separate region) */}
        <p className="sr-only" aria-live={low30 ? 'assertive' : 'polite'}>{timerNote}</p>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <Card key={q.id}>
            <CardContent className="p-4">
              <p className="mb-3 font-medium">
                <span className="mr-2 font-mono tabular-nums text-muted-foreground">{i + 1}.</span>
                {q.stem}
              </p>
              <div role="radiogroup" aria-label={q.stem} className="space-y-2">
                {q.options.map((o) => (
                  <label
                    key={o.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 ring-1 ring-border/70 transition-[transform,background-color,box-shadow] duration-150 active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100 hover:bg-accent/60 has-[:checked]:bg-accent has-[:checked]:shadow-e1 has-[:checked]:ring-primary/40"
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === o.id}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                      className="size-4 accent-primary"
                    />
                    <span className="text-sm">{o.text}</span>
                  </label>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={() => setConfirmOpen(true)} disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />}
          {submitting ? 'Submitting…' : 'Review & submit'}
        </Button>
        <span className="text-sm text-muted-foreground">
          <span className="font-mono tabular-nums">{answered}</span>/{questions.length} answered
        </span>
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-confirm-title"
        >
          <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-e3 ring-1 ring-border">
            <h2 id="submit-confirm-title" className="text-lg font-semibold">Submit your exam?</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              You’ve answered <span className="font-mono tabular-nums">{answered}</span> of{' '}
              <span className="font-mono tabular-nums">{questions.length}</span>. You can’t change your answers after submitting.
            </p>
            {unanswered > 0 && (
              <p className="mt-2 flex items-start gap-1.5 text-sm text-warning-text">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {unanswered} {unanswered === 1 ? 'question is' : 'questions are'} still blank — you can go back and answer them.
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)} autoFocus>
                Keep working
              </Button>
              <Button onClick={() => { setConfirmOpen(false); void submit() }} disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />}
                Submit exam
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

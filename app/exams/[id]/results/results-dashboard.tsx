'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, RotateCw, Users, Target, Trophy, BarChart3, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Stagger, StaggerItem, FadeInUp, NumberTicker } from '@/components/motion'
import { cn } from '@/lib/utils'

type AttemptRow = {
  studentName: string
  studentEmail: string
  status: string
  score: number | null
  maxScore: number | null
  scorePct: number | null
  passed: boolean | null
  submittedAt: string | null
}
type QuestionStat = {
  questionId: string
  stem: string
  position: number
  answered: number
  correct: number
  pctCorrect: number
}
type Summary = {
  totalAttempts: number
  submitted: number
  inProgress: number
  avgScorePct: number | null
  passRatePct: number | null
  highScorePct: number | null
  lowScorePct: number | null
}
type ResultsData = {
  exam: { id: string; title: string; passMark: number; durationMin: number; status: string; questionCount: number; totalPoints: number }
  cache: string
  summary: Summary
  attempts: AttemptRow[]
  questions: QuestionStat[]
}

export default function ResultsDashboard({ examId, initial }: { examId: string; initial: ResultsData }) {
  const [data, setData] = useState<ResultsData>(initial)
  const [refreshing, setRefreshing] = useState(false)
  const [live, setLive] = useState(false)

  const refresh = useCallback(async () => {
    setRefreshing(true)
    const res = await fetch(`/api/exams/${examId}/results`)
    if (res.ok) setData(await res.json())
    setRefreshing(false)
  }, [examId])

  // Live updates: subscribe to the SSE stream; on each new submission, toast + refresh.
  useEffect(() => {
    const es = new EventSource(`/api/exams/${examId}/results/stream`)
    es.onopen = () => setLive(true)
    es.onerror = () => setLive(false) // EventSource auto-reconnects
    es.addEventListener('submitted', (e) => {
      try {
        const d = JSON.parse((e as MessageEvent).data)
        toast.success(`New submission — ${d.student} · ${d.scorePct}%`)
      } catch {
        /* ignore malformed event */
      }
      void refresh()
    })
    return () => es.close()
  }, [examId, refresh])

  const { exam, summary, attempts, questions } = data

  // Hardest first; questions with no submissions yet sink to the bottom (no signal to rank on).
  const ranked = [...questions].sort((a, b) => {
    const aHas = a.answered > 0
    const bHas = b.answered > 0
    if (aHas !== bHas) return aHas ? -1 : 1
    return a.pctCorrect - b.pctCorrect
  })

  function downloadCsv() {
    const head = ['Student', 'Email', 'Status', 'Score', 'Max', 'Percent', 'Result', 'Submitted']
    const esc = (v: unknown) => {
      const s = String(v ?? '')
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }
    const rows = attempts.map((a) => [
      a.studentName, a.studentEmail, a.status, a.score ?? '', a.maxScore ?? '', a.scorePct ?? '',
      a.status === 'submitted' ? (a.passed ? 'Passed' : 'Not passed') : '', a.submittedAt ?? '',
    ])
    const csv = [head, ...rows].map((r) => r.map(esc).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${exam.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'exam'}-results.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:py-10">
      <Link
        href={`/exams/${examId}`}
        className="focus-ring mb-4 inline-flex items-center gap-1 rounded text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden /> Back to exam
      </Link>

      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{exam.title}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant={exam.status === 'published' ? 'success' : 'outline'}>{exam.status}</Badge>
            <span className="font-mono tabular-nums">{exam.questionCount}</span> questions · pass{' '}
            <span className="font-mono tabular-nums">{exam.passMark}%</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium',
              live ? 'bg-success-subtle text-success-text' : 'bg-muted text-muted-foreground',
            )}
            title={live ? 'Live — updates as students submit' : 'Reconnecting…'}
          >
            <span className={cn('size-1.5 rounded-full', live ? 'animate-pulse bg-success motion-reduce:animate-none' : 'bg-muted-foreground')} />
            {live ? 'Live' : 'Offline'}
          </span>
          <Badge variant="outline" className="font-mono text-xs" title="server cache state on last load">
            cache: {data.cache}
          </Badge>
          <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
            <RotateCw className={cn('size-4', refreshing && 'animate-spin motion-reduce:animate-none')} aria-hidden />
            Refresh
          </Button>
        </div>
      </header>

      {/* Summary stat cards */}
      <Stagger className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={Users} label="Submitted" value={summary.submitted} sub={`${summary.inProgress} in progress`} />
        <StatCard icon={Target} label="Avg score" value={summary.avgScorePct} suffix="%" />
        <StatCard icon={Trophy} label="Pass rate" value={summary.passRatePct} suffix="%" />
        <StatCard
          icon={BarChart3}
          label="Range"
          value={summary.highScorePct}
          suffix="%"
          sub={summary.lowScorePct != null ? `low ${summary.lowScorePct}%` : '—'}
        />
      </Stagger>

      {/* Attempts */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Attempts</h2>
          {attempts.length > 0 && (
            <Button variant="outline" size="sm" onClick={downloadCsv}>
              <Download className="size-4" aria-hidden /> Export CSV
            </Button>
          )}
        </div>
        {attempts.length === 0 ? (
          <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
            No one has taken this exam yet.
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {attempts.map((a, i) => (
                  <div key={`${a.studentEmail}-${i}`} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <div className="min-w-[10rem] flex-1">
                      <p className="font-medium">{a.studentName || a.studentEmail}</p>
                      <p className="text-xs text-muted-foreground">{a.studentEmail}</p>
                    </div>
                    {a.status === 'submitted' ? (
                      <>
                        <span className="font-mono text-sm tabular-nums text-muted-foreground">
                          {a.score}/{a.maxScore}
                        </span>
                        <span className="w-12 text-right font-mono text-sm font-medium tabular-nums">{a.scorePct}%</span>
                        <Badge variant={a.passed ? 'success' : 'warning'}>{a.passed ? 'Passed' : 'Not yet'}</Badge>
                        <span className="hidden font-mono text-xs tabular-nums text-muted-foreground sm:inline">
                          {fmtTime(a.submittedAt)}
                        </span>
                      </>
                    ) : (
                      <Badge variant="outline">in progress</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Per-question difficulty — hardest first, banded */}
      <section>
        <h2 className="mb-1 text-lg font-semibold">Question difficulty</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          % of submitters who answered each correctly — <span className="font-medium text-foreground">hardest first</span>.
        </p>
        {questions.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            This exam has no questions.
          </div>
        ) : (
          <Stagger inView className="space-y-3">
            {ranked.map((q) => {
              const b = bandOf(q.pctCorrect, q.answered)
              return (
                <StaggerItem key={q.questionId}>
                  <Card>
                    <CardContent className="p-4">
                      <div className="mb-2 flex items-start gap-2">
                        <span className="mt-0.5 shrink-0 font-mono text-sm tabular-nums text-muted-foreground">Q{q.position + 1}</span>
                        <p className="flex-1 text-sm font-medium">{q.stem}</p>
                        <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-xs font-medium', b.chip)}>{b.label}</span>
                        <span className="w-11 shrink-0 text-right font-mono text-sm font-semibold tabular-nums">
                          {q.answered > 0 ? `${q.pctCorrect}%` : '—'}
                        </span>
                      </div>
                      <DifficultyBar pct={q.answered > 0 ? q.pctCorrect : 0} barClass={b.bar} />
                      <p className="mt-1 text-right font-mono text-xs tabular-nums text-muted-foreground">
                        {q.correct}/{q.answered} correct
                      </p>
                    </CardContent>
                  </Card>
                </StaggerItem>
              )
            })}
          </Stagger>
        )}
      </section>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  sub,
}: {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  label: string
  value: number | null
  suffix?: string
  sub?: string
}) {
  return (
    <StaggerItem>
      <FadeInUp>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Icon className="size-3.5" aria-hidden /> {label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-3xl font-semibold tabular-nums tracking-tight">
              {value == null ? <span className="text-muted-foreground">—</span> : <NumberTicker value={value} />}
              {value != null && suffix ? <span className="text-xl text-muted-foreground">{suffix}</span> : null}
            </p>
            {sub ? <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p> : null}
          </CardContent>
        </Card>
      </FadeInUp>
    </StaggerItem>
  )
}

// Difficulty band: color + LABEL (never color alone). ≥80 Easy · 50–79 Medium · <50 Hard · no data.
function bandOf(pct: number, answered: number): { label: string; chip: string; bar: string } {
  if (answered === 0) return { label: 'No data', chip: 'bg-muted text-muted-foreground', bar: 'bg-muted-foreground/40' }
  if (pct >= 80) return { label: 'Easy', chip: 'bg-success-subtle text-success-text', bar: 'bg-success' }
  if (pct >= 50) return { label: 'Medium', chip: 'bg-warning-subtle text-warning-text', bar: 'bg-warning' }
  return { label: 'Hard', chip: 'bg-destructive/10 text-destructive', bar: 'bg-destructive' }
}

// Bar animates 0 → pct on mount (CSS transition); honors prefers-reduced-motion.
function DifficultyBar({ pct, barClass }: { pct: number; barClass: string }) {
  const [w, setW] = useState(0)
  useEffect(() => {
    const id = requestAnimationFrame(() => setW(pct))
    return () => cancelAnimationFrame(id)
  }, [pct])
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted" role="meter" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div
        className={cn('h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none', barClass)}
        style={{ width: `${w}%` }}
      />
    </div>
  )
}

// Deterministic (no locale) so server/client render the same string — avoids hydration mismatch.
function fmtTime(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 16).replace('T', ' ')
}

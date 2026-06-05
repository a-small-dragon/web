import Link from 'next/link'
import { GraduationCap, Clock } from 'lucide-react'
import { API_URL } from '@/lib/api'
import { getToken, requireRole } from '@/lib/auth'
import { CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Stagger, StaggerItem, InteractiveCard } from '@/components/motion'
import { AppShell } from '@/components/app/app-shell'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'

export const metadata = { title: 'Exams · QuizForge' }

type SExam = {
  id: string
  title: string
  durationMin: number
  passMark: number
  questionCount: number
  totalPoints: number
  attemptStatus: string
  score: number | null
  passed: boolean | null
  dueAt: string | null
}

async function listExams(token: string): Promise<SExam[]> {
  const res = await fetch(`${API_URL}/student/exams`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!res.ok) return []
  return (await res.json()).exams ?? []
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
function fmtDue(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split('-').map(Number)
  return `${MONTHS[m - 1]} ${d}`
}
// Informative deadline state (not enforced): once submitted, just shows the date; otherwise flags
// overdue / due-soon in amber. Computed server-side (RSC), so no hydration concern.
function dueState(iso: string | null, done: boolean): { label: string; urgent: boolean } | null {
  if (!iso) return null
  const due = new Date(iso).getTime()
  const now = Date.now()
  if (done) return { label: `Due ${fmtDue(iso)}`, urgent: false }
  if (due < now) return { label: 'Overdue', urgent: true }
  const days = Math.ceil((due - now) / 86_400_000)
  if (days <= 2) return { label: days <= 1 ? 'Due tomorrow' : 'Due soon', urgent: true }
  return { label: `Due ${fmtDue(iso)}`, urgent: false }
}

export default async function TakePage() {
  const user = await requireRole('student')
  const token = (await getToken())!
  const exams = await listExams(token)

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-3xl px-4 py-8 lg:py-10">
        <PageHeader title="Your exams" count={exams.length} description="Exams your teacher has assigned to your class." />

        {exams.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title="You’re all caught up"
            description="No exams assigned right now. Your teacher assigns exams to your class."
          />
        ) : (
          <Stagger inView className="space-y-4">
            {exams.map((e) => {
              const done = e.attemptStatus === 'submitted'
              const due = dueState(e.dueAt, done)
              return (
                <StaggerItem key={e.id}>
                  <Link href={`/take/${e.id}`} className="focus-ring block rounded-xl">
                    <InteractiveCard className="hover:shadow-e2 hover:ring-primary/30">
                      <CardContent className="flex flex-wrap items-center gap-3 p-4">
                        <div className="min-w-[12rem] flex-1">
                          <p className="font-medium">{e.title}</p>
                          <p className="text-sm text-muted-foreground">
                            <span className="font-mono tabular-nums">{e.durationMin}</span> min ·{' '}
                            <span className="font-mono tabular-nums">{e.questionCount}</span> questions · pass{' '}
                            <span className="font-mono tabular-nums">{e.passMark}%</span>
                            {due && !due.urgent ? <> · {due.label}</> : null}
                          </p>
                        </div>
                        {due?.urgent ? (
                          <Badge variant="warning" className="gap-1">
                            <Clock className="size-3.5" aria-hidden /> {due.label}
                          </Badge>
                        ) : null}
                        {done ? (
                          <Badge variant={e.passed ? 'success' : 'warning'} className="font-mono tabular-nums">
                            {e.passed ? 'Passed' : 'Not yet'} · {e.score}/{e.totalPoints}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Start →</Badge>
                        )}
                      </CardContent>
                    </InteractiveCard>
                  </Link>
                </StaggerItem>
              )
            })}
          </Stagger>
        )}
      </div>
    </AppShell>
  )
}

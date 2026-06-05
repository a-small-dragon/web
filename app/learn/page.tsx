import Link from 'next/link'
import { BookOpen, ChevronRight } from 'lucide-react'
import { API_URL } from '@/lib/api'
import { getToken, requireRole } from '@/lib/auth'
import { CardContent } from '@/components/ui/card'
import { AppShell } from '@/components/app/app-shell'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import { Stagger, StaggerItem, InteractiveCard } from '@/components/motion'

export const metadata = { title: 'Learn · QuizForge' }

type LessonSummary = { id: string; author: string; title: string; updatedAt: string }

async function listLessons(token: string): Promise<LessonSummary[]> {
  const res = await fetch(`${API_URL}/student/lessons`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!res.ok) return []
  return (await res.json()).lessons ?? []
}

export default async function LearnPage() {
  const user = await requireRole('student')
  const token = (await getToken())!
  const lessons = await listLessons(token)

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-3xl px-4 py-8 lg:py-10">
        <PageHeader title="Learn" count={lessons.length} description="Lessons your teachers have published." />
        {lessons.length === 0 ? (
          <EmptyState icon={BookOpen} title="No lessons yet" description="When a teacher publishes a lesson, it shows up here." />
        ) : (
          <Stagger inView className="space-y-4">
            {lessons.map((l) => (
              <StaggerItem key={l.id}>
                <Link href={`/learn/${l.id}`} className="focus-ring block rounded-xl">
                  <InteractiveCard className="hover:shadow-e2 hover:ring-primary/30">
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{l.title}</p>
                        <p className="text-sm text-muted-foreground">
                          by {l.author} · <span className="font-mono tabular-nums">{l.updatedAt.slice(0, 10)}</span>
                        </p>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    </CardContent>
                  </InteractiveCard>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>
    </AppShell>
  )
}

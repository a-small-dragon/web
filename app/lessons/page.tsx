import { BookOpen } from 'lucide-react'
import { API_URL } from '@/lib/api'
import { getToken, requireRole } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppShell } from '@/components/app/app-shell'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import LessonCreateForm from './lesson-create-form'
import LessonList from './lesson-list'

export const metadata = { title: 'Lessons · QuizForge' }

type LessonSummary = { id: string; title: string; status: string; updatedAt: string }

async function listLessons(token: string): Promise<LessonSummary[]> {
  const res = await fetch(`${API_URL}/lessons`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!res.ok) return []
  return (await res.json()).lessons ?? []
}

export default async function LessonsPage() {
  const user = await requireRole('teacher')
  const token = (await getToken())!
  const lessons = await listLessons(token)

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
        <PageHeader
          title="Lessons"
          count={lessons.length}
          description="Write Markdown learning content, then publish it to your students."
        />
        <div className="grid gap-6 lg:grid-cols-[minmax(320px,380px)_1fr] lg:items-start">
          <section>
            <Card className="lg:sticky lg:top-20">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">New lesson</CardTitle>
              </CardHeader>
              <CardContent>
                <LessonCreateForm />
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Your lessons</h2>
            {lessons.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No lessons yet"
                description="Create one, write it in Markdown with a live preview, then publish."
              />
            ) : (
              <LessonList lessons={lessons} />
            )}
          </section>
        </div>
      </div>
    </AppShell>
  )
}

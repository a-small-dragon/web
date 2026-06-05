import { FileText } from 'lucide-react'
import { API_URL } from '@/lib/api'
import { getToken, requireRole } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppShell } from '@/components/app/app-shell'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import ExamCreateForm from './exam-create-form'
import ExamList from './exam-list'

export const metadata = { title: 'Exams · QuizForge' }

type Exam = {
  id: string
  title: string
  durationMin: number
  passMark: number
  status: string
  questionCount: number
  totalPoints: number
  assignedClasses: number
}

async function listExams(token: string): Promise<Exam[]> {
  const res = await fetch(`${API_URL}/exams`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!res.ok) return []
  return (await res.json()).exams ?? []
}

export default async function ExamsPage() {
  const user = await requireRole('teacher')
  const token = (await getToken())!
  const exams = await listExams(token)

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
        <PageHeader
          title="Exams"
          count={exams.length}
          description="Assemble questions into timed exams, publish, then assign to a class."
        />
        <div className="grid gap-6 lg:grid-cols-[minmax(360px,420px)_1fr] lg:items-start">
          <section>
            <Card className="lg:sticky lg:top-20">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">New exam</CardTitle>
              </CardHeader>
              <CardContent>
                <ExamCreateForm />
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Your exams</h2>
            {exams.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No exams yet"
                description="Create one on the left, then assemble questions into it and publish."
              />
            ) : (
              <ExamList exams={exams} />
            )}
          </section>
        </div>
      </div>
    </AppShell>
  )
}

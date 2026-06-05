import { notFound } from 'next/navigation'
import { API_URL } from '@/lib/api'
import { getToken, requireRole } from '@/lib/auth'
import { AppShell } from '@/components/app/app-shell'
import ResultsDashboard from './results-dashboard'

export const metadata = { title: 'Results · QuizForge' }

async function getResults(token: string, id: string) {
  const res = await fetch(`${API_URL}/exams/${id}/results`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  return res.json()
}

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole('teacher')
  const token = (await getToken())!
  const { id } = await params
  const data = await getResults(token, id)
  if (!data) notFound() // 404 (owner-scoped) → not your exam
  return (
    <AppShell user={user}>
      <ResultsDashboard examId={id} initial={data} />
    </AppShell>
  )
}

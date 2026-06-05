import { API_URL } from '@/lib/api'
import { getToken, requireRole } from '@/lib/auth'
import { AppShell } from '@/components/app/app-shell'
import QuestionsManager, { type Question } from './questions-manager'

export const metadata = { title: 'Question bank · QuizForge' }

async function listQuestions(token: string): Promise<Question[]> {
  const res = await fetch(`${API_URL}/questions`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.questions ?? []
}

export default async function QuestionsPage() {
  const user = await requireRole('teacher')
  const token = (await getToken())!
  const questions = await listQuestions(token)
  return (
    <AppShell user={user}>
      <QuestionsManager initial={questions} />
    </AppShell>
  )
}

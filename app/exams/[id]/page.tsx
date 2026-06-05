import { notFound } from 'next/navigation'
import { API_URL } from '@/lib/api'
import { getToken, requireRole } from '@/lib/auth'
import { AppShell } from '@/components/app/app-shell'
import ExamBuilder from './exam-builder'

export const metadata = { title: 'Exam builder · QuizForge' }

async function getExam(token: string, id: string) {
  const res = await fetch(`${API_URL}/exams/${id}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

async function getBank(token: string) {
  const res = await fetch(`${API_URL}/questions`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!res.ok) return []
  return (await res.json()).questions ?? []
}

async function getClasses(token: string, id: string) {
  const res = await fetch(`${API_URL}/exams/${id}/classes`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!res.ok) return []
  return (await res.json()).classes ?? []
}

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole('teacher')
  const token = (await getToken())!
  const { id } = await params
  const data = await getExam(token, id)
  if (!data) notFound()
  const [bank, classes] = await Promise.all([getBank(token), getClasses(token, id)])
  return (
    <AppShell user={user}>
      <ExamBuilder exam={data.exam} examQuestions={data.questions ?? []} bank={bank} initialClasses={classes} />
    </AppShell>
  )
}

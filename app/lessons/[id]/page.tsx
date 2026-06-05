import { notFound } from 'next/navigation'
import { API_URL } from '@/lib/api'
import { getToken, requireRole } from '@/lib/auth'
import { AppShell } from '@/components/app/app-shell'
import { Comments } from '@/components/app/comments'
import LessonEditor from './lesson-editor'

export const metadata = { title: 'Edit lesson · QuizForge' }

async function getLesson(token: string, id: string) {
  const res = await fetch(`${API_URL}/lessons/${id}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

async function getClasses(token: string): Promise<{ id: string; name: string }[]> {
  const res = await fetch(`${API_URL}/classes`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!res.ok) return []
  return ((await res.json()).classes ?? []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name }))
}

export default async function LessonEditPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole('teacher')
  const token = (await getToken())!
  const { id } = await params
  const lesson = await getLesson(token, id)
  if (!lesson) notFound() // 404 (owner-scoped) → not your lesson
  const classes = await getClasses(token)
  return (
    <AppShell user={user}>
      <LessonEditor lesson={lesson} classes={classes} />
      <div className="mx-auto max-w-3xl px-4 pb-12">
        <Comments lessonId={id} userId={user.id} role={user.role} />
      </div>
    </AppShell>
  )
}

import { notFound } from 'next/navigation'
import { API_URL } from '@/lib/api'
import { getToken, requireRole } from '@/lib/auth'
import { AppShell } from '@/components/app/app-shell'
import ClassDetail from './class-detail'

export const metadata = { title: 'Class · QuizForge' }

async function getClass(token: string, id: string) {
  const res = await fetch(`${API_URL}/classes/${id}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

async function getPublishedExams(token: string) {
  const res = await fetch(`${API_URL}/exams`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!res.ok) return []
  const exams = (await res.json()).exams ?? []
  return exams.filter((e: { status: string }) => e.status === 'published')
}

export default async function ClassPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole('teacher')
  const token = (await getToken())!
  const { id } = await params
  const data = await getClass(token, id)
  if (!data) notFound() // 404 (owner-scoped) → not your class
  const published = await getPublishedExams(token)
  return (
    <AppShell user={user}>
      <ClassDetail
        classId={id}
        klass={data.class}
        initialStudents={data.students ?? []}
        initialExams={data.exams ?? []}
        publishedExams={published}
      />
    </AppShell>
  )
}

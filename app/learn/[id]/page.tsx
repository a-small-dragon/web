import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { API_URL } from '@/lib/api'
import { getToken, requireRole } from '@/lib/auth'
import { AppShell } from '@/components/app/app-shell'
import { Markdown } from '@/components/app/markdown'
import { Comments } from '@/components/app/comments'
import { Reactions } from '@/components/app/reactions'
import { FadeInUp } from '@/components/motion'
import { ReadingProgress } from './reading-progress'

export const metadata = { title: 'Lesson · QuizForge' }

async function getLesson(token: string, id: string) {
  const res = await fetch(`${API_URL}/student/lessons/${id}`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export default async function LessonReadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole('student')
  const token = (await getToken())!
  const { id } = await params
  const lesson = await getLesson(token, id)
  if (!lesson) notFound() // not published / not found

  return (
    <AppShell user={user}>
      <ReadingProgress />
      <FadeInUp className="mx-auto max-w-3xl px-4 py-8 lg:py-10">
        <Link href="/learn" className="focus-ring mb-6 inline-flex items-center gap-1 rounded text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> All lessons
        </Link>
        <h1 className="text-3xl font-semibold tracking-tight">{lesson.title}</h1>
        <p className="mb-8 mt-2 text-sm text-muted-foreground">
          by {lesson.author} · <span className="font-mono tabular-nums">{String(lesson.updatedAt).slice(0, 10)}</span>
        </p>
        <Markdown>{lesson.bodyMd || '*This lesson has no content yet.*'}</Markdown>
        <div className="mt-8 flex items-center gap-2 border-t border-border pt-6">
          <span className="text-sm text-muted-foreground">How was this lesson?</span>
          <Reactions targetType="lesson" targetId={id} />
        </div>
        <Comments lessonId={id} userId={user.id} role={user.role} />
      </FadeInUp>
    </AppShell>
  )
}

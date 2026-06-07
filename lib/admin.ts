import { API_URL } from './api'
import { getToken } from './auth'

// Server-side GET against an admin endpoint, forwarding the httpOnly JWT. Returns null on any
// failure (the page renders an empty/graceful state).
export async function adminGet<T>(path: string): Promise<T | null> {
  const token = await getToken()
  if (!token) return null
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  return (await res.json()) as T
}

export type AdminUser = { id: string; email: string; name: string; role: 'admin' | 'teacher' | 'student'; createdAt: string }
export type Overview = {
  users: number; admins: number; teachers: number; students: number
  questions: number; exams: number; publishedExams: number
  attempts: number; submittedAttempts: number; classes: number; lessons: number; comments: number
}
export type AdminExam = { id: string; title: string; teacher: string; status: string; questionCount: number; assignedClasses: number; createdAt: string }
export type AdminQuestion = { id: string; stem: string; author: string; tags: string[]; createdAt: string }
export type AdminClass = { id: string; name: string; teacher: string; studentCount: number; examCount: number; createdAt: string }
export type AdminLesson = { id: string; title: string; teacher: string; status: string; updatedAt: string }
export type AdminAttempt = { id: string; student: string; exam: string; status: string; score: number | null; maxScore: number | null; passed: boolean | null; submittedAt: string | null }

export function fmtDate(s: string | null): string {
  if (!s) return '—'
  const d = new Date(s)
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

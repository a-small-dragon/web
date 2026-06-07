// Client-safe admin types + pure helpers. NO server-only imports here (this is imported by
// 'use client' components — pulling next/headers in transitively would break the build).

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

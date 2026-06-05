import type { Question } from '@/app/questions/questions-manager'

export const qk = { all: ['questions'] as const }
export type QuestionInput = Omit<Question, 'id'>

async function json<T>(res: Response): Promise<T> {
  if (!res.ok && res.status !== 204) {
    const body = (await res.json().catch(() => ({}))) as { error?: string }
    throw new Error(body.error ?? 'request failed')
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

// Talks to the existing BFF proxies (they attach the JWT cookie server-side).
export const questionsApi = {
  create: (input: QuestionInput) =>
    fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }).then(json<Question>),

  update: (id: string, input: QuestionInput) =>
    fetch(`/api/questions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }).then(json<Question>),

  remove: (id: string) =>
    fetch(`/api/questions/${id}`, { method: 'DELETE' }).then(json<void>),
}

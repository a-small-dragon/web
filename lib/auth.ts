import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { API_URL } from '@/lib/api'

// httpOnly cookie holding the API JWT — set by the login route handler (BFF pattern),
// never readable by client JS.
export const TOKEN_COOKIE = 'qf_token'

export async function getToken(): Promise<string | undefined> {
  return (await cookies()).get(TOKEN_COOKIE)?.value
}

// cookieSecure: Secure in production by default (so the JWT never rides plaintext HTTP), but the
// local docker stack runs NODE_ENV=production over http://localhost — set COOKIE_INSECURE=true there
// so the cookie is actually returned. Prod MUST leave COOKIE_INSECURE unset. See deploy/PROD.md.
export function cookieSecure(): boolean {
  return process.env.NODE_ENV === 'production' && process.env.COOKIE_INSECURE !== 'true'
}

export type Role = 'teacher' | 'student' | 'admin'
export type User = { id: string; email: string; name: string; role: Role }

// getUser resolves the current user by asking the API to VERIFY the token (/me) — the web
// never trusts/decodes the JWT itself (it doesn't hold the signing secret). cache() dedupes
// the call within a single request render.
export const getUser = cache(async (): Promise<User | null> => {
  const token = await getToken()
  if (!token) return null
  const res = await fetch(`${API_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  })
  if (!res.ok) return null
  return (await res.json()) as User
})

// requireRole guards a server page: → /login if unauthenticated, → the caller's own area if
// the role is wrong (defense-in-depth; the API already enforces the boundary with 403).
export async function requireRole(role: Role): Promise<User> {
  const u = await getUser()
  if (!u) redirect('/login')
  if (u.role !== role) redirect(u.role === 'teacher' ? '/exams' : '/take')
  return u
}

import { API_URL } from './api'
import { getToken } from './auth'

// Server-only admin data access (uses next/headers via getToken). Client components must import
// types/helpers from './admin-types', NOT from here.
export * from './admin-types'

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

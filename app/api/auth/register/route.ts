import { NextRequest, NextResponse } from 'next/server'
import { API_URL } from '@/lib/api'
import { TOKEN_COOKIE, cookieSecure } from '@/lib/auth'

// BFF sign-up: proxy to the Go API, then store the JWT in the same httpOnly cookie as login.
export async function POST(req: NextRequest) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: await req.text(),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return NextResponse.json(data, { status: res.status })
  const out = NextResponse.json({ user: data.user })
  out.cookies.set(TOKEN_COOKIE, data.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: cookieSecure(),
    path: '/',
    maxAge: 60 * 60 * 24,
  })
  return out
}

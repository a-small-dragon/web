import { NextRequest, NextResponse } from 'next/server'
import { API_URL } from '@/lib/api'
import { TOKEN_COOKIE, cookieSecure } from '@/lib/auth'

// BFF login: proxy to the Go API, then store the JWT in an httpOnly cookie so the
// browser never holds the raw token (XSS-safe).
export async function POST(req: NextRequest) {
  const body = await req.text()
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    return NextResponse.json(data, { status: res.status })
  }
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

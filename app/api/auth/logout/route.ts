import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { API_URL } from '@/lib/api'
import { TOKEN_COOKIE, cookieSecure } from '@/lib/auth'

// Logout: revoke the token server-side (so a leaked JWT can't be reused), clear the cookie, and
// return 204. The client navigates to /login — we do NOT issue a server redirect, because building
// it from req.url would leak the server's internal host (e.g. the Docker container id) into Location.
export async function POST() {
  const t = (await cookies()).get(TOKEN_COOKIE)?.value
  if (t) {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${t}` } })
    } catch {
      // best-effort — still clear the cookie below even if the API is unreachable
    }
  }
  const out = new NextResponse(null, { status: 204 })
  out.cookies.set(TOKEN_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: cookieSecure(),
    path: '/',
    maxAge: 0,
  })
  return out
}

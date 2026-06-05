import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { API_URL } from '@/lib/api'
import { TOKEN_COOKIE } from '@/lib/auth'

async function token() {
  return (await cookies()).get(TOKEN_COOKIE)?.value
}

// GET /api/reactions?type=lesson|comment&id=<uuid> — forward the query verbatim.
export async function GET(req: NextRequest) {
  const t = await token()
  if (!t) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  const res = await fetch(`${API_URL}/reactions${req.nextUrl.search}`, {
    headers: { Authorization: `Bearer ${t}` },
    cache: 'no-store',
  })
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status })
}

// POST /api/reactions { targetType, targetId, emoji } — toggle the caller's reaction.
export async function POST(req: NextRequest) {
  const t = await token()
  if (!t) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  const res = await fetch(`${API_URL}/reactions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: await req.text(),
  })
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status })
}

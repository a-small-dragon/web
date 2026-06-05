import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { API_URL } from '@/lib/api'
import { TOKEN_COOKIE } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const t = (await cookies()).get(TOKEN_COOKIE)?.value
  if (!t) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  const res = await fetch(`${API_URL}/student/classes/join`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: await req.text(),
  })
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status })
}

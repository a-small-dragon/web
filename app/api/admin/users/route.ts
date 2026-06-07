import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { API_URL } from '@/lib/api'
import { TOKEN_COOKIE } from '@/lib/auth'

// POST /api/admin/users — create a user (any role incl. admin). API enforces RequireRole("admin").
export async function POST(req: NextRequest) {
  const t = (await cookies()).get(TOKEN_COOKIE)?.value
  if (!t) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  const body = await req.text()
  const res = await fetch(`${API_URL}/admin/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
    body,
  })
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status })
}

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { API_URL } from '@/lib/api'
import { TOKEN_COOKIE } from '@/lib/auth'

async function token() {
  return (await cookies()).get(TOKEN_COOKIE)?.value
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const t = await token()
  if (!t) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  const { id } = await ctx.params
  const res = await fetch(`${API_URL}/lessons/${id}/comments`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' })
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status })
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const t = await token()
  if (!t) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  const { id } = await ctx.params
  const res = await fetch(`${API_URL}/lessons/${id}/comments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: await req.text(),
  })
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status })
}

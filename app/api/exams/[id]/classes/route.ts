import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { API_URL } from '@/lib/api'
import { TOKEN_COOKIE } from '@/lib/auth'

async function token() {
  return (await cookies()).get(TOKEN_COOKIE)?.value
}

// GET /api/exams/[id]/classes — the teacher's classes + this exam's assignment state.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const t = await token()
  if (!t) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  const { id } = await ctx.params
  const res = await fetch(`${API_URL}/exams/${id}/classes`, {
    headers: { Authorization: `Bearer ${t}` },
    cache: 'no-store',
  })
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status })
}

// PUT /api/exams/[id]/classes — replace which classes the exam is assigned to.
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const t = await token()
  if (!t) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  const { id } = await ctx.params
  const res = await fetch(`${API_URL}/exams/${id}/classes`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' },
    body: await req.text(),
  })
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status })
}

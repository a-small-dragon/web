import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { API_URL } from '@/lib/api'
import { TOKEN_COOKIE } from '@/lib/auth'

// PATCH /api/admin/users/:id — change role.
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const t = (await cookies()).get(TOKEN_COOKIE)?.value
  if (!t) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  const { id } = await ctx.params
  const body = await req.text()
  const res = await fetch(`${API_URL}/admin/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
    body,
  })
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status })
}

// DELETE /api/admin/users/:id — remove a user.
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const t = (await cookies()).get(TOKEN_COOKIE)?.value
  if (!t) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  const { id } = await ctx.params
  const res = await fetch(`${API_URL}/admin/users/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${t}` },
  })
  if (res.status === 204) return new NextResponse(null, { status: 204 })
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status })
}

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { API_URL } from '@/lib/api'
import { TOKEN_COOKIE } from '@/lib/auth'

// Whitelisted so a client can't proxy arbitrary /admin/* paths through this dynamic route.
const ALLOWED = new Set(['exams', 'questions', 'classes', 'lessons'])

// DELETE /api/admin/:kind/:id — admin removes an entity. (users live at /api/admin/users/[id].)
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ kind: string; id: string }> }) {
  const t = (await cookies()).get(TOKEN_COOKIE)?.value
  if (!t) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  const { kind, id } = await ctx.params
  if (!ALLOWED.has(kind)) return NextResponse.json({ error: 'unknown entity' }, { status: 400 })
  const res = await fetch(`${API_URL}/admin/${kind}/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${t}` },
  })
  if (res.status === 204) return new NextResponse(null, { status: 204 })
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status })
}

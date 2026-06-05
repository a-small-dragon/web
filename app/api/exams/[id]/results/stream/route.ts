import { cookies } from 'next/headers'
import { API_URL } from '@/lib/api'
import { TOKEN_COOKIE } from '@/lib/auth'

// SSE proxy: EventSource can't send an Authorization header, so the browser hits this same-origin
// route (cookie auto-sent); we add the Bearer and pipe the upstream event stream straight through.
export const dynamic = 'force-dynamic'

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const t = (await cookies()).get(TOKEN_COOKIE)?.value
  if (!t) return new Response('unauthenticated', { status: 401 })
  const { id } = await ctx.params
  const upstream = await fetch(`${API_URL}/exams/${id}/results/stream`, {
    headers: { Authorization: `Bearer ${t}`, Accept: 'text/event-stream' },
    cache: 'no-store',
  })
  if (!upstream.ok || !upstream.body) {
    return new Response('stream unavailable', { status: upstream.status || 502 })
  }
  return new Response(upstream.body, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}

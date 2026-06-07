import { adminGet, fmtDate, type AdminAttempt } from '@/lib/admin'
import { PageHeader } from '@/components/app/page-header'
import { AdminTable, EmptyRow } from '@/components/app/admin-table'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Admin · Attempts · QuizForge' }

function pct(score: number | null, max: number | null): string {
  if (score == null || !max) return '—'
  return `${Math.round((score * 100) / max)}%`
}

export default async function AdminAttemptsPage() {
  const data = await adminGet<{ attempts: AdminAttempt[] }>('/admin/attempts')
  const attempts = data?.attempts ?? []
  return (
    <>
      <PageHeader title="Attempts" count={attempts.length} description="Recent exam attempts across all students." />
      <AdminTable headers={['Student', 'Exam', 'Status', 'Score', 'Result', 'Submitted']}>
        {attempts.map((a) => (
          <tr key={a.id} className="hover:bg-muted/30">
            <td className="px-4 py-2.5 font-medium">{a.student}</td>
            <td className="px-4 py-2.5 text-muted-foreground">{a.exam}</td>
            <td className="px-4 py-2.5"><Badge variant={a.status === 'submitted' ? 'default' : 'secondary'}>{a.status}</Badge></td>
            <td className="px-4 py-2.5 tabular-nums">{a.score != null && a.maxScore != null ? `${a.score}/${a.maxScore} · ${pct(a.score, a.maxScore)}` : '—'}</td>
            <td className="px-4 py-2.5">{a.passed == null ? '—' : <Badge variant={a.passed ? 'success' : 'destructive'}>{a.passed ? 'pass' : 'fail'}</Badge>}</td>
            <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{fmtDate(a.submittedAt)}</td>
          </tr>
        ))}
        {attempts.length === 0 && <EmptyRow cols={6} label="No attempts yet." />}
      </AdminTable>
    </>
  )
}

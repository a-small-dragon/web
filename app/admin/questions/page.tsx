import { adminGet, fmtDate, type AdminQuestion } from '@/lib/admin'
import { PageHeader } from '@/components/app/page-header'
import { AdminTable, EmptyRow } from '@/components/app/admin-table'
import { Badge } from '@/components/ui/badge'
import { DeleteEntityButton } from '@/components/app/delete-entity-button'

export const metadata = { title: 'Admin · Questions · QuizForge' }

export default async function AdminQuestionsPage() {
  const data = await adminGet<{ questions: AdminQuestion[] }>('/admin/questions')
  const questions = data?.questions ?? []
  return (
    <>
      <PageHeader title="Questions" count={questions.length} description="Every question across all authors." />
      <AdminTable headers={['Stem', 'Author', 'Tags', 'Created', '']}>
        {questions.map((q) => (
          <tr key={q.id} className="hover:bg-muted/30">
            <td className="max-w-md truncate px-4 py-2.5 font-medium">{q.stem}</td>
            <td className="px-4 py-2.5 text-muted-foreground">{q.author}</td>
            <td className="px-4 py-2.5">
              <div className="flex flex-wrap gap-1">
                {(q.tags ?? []).slice(0, 4).map((t) => <Badge key={t} variant="outline">{t}</Badge>)}
              </div>
            </td>
            <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{fmtDate(q.createdAt)}</td>
            <td className="px-4 py-2.5 text-right"><DeleteEntityButton kind="questions" id={q.id} label={q.stem.slice(0, 40)} /></td>
          </tr>
        ))}
        {questions.length === 0 && <EmptyRow cols={5} label="No questions yet." />}
      </AdminTable>
    </>
  )
}

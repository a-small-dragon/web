import { adminGet, fmtDate, type AdminExam } from '@/lib/admin'
import { PageHeader } from '@/components/app/page-header'
import { AdminTable, EmptyRow } from '@/components/app/admin-table'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Admin · Exams · QuizForge' }

export default async function AdminExamsPage() {
  const data = await adminGet<{ exams: AdminExam[] }>('/admin/exams')
  const exams = data?.exams ?? []
  return (
    <>
      <PageHeader title="Exams" count={exams.length} description="Every exam across all teachers." />
      <AdminTable headers={['Title', 'Teacher', 'Status', 'Questions', 'Assigned', 'Created']}>
        {exams.map((e) => (
          <tr key={e.id} className="hover:bg-muted/30">
            <td className="px-4 py-2.5 font-medium">{e.title}</td>
            <td className="px-4 py-2.5 text-muted-foreground">{e.teacher}</td>
            <td className="px-4 py-2.5"><Badge variant={e.status === 'published' ? 'success' : 'secondary'}>{e.status}</Badge></td>
            <td className="px-4 py-2.5 tabular-nums">{e.questionCount}</td>
            <td className="px-4 py-2.5 tabular-nums">{e.assignedClasses}</td>
            <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{fmtDate(e.createdAt)}</td>
          </tr>
        ))}
        {exams.length === 0 && <EmptyRow cols={6} label="No exams yet." />}
      </AdminTable>
    </>
  )
}

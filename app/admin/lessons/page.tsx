import { adminGet, fmtDate, type AdminLesson } from '@/lib/admin'
import { PageHeader } from '@/components/app/page-header'
import { AdminTable, EmptyRow } from '@/components/app/admin-table'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Admin · Lessons · QuizForge' }

export default async function AdminLessonsPage() {
  const data = await adminGet<{ lessons: AdminLesson[] }>('/admin/lessons')
  const lessons = data?.lessons ?? []
  return (
    <>
      <PageHeader title="Lessons" count={lessons.length} description="Every lesson across all teachers." />
      <AdminTable headers={['Title', 'Teacher', 'Status', 'Updated']}>
        {lessons.map((l) => (
          <tr key={l.id} className="hover:bg-muted/30">
            <td className="px-4 py-2.5 font-medium">{l.title}</td>
            <td className="px-4 py-2.5 text-muted-foreground">{l.teacher}</td>
            <td className="px-4 py-2.5"><Badge variant={l.status === 'published' ? 'success' : 'secondary'}>{l.status}</Badge></td>
            <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{fmtDate(l.updatedAt)}</td>
          </tr>
        ))}
        {lessons.length === 0 && <EmptyRow cols={4} label="No lessons yet." />}
      </AdminTable>
    </>
  )
}

import { adminGet, fmtDate, type AdminClass } from '@/lib/admin'
import { PageHeader } from '@/components/app/page-header'
import { AdminTable, EmptyRow } from '@/components/app/admin-table'

export const metadata = { title: 'Admin · Classes · QuizForge' }

export default async function AdminClassesPage() {
  const data = await adminGet<{ classes: AdminClass[] }>('/admin/classes')
  const classes = data?.classes ?? []
  return (
    <>
      <PageHeader title="Classes" count={classes.length} description="Every class across all teachers." />
      <AdminTable headers={['Name', 'Teacher', 'Students', 'Exams', 'Created']}>
        {classes.map((c) => (
          <tr key={c.id} className="hover:bg-muted/30">
            <td className="px-4 py-2.5 font-medium">{c.name}</td>
            <td className="px-4 py-2.5 text-muted-foreground">{c.teacher}</td>
            <td className="px-4 py-2.5 tabular-nums">{c.studentCount}</td>
            <td className="px-4 py-2.5 tabular-nums">{c.examCount}</td>
            <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{fmtDate(c.createdAt)}</td>
          </tr>
        ))}
        {classes.length === 0 && <EmptyRow cols={5} label="No classes yet." />}
      </AdminTable>
    </>
  )
}

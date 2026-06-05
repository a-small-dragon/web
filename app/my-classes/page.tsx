import { API_URL } from '@/lib/api'
import { getToken, requireRole } from '@/lib/auth'
import { AppShell } from '@/components/app/app-shell'
import { PageHeader } from '@/components/app/page-header'
import MyClasses from './my-classes-client'

export const metadata = { title: 'My classes · QuizForge' }

type Klass = { id: string; name: string; teacher: string }

async function listClasses(token: string): Promise<Klass[]> {
  const res = await fetch(`${API_URL}/student/classes`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!res.ok) return []
  return (await res.json()).classes ?? []
}

export default async function MyClassesPage() {
  const user = await requireRole('student')
  const token = (await getToken())!
  const classes = await listClasses(token)

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-3xl px-4 py-8 lg:py-10">
        <PageHeader
          title="Your classes"
          count={classes.length}
          description="Join a class with the code your teacher shares — its exams and lessons then appear for you."
        />
        <MyClasses initial={classes} />
      </div>
    </AppShell>
  )
}

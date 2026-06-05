import { Users } from 'lucide-react'
import { API_URL } from '@/lib/api'
import { getToken, requireRole } from '@/lib/auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AppShell } from '@/components/app/app-shell'
import { PageHeader } from '@/components/app/page-header'
import { EmptyState } from '@/components/app/empty-state'
import ClassCreateForm from './class-create-form'
import ClassList from './class-list'

export const metadata = { title: 'Classes · QuizForge' }

type Class = { id: string; name: string; studentCount: number; examCount: number }

async function listClasses(token: string): Promise<Class[]> {
  const res = await fetch(`${API_URL}/classes`, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!res.ok) return []
  return (await res.json()).classes ?? []
}

export default async function ClassesPage() {
  const user = await requireRole('teacher')
  const token = (await getToken())!
  const classes = await listClasses(token)

  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
        <PageHeader
          title="Classes"
          count={classes.length}
          description="Group students into a class, then assign exams — students see only what their class is assigned."
        />
        <div className="grid gap-6 lg:grid-cols-[minmax(320px,380px)_1fr] lg:items-start">
          <section>
            <Card className="lg:sticky lg:top-20">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">New class</CardTitle>
              </CardHeader>
              <CardContent>
                <ClassCreateForm />
              </CardContent>
            </Card>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Your classes</h2>
            {classes.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No classes yet"
                description="Create a class, then enroll students by email and assign exams to it."
              />
            ) : (
              <ClassList classes={classes} />
            )}
          </section>
        </div>
      </div>
    </AppShell>
  )
}

import { requireRole } from '@/lib/auth'
import { AppShell } from '@/components/app/app-shell'
import { AdminNav } from '@/components/app/admin-nav'

export const metadata = { title: 'Admin · QuizForge' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole('admin') // redirects non-admins (defense-in-depth; API also gates)
  return (
    <AppShell user={user}>
      <div className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
        <AdminNav />
        {children}
      </div>
    </AppShell>
  )
}

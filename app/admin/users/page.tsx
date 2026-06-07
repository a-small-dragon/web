import { requireRole } from '@/lib/auth'
import { adminGet, type AdminUser } from '@/lib/admin'
import UsersManager from './users-manager'

export const metadata = { title: 'Admin · Users · QuizForge' }

export default async function AdminUsersPage() {
  const me = await requireRole('admin')
  const data = await adminGet<{ users: AdminUser[] }>('/admin/users')
  return <UsersManager initialUsers={data?.users ?? []} meId={me.id} />
}

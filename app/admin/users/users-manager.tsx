'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Trash2, UserPlus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/app/page-header'
import { fmtDate, type AdminUser } from '@/lib/admin-types'

type Role = 'admin' | 'teacher' | 'student'
const ROLES: Role[] = ['admin', 'teacher', 'student']
const roleVariant = { admin: 'success', teacher: 'default', student: 'secondary' } as const

const selectCls =
  'h-8 rounded-md border border-input bg-background px-2 text-xs font-medium focus-ring disabled:opacity-50'

export default function UsersManager({ initialUsers, meId }: { initialUsers: AdminUser[]; meId: string }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  // create form
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('teacher')
  const [creating, setCreating] = useState(false)

  const users = useMemo(() => {
    const t = q.trim().toLowerCase()
    if (!t) return initialUsers
    return initialUsers.filter((u) => u.email.toLowerCase().includes(t) || u.name.toLowerCase().includes(t) || u.role.includes(t))
  }, [q, initialUsers])

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    if (creating) return
    setCreating(true)
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), name: name.trim(), password, role }),
    })
    setCreating(false)
    if (res.ok) {
      toast.success(`Created ${role}: ${email.trim()}`)
      setEmail(''); setName(''); setPassword(''); setRole('teacher')
      router.refresh()
    } else {
      toast.error('Could not create user', { description: (await res.json().catch(() => ({}))).error })
    }
  }

  async function changeRole(u: AdminUser, next: Role) {
    if (next === u.role) return
    setBusyId(u.id)
    const res = await fetch(`/api/admin/users/${u.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: next }),
    })
    setBusyId(null)
    if (res.ok) {
      toast.success(`${u.name} is now ${next}`)
      router.refresh()
    } else {
      toast.error('Could not change role', { description: (await res.json().catch(() => ({}))).error })
    }
  }

  async function removeUser(u: AdminUser) {
    if (!confirm(`Delete ${u.email}? This also removes all of their content (cascade). This cannot be undone.`)) return
    setBusyId(u.id)
    const res = await fetch(`/api/admin/users/${u.id}`, { method: 'DELETE' })
    setBusyId(null)
    if (res.ok) {
      toast.success(`Deleted ${u.email}`)
      router.refresh()
    } else {
      toast.error('Could not delete user', { description: (await res.json().catch(() => ({}))).error })
    }
  }

  return (
    <>
      <PageHeader title="Users" count={initialUsers.length} description="Create accounts (any role, incl. admin), change roles, or remove users." />

      <Card className="mb-6 p-5">
        <form onSubmit={createUser} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1.4fr_1fr_auto_auto] lg:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="u-email">Email</Label>
            <Input id="u-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="person@example.com" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-name">Name</Label>
            <Input id="u-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-pass">Password</Label>
            <Input id="u-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="≥ 8 chars" minLength={8} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="u-role">Role</Label>
            <select id="u-role" value={role} onChange={(e) => setRole(e.target.value as Role)} className={`${selectCls} h-9 w-full text-sm`}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <Button type="submit" disabled={creating}>
            {creating ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <UserPlus className="size-4" aria-hidden />}
            {creating ? 'Creating…' : 'Add'}
          </Button>
        </form>
      </Card>

      <div className="relative mb-3 max-w-xs">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name / email / role" className="pl-8" />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Name</th>
                <th className="px-4 py-2.5 font-medium">Email</th>
                <th className="px-4 py-2.5 font-medium">Role</th>
                <th className="px-4 py-2.5 font-medium">Joined</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => {
                const self = u.id === meId
                return (
                  <tr key={u.id} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-medium">{u.name}{self && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-2.5"><Badge variant={roleVariant[u.role]}>{u.role}</Badge></td>
                    <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{fmtDate(u.createdAt)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          aria-label={`Role for ${u.name}`}
                          className={selectCls}
                          value={u.role}
                          disabled={self || busyId === u.id}
                          onChange={(e) => changeRole(u, e.target.value as Role)}
                        >
                          {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Delete ${u.name}`}
                          disabled={self || busyId === u.id}
                          onClick={() => removeUser(u)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          {busyId === u.id ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {users.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No users match.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, LogIn, Users, X } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/app/empty-state'

type Klass = { id: string; name: string; teacher: string }

export default function MyClasses({ initial }: { initial: Klass[] }) {
  const [classes, setClasses] = useState<Klass[]>(initial)
  const [code, setCode] = useState('')
  const [joining, setJoining] = useState(false)

  async function join(e: React.FormEvent) {
    e.preventDefault()
    const c = code.trim().toUpperCase()
    if (!c) return
    setJoining(true)
    const res = await fetch('/api/student/classes/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: c }),
    })
    setJoining(false)
    if (res.ok) {
      const klass: Klass = await res.json()
      setClasses((prev) => (prev.some((k) => k.id === klass.id) ? prev : [...prev, klass].sort((a, b) => a.name.localeCompare(b.name))))
      setCode('')
      toast.success(`Joined ${klass.name}`)
    } else {
      toast.error('Could not join', { description: res.status === 404 ? 'No class with that code.' : undefined })
    }
  }

  async function leave(id: string, name: string) {
    const res = await fetch(`/api/student/classes/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setClasses((prev) => prev.filter((k) => k.id !== id))
      toast.success(`Left ${name}`)
    } else {
      toast.error('Could not leave class')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <form onSubmit={join} className="flex flex-wrap items-end gap-2">
            <label className="flex-1">
              <span className="mb-1.5 block text-sm font-medium">Join a class</span>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter class code, e.g. B3R4RK45"
                aria-label="Class code"
                className="font-mono tracking-wider"
                maxLength={16}
              />
            </label>
            <Button type="submit" disabled={joining || !code.trim()}>
              {joining ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <LogIn className="size-4" aria-hidden />}
              Join
            </Button>
          </form>
        </CardContent>
      </Card>

      {classes.length === 0 ? (
        <EmptyState icon={Users} title="No classes yet" description="Ask your teacher for a class code and join above — then your exams and lessons show up." />
      ) : (
        <ul className="space-y-3">
          {classes.map((k) => (
            <li key={k.id}>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{k.name}</p>
                    <p className="text-sm text-muted-foreground">by {k.teacher}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => leave(k.id, k.name)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-4" aria-hidden /> Leave
                  </Button>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

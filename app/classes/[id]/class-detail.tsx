'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ArrowLeft, Loader2, UserPlus, X, Plus, Users, FileText, Copy, Check } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

type Student = { id: string; name: string; email: string }
type ClassExam = { id: string; title: string; status: string; dueAt?: string | null }
type Klass = { id: string; name: string; studentCount: number; examCount: number; joinCode: string }

export default function ClassDetail({
  classId,
  klass,
  initialStudents,
  initialExams,
  publishedExams,
}: {
  classId: string
  klass: Klass
  initialStudents: Student[]
  initialExams: ClassExam[]
  publishedExams: ClassExam[]
}) {
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [assigned, setAssigned] = useState<ClassExam[]>(initialExams)
  const [email, setEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [copied, setCopied] = useState(false)

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(klass.joinCode)
      setCopied(true)
      toast.success('Class code copied — share it with students')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy')
    }
  }

  const available = useMemo(() => {
    const taken = new Set(assigned.map((e) => e.id))
    return publishedExams.filter((e) => !taken.has(e.id))
  }, [assigned, publishedExams])

  async function addStudent(e: React.FormEvent) {
    e.preventDefault()
    const addr = email.trim().toLowerCase()
    if (!addr) return
    setAdding(true)
    const res = await fetch(`/api/classes/${classId}/students`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: addr }),
    })
    setAdding(false)
    if (res.ok) {
      const st: Student = await res.json()
      setStudents((prev) => (prev.some((s) => s.id === st.id) ? prev : [...prev, st].sort((a, b) => a.name.localeCompare(b.name))))
      setEmail('')
      toast.success(`Enrolled ${st.name}`)
    } else {
      toast.error('Could not enroll', { description: (await res.json().catch(() => ({}))).error })
    }
  }

  async function removeStudent(id: string) {
    const res = await fetch(`/api/classes/${classId}/students/${id}`, { method: 'DELETE' })
    if (res.ok) setStudents((prev) => prev.filter((s) => s.id !== id))
    else toast.error('Could not remove student')
  }

  async function assignExam(exam: ClassExam) {
    const res = await fetch(`/api/classes/${classId}/exams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examId: exam.id }),
    })
    if (res.ok) {
      setAssigned((prev) => [{ ...exam, dueAt: null }, ...prev])
      toast.success(`Assigned “${exam.title}”`)
    } else {
      toast.error('Could not assign exam', { description: (await res.json().catch(() => ({}))).error })
    }
  }

  // Re-assigning upserts the due date (API ON CONFLICT). Empty input clears it.
  async function setDue(examId: string, date: string) {
    const res = await fetch(`/api/classes/${classId}/exams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ examId, dueAt: date || null }),
    })
    if (res.ok) {
      setAssigned((prev) => prev.map((e) => (e.id === examId ? { ...e, dueAt: date ? `${date}T23:59:59Z` : null } : e)))
      toast.success(date ? 'Due date set' : 'Due date cleared')
    } else {
      toast.error('Could not update due date')
    }
  }

  async function unassignExam(id: string) {
    const res = await fetch(`/api/classes/${classId}/exams/${id}`, { method: 'DELETE' })
    if (res.ok) setAssigned((prev) => prev.filter((e) => e.id !== id))
    else toast.error('Could not unassign exam')
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 lg:py-10">
      <Link href="/classes" className="focus-ring mb-4 inline-flex items-center gap-1 rounded text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All classes
      </Link>
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{klass.name}</h1>
        <Badge variant="secondary" className="gap-1 font-mono tabular-nums">
          <Users className="size-3.5" aria-hidden /> {students.length}
        </Badge>
        <Badge variant="secondary" className="gap-1 font-mono tabular-nums">
          <FileText className="size-3.5" aria-hidden /> {assigned.length}
        </Badge>
        <button
          onClick={copyCode}
          title="Copy the class code for students to self-enroll"
          className="focus-ring ml-auto inline-flex items-center gap-2 rounded-md border border-input bg-card px-2.5 py-1 text-sm transition-colors hover:bg-accent"
        >
          <span className="text-xs text-muted-foreground">Code</span>
          <span className="font-mono font-medium tracking-wider">{klass.joinCode}</span>
          {copied ? <Check className="size-4 text-success-text" aria-hidden /> : <Copy className="size-4 text-muted-foreground" aria-hidden />}
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* Roster */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Roster</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={addStudent} className="flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@email — must have an account"
                aria-label="Student email"
              />
              <Button type="submit" disabled={adding || !email.trim()}>
                {adding ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <UserPlus className="size-4" aria-hidden />}
                Add
              </Button>
            </form>
            {students.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No students enrolled yet.</p>
            ) : (
              <ul className="divide-y divide-border rounded-md ring-1 ring-border">
                {students.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 px-3 py-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{s.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{s.email}</p>
                    </div>
                    <button
                      onClick={() => removeStudent(s.id)}
                      aria-label={`Remove ${s.name}`}
                      className="focus-ring rounded p-1 text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Assigned exams */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Assigned exams</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {assigned.length === 0 ? (
              <p className="py-2 text-center text-sm text-muted-foreground">No exams assigned yet.</p>
            ) : (
              <ul className="divide-y divide-border rounded-md ring-1 ring-border">
                {assigned.map((e) => (
                  <li key={e.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                    <span className="min-w-[8rem] flex-1 truncate text-sm font-medium">{e.title}</span>
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      Due
                      <input
                        type="date"
                        value={e.dueAt ? e.dueAt.slice(0, 10) : ''}
                        onChange={(ev) => setDue(e.id, ev.target.value)}
                        aria-label={`Due date for ${e.title}`}
                        className="focus-ring rounded-md border border-input bg-card px-2 py-1 text-xs text-foreground"
                      />
                    </label>
                    <button
                      onClick={() => unassignExam(e.id)}
                      aria-label={`Unassign ${e.title}`}
                      className="focus-ring rounded p-1 text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Add a published exam</p>
              {available.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {publishedExams.length === 0 ? (
                    <>No published exams — <Link href="/exams" className="text-primary hover:underline">publish one</Link> first.</>
                  ) : (
                    'All your published exams are already assigned.'
                  )}
                </p>
              ) : (
                <ul className="space-y-2">
                  {available.map((e) => (
                    <li key={e.id} className="flex items-center gap-3 rounded-md px-3 py-2 ring-1 ring-border/70">
                      <span className="min-w-0 flex-1 truncate text-sm">{e.title}</span>
                      <Button variant="outline" size="sm" onClick={() => assignExam(e)}>
                        <Plus className="size-4" aria-hidden /> Assign
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

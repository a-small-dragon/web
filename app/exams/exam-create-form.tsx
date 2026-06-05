'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function ExamCreateForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState(20)
  const [pass, setPass] = useState(60)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const res = await fetch('/api/exams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, durationMin: Number(duration), passMark: Number(pass) }),
    })
    setBusy(false)
    if (res.ok) {
      setTitle('')
      setDuration(20)
      setPass(60)
      router.refresh()
    } else {
      setError((await res.json().catch(() => ({}))).error ?? 'could not create exam')
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Algebra Quiz 1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="dur">Time limit (min)</Label>
          <Input id="dur" type="number" min={1} value={duration} onChange={(e) => setDuration(Number(e.target.value))} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pass">Pass mark (%)</Label>
          <Input id="pass" type="number" min={0} max={100} value={pass} onChange={(e) => setPass(Number(e.target.value))} required />
        </div>
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" disabled={busy}>
        {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {busy ? 'Creating…' : 'Create exam'}
      </Button>
    </form>
  )
}

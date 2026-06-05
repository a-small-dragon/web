'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function ClassCreateForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    const res = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() }),
    })
    setBusy(false)
    if (res.ok) {
      toast.success('Class created')
      setName('')
      router.refresh()
    } else {
      toast.error('Could not create class', { description: (await res.json().catch(() => ({}))).error })
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="class-name">Class name</Label>
        <Input
          id="class-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Math 101 — Fall"
          maxLength={120}
        />
      </div>
      <Button type="submit" disabled={busy || !name.trim()} className="w-full">
        {busy && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />}
        {busy ? 'Creating…' : 'Create class'}
      </Button>
    </form>
  )
}

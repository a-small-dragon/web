'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LessonCreateForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setBusy(true)
    const res = await fetch('/api/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), bodyMd: '' }),
    })
    setBusy(false)
    if (res.ok) {
      const lesson = await res.json()
      toast.success('Lesson created — start writing')
      router.push(`/lessons/${lesson.id}`) // straight into the editor
    } else {
      toast.error('Could not create lesson', { description: (await res.json().catch(() => ({}))).error })
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="lesson-title">Title</Label>
        <Input
          id="lesson-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Intro to Big-O notation"
          maxLength={160}
        />
      </div>
      <Button type="submit" disabled={busy || !title.trim()} className="w-full">
        {busy && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />}
        {busy ? 'Creating…' : 'Create & write'}
      </Button>
    </form>
  )
}

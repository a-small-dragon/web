'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Kind = 'exams' | 'questions' | 'classes' | 'lessons'
const singular: Record<Kind, string> = { exams: 'exam', questions: 'question', classes: 'class', lessons: 'lesson' }

// Admin-only delete control for the monitoring tables. Confirms, calls the BFF, refreshes.
export function DeleteEntityButton({ kind, id, label }: { kind: Kind; id: string; label: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function del() {
    if (!confirm(`Delete ${singular[kind]} “${label}”? This cascades to related data and cannot be undone.`)) return
    setBusy(true)
    const res = await fetch(`/api/admin/${kind}/${id}`, { method: 'DELETE' })
    setBusy(false)
    if (res.ok) {
      toast.success(`Deleted ${singular[kind]}`)
      router.refresh()
    } else {
      toast.error('Could not delete', { description: (await res.json().catch(() => ({}))).error })
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={`Delete ${label}`}
      disabled={busy}
      onClick={del}
      className="text-muted-foreground hover:text-destructive"
    >
      {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />}
    </Button>
  )
}

'use client'

import { useState } from 'react'
import { CheckCircle2, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Question } from './questions-manager'

export function QuestionCard({
  q,
  isEditing,
  isPending,
  onEdit,
  onDelete,
}: {
  q: Question
  isEditing?: boolean
  isPending?: boolean
  onEdit: (q: Question) => void
  onDelete: (id: string) => void
}) {
  const [confirming, setConfirming] = useState(false)

  return (
    <Card
      className={cn(
        'transition-[box-shadow,border-color] duration-150 hover:shadow-e2 hover:ring-border',
        isEditing && 'ring-2 ring-primary shadow-e2',
        isPending && 'pointer-events-none opacity-70 saturate-[0.85]',
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium leading-relaxed">{q.stem}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-2">
          {q.options.map((o) => {
            const isCorrect = o.id === q.correctOptionId
            return (
              <li
                key={o.id}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2',
                  isCorrect
                    ? 'border border-success/30 bg-success-subtle text-success-text'
                    : 'border border-transparent text-foreground',
                )}
              >
                <span className="font-mono text-xs uppercase tabular-nums text-muted-foreground">{o.id}</span>
                <span className="flex-1 text-sm">{o.text}</span>
                {isCorrect && (
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <CheckCircle2 className="size-4" aria-hidden /> Correct
                  </span>
                )}
              </li>
            )
          })}
        </ul>
        {q.tags?.length ? (
          <div className="flex flex-wrap gap-1.5">
            {q.tags.map((t) => (
              <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        ) : null}
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" aria-label={`Edit question: ${q.stem}`} onClick={() => onEdit(q)}>
            <Pencil className="size-4" aria-hidden /> Edit
          </Button>
          {confirming ? (
            <>
              <Button variant="destructive" size="sm" onClick={() => onDelete(q.id)}>
                Yes, delete
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              aria-label={`Delete question: ${q.stem}`}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setConfirming(true)}
            >
              <Trash2 className="size-4" aria-hidden /> Delete
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

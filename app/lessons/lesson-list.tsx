'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Stagger, StaggerItem, InteractiveCard } from '@/components/motion'

type LessonSummary = { id: string; title: string; status: string; updatedAt: string }

export default function LessonList({ lessons }: { lessons: LessonSummary[] }) {
  return (
    <Stagger inView className="space-y-4">
      {lessons.map((l) => (
        <StaggerItem key={l.id}>
          <Link href={`/lessons/${l.id}`} className="focus-ring block rounded-xl">
            <InteractiveCard className="transition-[box-shadow] hover:shadow-e2 hover:ring-primary/30">
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <p className="min-w-[12rem] flex-1 font-medium">{l.title}</p>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">{l.updatedAt.slice(0, 10)}</span>
                <Badge variant={l.status === 'published' ? 'success' : 'outline'}>{l.status}</Badge>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </CardContent>
            </InteractiveCard>
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  )
}

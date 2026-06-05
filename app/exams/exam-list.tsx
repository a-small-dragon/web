'use client'

import Link from 'next/link'
import { ChevronRight, AlertTriangle } from 'lucide-react'
import { CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Stagger, StaggerItem, InteractiveCard } from '@/components/motion'

type Exam = {
  id: string
  title: string
  durationMin: number
  passMark: number
  status: string
  questionCount: number
  totalPoints: number
  assignedClasses: number
}

export default function ExamList({ exams }: { exams: Exam[] }) {
  return (
    <Stagger inView className="space-y-4">
      {exams.map((e) => (
        <StaggerItem key={e.id}>
          <Link href={`/exams/${e.id}`} className="focus-ring block rounded-xl">
            <InteractiveCard className="transition-[box-shadow] hover:shadow-e2 hover:ring-primary/30">
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-[12rem] flex-1">
                  <p className="font-medium">{e.title}</p>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-mono tabular-nums">{e.durationMin}</span> min · pass{' '}
                    <span className="font-mono tabular-nums">{e.passMark}%</span>
                  </p>
                </div>
                <Badge variant="secondary" className="font-mono tabular-nums">
                  {e.questionCount} Q · {e.totalPoints} pts
                </Badge>
                <Badge variant={e.status === 'published' ? 'success' : 'outline'}>{e.status}</Badge>
                {e.status === 'published' && e.assignedClasses === 0 && (
                  <Badge
                    variant="outline"
                    title="Published but not assigned to any class — students can't see it"
                    className="gap-1 border-amber-300 text-amber-700 dark:border-amber-500/40 dark:text-amber-300"
                  >
                    <AlertTriangle className="size-3" aria-hidden /> Not assigned
                  </Badge>
                )}
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </CardContent>
            </InteractiveCard>
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  )
}

'use client'

import Link from 'next/link'
import { ChevronRight, Users, FileText } from 'lucide-react'
import { CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Stagger, StaggerItem, InteractiveCard } from '@/components/motion'

type Class = { id: string; name: string; studentCount: number; examCount: number }

export default function ClassList({ classes }: { classes: Class[] }) {
  return (
    <Stagger inView className="space-y-4">
      {classes.map((c) => (
        <StaggerItem key={c.id}>
          <Link href={`/classes/${c.id}`} className="focus-ring block rounded-xl">
            <InteractiveCard className="transition-[box-shadow] hover:shadow-e2 hover:ring-primary/30">
              <CardContent className="flex flex-wrap items-center gap-3 p-4">
                <p className="min-w-[12rem] flex-1 font-medium">{c.name}</p>
                <Badge variant="secondary" className="gap-1 font-mono tabular-nums">
                  <Users className="size-3.5" aria-hidden /> {c.studentCount}
                </Badge>
                <Badge variant="secondary" className="gap-1 font-mono tabular-nums">
                  <FileText className="size-3.5" aria-hidden /> {c.examCount}
                </Badge>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
              </CardContent>
            </InteractiveCard>
          </Link>
        </StaggerItem>
      ))}
    </Stagger>
  )
}

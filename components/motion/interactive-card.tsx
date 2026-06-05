'use client'
import { m } from 'motion/react'
import { Card } from '@/components/ui/card'
import { SPRING } from './variants'
import { cn } from '@/lib/utils'

// Wraps Card in an animated container (hover-lift + press) — avoids m.create + ref-forwarding issues.
export function InteractiveCard({
  className,
  interactive = true,
  children,
  ...props
}: React.ComponentProps<typeof Card> & { interactive?: boolean }) {
  if (!interactive) {
    return (
      <Card className={className} {...props}>
        {children}
      </Card>
    )
  }
  return (
    <m.div className="cursor-pointer" whileHover={{ y: -2 }} whileTap={{ scale: 0.99 }} transition={SPRING.press}>
      <Card className={cn(className)} {...props}>
        {children}
      </Card>
    </m.div>
  )
}

'use client'
import { m } from 'motion/react'
import { SPRING } from './variants'
import { cn } from '@/lib/utils'

export function Press({
  children,
  className,
  scale = 0.97,
}: {
  children: React.ReactNode
  className?: string
  scale?: number
}) {
  return (
    <m.span className={cn('inline-flex', className)} whileTap={{ scale }} transition={SPRING.press}>
      {children}
    </m.span>
  )
}

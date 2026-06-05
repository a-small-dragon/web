'use client'
import { m } from 'motion/react'
import { fadeInUp } from './variants'

export function FadeInUp({
  children,
  className,
  delay = 0,
  as = 'div',
}: {
  children: React.ReactNode
  className?: string
  delay?: number
  as?: 'div' | 'section' | 'header'
}) {
  const Comp = m[as]
  return (
    <Comp className={className} variants={fadeInUp} initial="hidden" animate="show" transition={{ delay }}>
      {children}
    </Comp>
  )
}

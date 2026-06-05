'use client'
import { m } from 'motion/react'
import { staggerParent, staggerChild } from './variants'

// inView=true for SSR'd lists (animate on scroll-in; content stays visible). Else animate on mount.
export function Stagger({
  children,
  className,
  inView = false,
}: {
  children: React.ReactNode
  className?: string
  inView?: boolean
}) {
  const trigger = inView
    ? ({ whileInView: 'show', viewport: { once: true, margin: '-10%' } } as const)
    : ({ animate: 'show' } as const)
  return (
    <m.div className={className} variants={staggerParent} initial="hidden" {...trigger}>
      {children}
    </m.div>
  )
}

export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <m.div className={className} variants={staggerChild}>
      {children}
    </m.div>
  )
}

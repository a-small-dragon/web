'use client'
import { AnimatePresence, m } from 'motion/react'
import { listItem, SPRING } from './variants'

// popLayout pulls a removed row out of flow instantly so survivors slide up (layout FLIP).
export function AnimatedList({ children }: { children: React.ReactNode }) {
  return <AnimatePresence mode="popLayout">{children}</AnimatePresence>
}

// id MUST be a client-stable key (kept across the optimistic→server reconcile), not the server id —
// else the row exit+re-enters when a create settles.
export function AnimatedListItem({
  id,
  children,
  className,
}: {
  id: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <m.div
      key={id}
      layout
      layoutId={id}
      variants={listItem}
      initial="hidden"
      animate="show"
      exit="exit"
      transition={SPRING.layout}
      className={className}
    >
      {children}
    </m.div>
  )
}

'use client'
import { AnimatePresence, m } from 'motion/react'
import { DUR, EASE } from './variants'

// Keyed cross-fade — route transitions (app/template.tsx, paneKey=pathname) + master-detail swaps.
export function Pane({
  paneKey,
  children,
  className,
}: {
  paneKey: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <AnimatePresence mode="wait">
      <m.div
        key={paneKey}
        className={className}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0, transition: { duration: DUR.moderate, ease: EASE.out } }}
        exit={{ opacity: 0, y: -6, transition: { duration: DUR.fast, ease: EASE.in } }}
      >
        {children}
      </m.div>
    </AnimatePresence>
  )
}

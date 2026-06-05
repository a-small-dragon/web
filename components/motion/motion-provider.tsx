'use client'
import { LazyMotion, domMax, MotionConfig } from 'motion/react'

// domMax = animations + gestures + AnimatePresence + LAYOUT animations (lists need layout).
// strict  = only the tree-shaken `m.*` is allowed (forbids heavy `motion.*`).
// reducedMotion="user" = honors the OS setting (drops transform/layout, keeps opacity/color).
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domMax} strict>
      <MotionConfig reducedMotion="user" transition={{ duration: 0.18 }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}

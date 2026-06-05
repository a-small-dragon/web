// components/motion/variants.ts — the ONLY place durations/easings/variants live (see MOTION.md §2).
import type { Variants, Transition } from 'motion/react'

// durations in SECONDS (Motion's unit); ms equivalents in comments
export const DUR = {
  instant: 0.08,
  fast: 0.12,
  base: 0.18, // default
  moderate: 0.24,
  slow: 0.32,
} as const

export const EASE = {
  standard: [0.2, 0, 0, 1],
  out: [0.25, 1, 0.5, 1], // == --ease-quart
  in: [0.4, 0, 1, 1],
  emphasized: [0.3, 0, 0, 1],
} as const

export const SPRING = {
  press: { type: 'spring', stiffness: 400, damping: 30 } as Transition,
  layout: { type: 'spring', stiffness: 500, damping: 40, mass: 0.6 } as Transition,
  count: { stiffness: 120, damping: 20, mass: 0.8 } as const,
}

const RISE = 12 // --motion-shift-md

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: RISE },
  show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE.out } },
}

export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.04 } },
}
export const staggerChild: Variants = {
  hidden: { opacity: 0, y: RISE },
  show: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE.out } },
}

export const listItem: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: DUR.base, ease: EASE.out } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: DUR.fast, ease: EASE.in } },
}

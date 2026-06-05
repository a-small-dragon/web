'use client'
import { usePathname } from 'next/navigation'
import { Pane } from '@/components/motion'

// Per-route enter transition (the View-Transitions substitute). Re-mounts per navigation,
// so each page gently fades/rises in. Reduced-motion users get the snap (MotionConfig).
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return <Pane paneKey={pathname}>{children}</Pane>
}

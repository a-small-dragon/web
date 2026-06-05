import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'qf-skeleton relative overflow-hidden rounded-md bg-muted',
        'after:absolute after:inset-0 after:-translate-x-full',
        'after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent',
        'after:animate-[shimmer_1.5s_infinite]',
        className,
      )}
    />
  )
}

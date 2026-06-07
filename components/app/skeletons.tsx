import { Skeleton } from '@/components/motion/skeleton'

// Generic content placeholder shown instantly on navigation (via loading.tsx) so a tab switch
// never "freezes" on the old page while the server component + its API fetches resolve.
export function ContentSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

// Full-page skeleton for sections that render their own AppShell (teacher/student areas): a faux
// sticky header bar + content, so the placeholder matches the real chrome with minimal shift.
export function SectionSkeleton() {
  return (
    <div className="min-h-svh bg-background">
      <div className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
          <Skeleton className="size-7 rounded-md" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="ml-auto size-7 rounded-md" />
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-8 lg:py-10">
        <ContentSkeleton />
      </div>
    </div>
  )
}

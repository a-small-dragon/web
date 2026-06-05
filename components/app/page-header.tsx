import { Badge } from '@/components/ui/badge'

// Consistent page top: title (+ optional count badge + description) on the left, actions on the right.
export function PageHeader({
  title,
  count,
  description,
  actions,
}: {
  title: string
  count?: number
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {count !== undefined && (
            <Badge variant="secondary" className="font-mono tabular-nums">{count}</Badge>
          )}
        </div>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

import { Card } from '@/components/ui/card'

// Shared chrome for the admin monitoring tables. Pages provide the header labels and the <tr> rows.
export function AdminTable({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              {headers.map((h) => (
                <th key={h} className="whitespace-nowrap px-4 py-2.5 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">{children}</tbody>
        </table>
      </div>
    </Card>
  )
}

export function EmptyRow({ cols, label }: { cols: number; label: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-12 text-center text-muted-foreground">{label}</td>
    </tr>
  )
}

import { Users, ShieldCheck, GraduationCap, UserRound, HelpCircle, FileText, ClipboardCheck, BookOpen, MessageSquare, BadgeCheck } from 'lucide-react'
import { adminGet, type Overview } from '@/lib/admin'
import { PageHeader } from '@/components/app/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { NumberTicker } from '@/components/motion/number-ticker'

export const metadata = { title: 'Admin overview · QuizForge' }

type Stat = { label: string; value: number; icon: typeof Users; hint?: string }

function StatCard({ s }: { s: Stat }) {
  const Icon = s.icon
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{s.label}</span>
        <span className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="size-5" aria-hidden />
        </span>
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">
        <NumberTicker value={s.value} />
      </div>
      {s.hint && <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>}
    </Card>
  )
}

export default async function AdminOverviewPage() {
  const o = await adminGet<Overview>('/admin/overview')

  const stats: Stat[] = o
    ? [
        { label: 'Users', value: o.users, icon: Users, hint: `${o.admins} admin · ${o.teachers} teacher · ${o.students} student` },
        { label: 'Questions', value: o.questions, icon: HelpCircle },
        { label: 'Exams', value: o.exams, icon: FileText, hint: `${o.publishedExams} published` },
        { label: 'Attempts', value: o.attempts, icon: ClipboardCheck, hint: `${o.submittedAttempts} submitted` },
        { label: 'Classes', value: o.classes, icon: GraduationCap },
        { label: 'Lessons', value: o.lessons, icon: BookOpen },
        { label: 'Comments', value: o.comments, icon: MessageSquare },
      ]
    : []

  return (
    <>
      <PageHeader
        title="Overview"
        description="Live counts across the whole platform. Admin sees everything."
        actions={<Badge variant="success">admin</Badge>}
      />

      {!o ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          Couldn’t load stats — is the API reachable?
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {stats.map((s) => (
              <StatCard key={s.label} s={s} />
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <Card className="flex items-center gap-3 p-4">
              <span className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground"><ShieldCheck className="size-5" aria-hidden /></span>
              <div><div className="text-xl font-semibold"><NumberTicker value={o.admins} /></div><div className="text-xs text-muted-foreground">Admins</div></div>
            </Card>
            <Card className="flex items-center gap-3 p-4">
              <span className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground"><BadgeCheck className="size-5" aria-hidden /></span>
              <div><div className="text-xl font-semibold"><NumberTicker value={o.teachers} /></div><div className="text-xs text-muted-foreground">Teachers</div></div>
            </Card>
            <Card className="flex items-center gap-3 p-4">
              <span className="grid size-9 place-items-center rounded-lg bg-muted text-muted-foreground"><UserRound className="size-5" aria-hidden /></span>
              <div><div className="text-xl font-semibold"><NumberTicker value={o.students} /></div><div className="text-xs text-muted-foreground">Students</div></div>
            </Card>
          </div>
        </>
      )}
    </>
  )
}

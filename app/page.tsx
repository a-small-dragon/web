import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileText, GraduationCap, BarChart3 } from 'lucide-react'
import { getUser } from '@/lib/auth'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Aurora } from '@/components/app/aurora'
import { FadeInUp, Stagger, StaggerItem } from '@/components/motion'

const FEATURES = [
  { icon: FileText, title: 'Author', body: 'Build a reusable MCQ bank and assemble timed exams.' },
  { icon: GraduationCap, title: 'Assign', body: 'Group students into classes and assign with due dates.' },
  { icon: BarChart3, title: 'Auto-grade', body: 'Server-side grading + a per-question difficulty dashboard.' },
]

// Logged in → straight to your area. Logged out → an expressive landing (aurora; not the calm interior).
export default async function Home() {
  const user = await getUser()
  if (user) redirect(user.role === 'student' ? '/take' : '/exams')

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-4 py-16 text-center">
      <Aurora />

      <FadeInUp className="flex flex-col items-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-b from-primary to-[oklch(0.46_0.24_277)] text-2xl font-semibold text-primary-foreground shadow-e3 ring-1 ring-primary/20">
          Q
        </span>
        <h1 className="mt-6 text-balance text-5xl font-semibold tracking-tight sm:text-6xl">QuizForge</h1>
        <p className="mt-4 max-w-xl text-balance text-lg text-muted-foreground">
          Author a question bank, assemble timed exams, manage classes — and let students take them for
          instant, server-graded results.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/login" className={cn(buttonVariants({ size: 'lg' }), 'shadow-e2')}>
            Get started
          </Link>
          <Link href="/login" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}>
            I have an account
          </Link>
        </div>
      </FadeInUp>

      <Stagger className="mt-16 grid w-full max-w-3xl gap-4 text-left sm:grid-cols-3">
        {FEATURES.map((f) => (
          <StaggerItem key={f.title}>
            <Card className="h-full transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-e2 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
              <CardContent className="p-5">
                <span className="grid size-9 place-items-center rounded-lg bg-accent text-primary">
                  <f.icon className="size-5" aria-hidden />
                </span>
                <p className="mt-3 font-medium">{f.title}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>
    </main>
  )
}

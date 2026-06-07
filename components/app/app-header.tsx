'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { m } from 'motion/react'
import { LogOut, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SPRING } from '@/components/motion'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from './theme-toggle'

type Role = 'teacher' | 'student' | 'admin'

const NAV: Record<Role, { href: string; label: string }[]> = {
  teacher: [
    { href: '/questions', label: 'Questions' },
    { href: '/exams', label: 'Exams' },
    { href: '/classes', label: 'Classes' },
    { href: '/lessons', label: 'Lessons' },
  ],
  student: [
    { href: '/take', label: 'Exams' },
    { href: '/learn', label: 'Learn' },
    { href: '/my-classes', label: 'Classes' },
  ],
  admin: [{ href: '/admin', label: 'Admin Console' }],
}

export function AppHeader({ user }: { user: { name: string; role: Role } }) {
  const pathname = usePathname()
  const router = useRouter()
  const nav = NAV[user.role] ?? []
  const [loggingOut, setLoggingOut] = useState(false)

  async function logout() {
    if (loggingOut) return
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore — navigate to /login regardless; the cookie clear is best-effort server-side
    }
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4">
        <Link href="/" className="focus-ring flex shrink-0 items-center gap-2 rounded">
          <span className="grid size-7 place-items-center rounded-md bg-gradient-to-b from-primary to-[oklch(0.46_0.24_277)] text-sm font-semibold text-primary-foreground ring-1 ring-primary/20">
            Q
          </span>
          <span className="hidden text-sm font-semibold tracking-tight sm:inline">QuizForge</span>
        </Link>

        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto" aria-label="Primary">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'focus-ring relative shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {item.label}
                {active && (
                  <m.span
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={SPRING.layout}
                    className="absolute inset-x-2 -bottom-px h-0.5 origin-left rounded-full bg-primary motion-reduce:transition-none"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <span className="hidden max-w-[10rem] truncate text-sm text-muted-foreground sm:inline">{user.name}</span>
          <Badge variant="secondary" className="font-mono text-xs">{user.role}</Badge>
          <button
            type="button"
            onClick={logout}
            disabled={loggingOut}
            aria-label="Log out"
            className="focus-ring inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-60"
          >
            {loggingOut ? (
              <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
            ) : (
              <LogOut className="size-4" aria-hidden />
            )}
            <span className="hidden sm:inline">{loggingOut ? 'Logging out…' : 'Logout'}</span>
          </button>
        </div>
      </div>
    </header>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { m } from 'motion/react'
import { LayoutDashboard, Users, FileText, HelpCircle, GraduationCap, BookOpen, ClipboardCheck, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SPRING } from '@/components/motion'

type Tab = { href: string; label: string; icon: LucideIcon; exact?: boolean }

const TABS: Tab[] = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/exams', label: 'Exams', icon: FileText },
  { href: '/admin/questions', label: 'Questions', icon: HelpCircle },
  { href: '/admin/classes', label: 'Classes', icon: GraduationCap },
  { href: '/admin/lessons', label: 'Lessons', icon: BookOpen },
  { href: '/admin/attempts', label: 'Attempts', icon: ClipboardCheck },
]

export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav className="mb-6 flex items-center gap-1 overflow-x-auto border-b border-border pb-px" aria-label="Admin sections">
      {TABS.map((t) => {
        const active = t.exact ? pathname === t.href : pathname === t.href || pathname.startsWith(t.href + '/')
        const Icon = t.icon
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'focus-ring relative flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active ? 'text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            <Icon className="size-4" aria-hidden />
            {t.label}
            {active && (
              <m.span
                layoutId="admin-tab"
                transition={SPRING.layout}
                className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-primary"
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}

import { AppHeader } from './app-header'

type Role = 'teacher' | 'student' | 'admin'

// The authenticated chrome: a sticky top app bar above the page. Pages keep their own content
// container (width varies by page per DESIGN §4). Login + the immersive exam screen omit this.
export function AppShell({
  user,
  children,
}: {
  user: { name: string; role: Role }
  children: React.ReactNode
}) {
  return (
    <div className="min-h-svh bg-background">
      <AppHeader user={user} />
      <main>{children}</main>
    </div>
  )
}

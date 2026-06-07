'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FadeInUp } from '@/components/motion'
import { Aurora } from '@/components/app/aurora'
import { cn, homeFor } from '@/lib/utils'

type Mode = 'login' | 'signup'
type Role = 'teacher' | 'student'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('teacher')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const signup = mode === 'signup'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const res = await fetch(signup ? '/api/auth/register' : '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signup ? { name, email, password, role } : { email, password }),
    })
    if (res.ok) {
      const data = await res.json().catch(() => ({}))
      // Land each role on its own home; the API enforces the boundary regardless.
      router.push(homeFor(data.user?.role ?? 'teacher'))
      router.refresh()
      return
    }
    setBusy(false)
    const d = await res.json().catch(() => ({}))
    setError(
      signup
        ? d.error ?? 'Could not create your account.'
        : 'We couldn’t sign you in. Check your email and password.',
    )
  }

  function switchMode(m: Mode) {
    setMode(m)
    setError('')
  }

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden px-4 py-12">
      <Aurora />
      <FadeInUp className="w-full max-w-sm">
        <Card className="w-full shadow-e3">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-2 grid size-10 place-items-center rounded-md bg-gradient-to-b from-primary to-[oklch(0.46_0.24_277)] font-semibold text-primary-foreground ring-1 ring-primary/20 shadow-e1">
              Q
            </div>
            <CardTitle className="text-2xl font-semibold tracking-tight">
              {signup ? 'Create your account' : 'Log in to QuizForge'}
            </CardTitle>
            <CardDescription>Author exams, manage classes, auto-grade.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="tablist" aria-label="Auth mode">
              {(['login', 'signup'] as Mode[]).map((m) => (
                <button
                  key={m}
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => switchMode(m)}
                  className={cn(
                    'focus-ring rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                    mode === m ? 'bg-card text-foreground shadow-e1' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {m === 'login' ? 'Log in' : 'Sign up'}
                </button>
              ))}
            </div>

            <form onSubmit={onSubmit} className="space-y-5" noValidate>
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="size-4" aria-hidden />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {signup && (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={show ? 'text' : 'password'}
                    autoComplete={signup ? 'new-password' : 'current-password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? 'Hide password' : 'Show password'}
                    className="focus-ring absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-md text-muted-foreground hover:text-foreground"
                  >
                    {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                  </button>
                </div>
                {signup && <p className="text-xs text-muted-foreground">At least 8 characters.</p>}
              </div>

              {signup && (
                <div className="space-y-2">
                  <Label>I am a…</Label>
                  <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Account type">
                    {(['teacher', 'student'] as Role[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        role="radio"
                        aria-checked={role === r}
                        onClick={() => setRole(r)}
                        className={cn(
                          'focus-ring rounded-md border px-3 py-2 text-sm font-medium capitalize transition-colors',
                          role === r
                            ? 'border-primary bg-accent text-foreground ring-1 ring-primary/30'
                            : 'border-input text-muted-foreground hover:bg-accent hover:text-foreground',
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full active:scale-[0.98] motion-reduce:active:scale-100" disabled={busy}>
                {busy && <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />}
                {busy ? (signup ? 'Creating…' : 'Signing in…') : signup ? 'Create account' : 'Log in'}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {signup ? 'Already have an account? ' : 'New to QuizForge? '}
              <button
                type="button"
                onClick={() => switchMode(signup ? 'login' : 'signup')}
                className="focus-ring rounded font-medium text-primary hover:underline"
              >
                {signup ? 'Log in' : 'Create one'}
              </button>
            </p>
          </CardContent>
        </Card>
      </FadeInUp>
    </main>
  )
}

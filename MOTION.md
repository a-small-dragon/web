# QuizForge — MOTION.md

> The reusable **motion + visual-polish framework** for QuizForge. Sits alongside `DESIGN.md`:
> `DESIGN.md` owns the **static** language (color, type, radius, spacing); this file owns **motion**
> (how things enter/exit/respond) and the **elevation layer** (shadows/rings/focus) that makes the
> static language read as premium. **Every new feature follows this file.** No bespoke animation,
> no per-component magic numbers — compose the shared primitives in `components/motion/*`.
>
> **Verified stack (real repo, `web/`):** `next@15.1.6` · `react@19.0.0` · `tailwindcss@4.1.11` (v4,
> `@theme` in `globals.css`, **no `tailwind.config.js`**) · `class-variance-authority@0.7.1` ·
> `sonner@1.7.1` · `lucide-react@0.469.0`. `globals.css` already defines `--ease-quart:
> cubic-bezier(0.25,1,0.5,1)`, a `prefers-reduced-motion` block, OKLCH tokens, and `--radius:0.625rem`
> (10px). This framework **extends** those — it does not replace them.

---

## 0. Decisions (the resolved calls)

Two disagreements existed across the research; here are the binding calls.

1. **Library: `motion` (the renamed `framer-motion`), pinned `motion@^12.23.0`, imported from `motion/react`.**
   Not pure CSS/Tailwind (can't animate elements *leaving* the DOM or do FLIP reflow on add/remove —
   exactly what `/questions` optimistic CRUD needs), not `react-spring`. One dependency covers
   `AnimatePresence` exit, `layout` (FLIP), springs, and a **global reduced-motion kill-switch**.
   Tailwind still handles the trivial 5% (hover/focus/press color changes) with zero JS.

2. **Bundle: `LazyMotion` + the `m` component + `features={domMax}` + `strict`.**
   `domAnimation` (≈15 kb) lacks `layout` animations; our `/questions` and `/exams/[id]` lists *require*
   `layout` for add/remove/reorder, so we load **`domMax` (≈25 kb, one async chunk)**. Initial render is
   still **~4.6 kb** (the `m` baseline); `domMax` loads when the first `m.*` mounts. `strict` makes the
   heavy `motion.*` import **throw in dev**, forcing everyone onto the tree-shaken `m.*`. This is the
   single most important call for a solo dev: feature code inherits a tiny, a11y-correct motion layer
   for free.

3. **View Transitions API: NOT yet.** In Next 15.1.6 it's `experimental.viewTransition`; React's
   `<ViewTransition>` is Canary-only and explicitly "not recommended for production," and Safari
   behavior diverges. Use **`AnimatePresence` keyed on `pathname`** (a `template.tsx` wrapper) for route
   transitions today. Revisit on Next 16 / React 19.2 stable.

4. **Route transitions: `AnimatePresence` in `app/template.tsx`**, cross-fade + small `y` (see §4.5 `Pane`).

5. **Toasts: keep `sonner@1.7.1`.** Already animates well; only align its perceived timing to our scale.

Install:
```bash
cd /home/clay/code/edu-platform/web && npm i motion@^12.23.0
```

---

## 1. Motion principles

The 6 rules every feature inherits. If a change can't be justified by one of these, don't animate it.

1. **Purposeful, never decorative.** Motion must answer one question: *where did this come from, where
   did it go, or what just succeeded?* QuizForge is an authoring tool — `DESIGN.md`'s "calm by default"
   governs. No ambient/looping/parallax motion.
2. **Fast & snappy.** Default enter = **180 ms**; interactive feedback (hover/press) **≤120 ms**. The app
   must feel *responsive*, never like you're *waiting on an animation*. Anything **>320 ms is a bug**.
3. **Enter ≠ exit.** Enters **decelerate** (`ease-out`, full duration) so arrivals feel gentle. Exits
   **accelerate** (`ease-in`, ~0.66× duration) so the UI gets out of the way. Never reuse one
   curve/duration for both.
4. **Respect reduced motion — globally, once.** The app is wrapped in `<MotionConfig reducedMotion="user">`,
   which auto-disables transform/layout animation and keeps opacity/color for users who asked. Plus the
   existing CSS `prefers-reduced-motion` backstop. No per-component checks (rare escape hatch in §6).
5. **Transform & opacity only.** Animate `transform` (`x`/`y`/`scale`) and `opacity` — compositor-driven,
   60 fps, no layout/paint. **Never** animate `width/height/top/left/margin/padding`; delegate size/reflow
   to the Motion `layout` prop (FLIP → runs as `transform`). Never animate `box-shadow` blur/color in a
   loop (animate an overlaid layer's opacity instead).
6. **One motion language.** All timing/easing/distance come from the tokens in §2 / `variants.ts`. No
   inline numbers in components. Features compose `<FadeInUp>`, `<Stagger>`, `<AnimatedList>`, … — they
   don't invent animations. This is what makes it a *framework*.

### SHOULD vs SHOULD NOT animate (QuizForge-specific)

**SHOULD** — list cards entering (fade + `y:12→0`, staggered ≤8 items) · **optimistic create/edit/delete**
in `/questions` (highest-value: new item springs in, deleted fades+collapses) · master-detail editor
cross-fade on selection change · modal/sheet/dialog open-close · route cross-fade · hover/focus/press on
buttons/cards/rows · success confirmation on publish/save · question moving pool→selected in the builder ·
sonner toasts.

**SHOULD NOT** — typing into inputs/editor (zero motion on keystroke) · **validation errors** (show
*instantly*; ≤120 ms opacity fade max, never a slide — a hesitating error feels broken) · re-running enter
animations on react-query **background refetches** (gate enters to first-mount/real-add) · staggering long
lists (cap at ~8–10 visible; rest appear instantly) · anything **blocking input** (never gate a
click/submit on an animation) · layout props/scroll-jacking/parallax · rapidly-changing numbers (debounce
or skip — rapid count tween is noise).

---

## 2. Motion tokens

Three scales: **duration**, **easing**, **distance**. Defined **twice, in sync**: as CSS vars in
`globals.css` `@theme` (so Tailwind utilities + raw CSS read them) **and** as TS constants in
`lib/motion.ts` / `components/motion/variants.ts` (so Motion variants read them). One source of truth per
side; identical values.

### 2a. Duration scale (ms)

Rule: **duration scales with travel distance & element size.** Keep the everyday band tight (≤200 ms) so
the app feels *instant*. Exits run faster than enters.

| Token | ms | When |
|---|---|---|
| `instant`  | **80**  | press/active feedback, tiny icon swap, checkbox tick |
| `fast`     | **120** | hover, focus ring, color/bg change, tooltip, **exit of small items** |
| `base`     | **180** | **the default** — card enter, dropdown, inline insert/remove, optimistic settle |
| `moderate` | **240** | modal/sheet/dialog open, master-detail swap, route cross-fade |
| `slow`     | **320** | large surfaces, full-page first reveal, multi-element stagger container (hard cap) |

### 2b. Easing set (named cubic-beziers)

Each curve has exactly one job. Anchored to Material 3 emphasized/standard families + the existing `--ease-quart`.

| Token | cubic-bezier | Character | Use for |
|---|---|---|---|
| `--ease-standard`   | `cubic-bezier(0.2, 0, 0, 1)`     | symmetric in-out | A→B moves where the element stays on screen (color, layout shift, hover) |
| `--ease-out` (≈`--ease-quart`) | `cubic-bezier(0.25, 1, 0.5, 1)` | fast start, soft land | **ENTERS** — things arriving (cards, modals, list adds). Decelerate into place. |
| `--ease-in`         | `cubic-bezier(0.4, 0, 1, 1)`     | accelerate away | **EXITS** — things leaving (delete, close, dismiss). |
| `--ease-emphasized` | `cubic-bezier(0.3, 0, 0, 1)`     | confident, expressive | hero moment: publish success, "saved" confirmation pulse |
| `SPRING` (not a bezier) | `{ stiffness, damping, mass }` (see below) | natural, slight overshoot | optimistic add, reorder/layout, press, number tick |

**Default pairing:** enter = `base` + `ease-out`; exit = `fast` + `ease-in`. Springs replace duration
(Motion ignores `duration` when `type:"spring"`). Spring presets: **press** `{stiffness:400, damping:30}`,
**layout** `{stiffness:500, damping:40, mass:0.6}`, **count** `{stiffness:120, damping:20, mass:0.8}`.

### 2c. Distance / displacement scale (px)

Keep travel **short** — in productivity UI, motion is a hint, not a journey.

| Token | value | When |
|---|---|---|
| `xs` | **2 px**  | press nudge, micro-feedback |
| `sm` | **6–8 px** | hover lift, tooltip offset, list-item exit `y` |
| `md` | **12 px** | **default** card/list-item enter (`y:12→0`), dropdown drop |
| `lg` | **24 px** | modal/sheet rise, route slide |
| `scale-pop` | `0.96→1` enter, `1→0.98` press | cards/buttons; never below 0.94 (looks cheap) |

### Paste-ready CSS vars — add to the existing `@theme inline {}` in `app/globals.css`

```css
@theme inline {
  /* === MOTION: easing === */
  --ease-standard:   cubic-bezier(0.2, 0, 0, 1);
  --ease-out:        cubic-bezier(0.25, 1, 0.5, 1); /* == existing --ease-quart */
  --ease-in:         cubic-bezier(0.4, 0, 1, 1);
  --ease-emphasized: cubic-bezier(0.3, 0, 0, 1);

  /* === MOTION: duration === */
  --motion-instant:  80ms;
  --motion-fast:    120ms;
  --motion-base:    180ms;
  --motion-moderate:240ms;
  --motion-slow:    320ms;

  /* === MOTION: distance === */
  --motion-shift-xs:  2px;
  --motion-shift-sm:  8px;
  --motion-shift-md: 12px;
  --motion-shift-lg: 24px;
}
```

Tailwind v4 then exposes arbitrary-value utilities, e.g.
`duration-[var(--motion-fast)] ease-[var(--ease-standard)]`.

### Paste-ready TS constants — `components/motion/variants.ts`

```ts
// components/motion/variants.ts — the ONLY place durations/easings/variants live.
import type { Variants, Transition } from 'motion/react'

// durations in SECONDS (Motion's unit); ms equivalents in comments
export const DUR = {
  instant: 0.08, // 80ms
  fast:     0.12, // 120ms
  base:     0.18, // 180ms — default
  moderate: 0.24, // 240ms
  slow:     0.32, // 320ms (cap)
} as const

export const EASE = {
  standard:   [0.2, 0, 0, 1],
  out:        [0.25, 1, 0.5, 1], // == --ease-quart
  in:         [0.4, 0, 1, 1],
  emphasized: [0.3, 0, 0, 1],
} as const

export const SPRING = {
  press:  { type: 'spring', stiffness: 400, damping: 30 } as Transition,
  layout: { type: 'spring', stiffness: 500, damping: 40, mass: 0.6 } as Transition,
  count:  { stiffness: 120, damping: 20, mass: 0.8 } as const,
}

const RISE = 12 // --motion-shift-md

// reveal-only (no exit): page sections, single elements
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: RISE },
  show:   { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE.out } },
}

// parent that sequences children — the whole stagger trick
export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04, delayChildren: 0.04 } }, // 40ms between siblings
}
export const staggerChild: Variants = {
  hidden: { opacity: 0, y: RISE },
  show:   { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE.out } },
}

// list rows that add/remove (needs exit) — the /questions workhorse
export const listItem: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  show:   { opacity: 1, y: 0, scale: 1, transition: { duration: DUR.base, ease: EASE.out } },
  exit:   { opacity: 0, scale: 0.97, transition: { duration: DUR.fast, ease: EASE.in } },
}

export const dialogPanel: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  show:   { opacity: 1, scale: 1, y: 0, transition: { duration: DUR.moderate, ease: EASE.out } },
  exit:   { opacity: 0, scale: 0.97, y: 6, transition: { duration: DUR.fast, ease: EASE.in } },
}
export const overlay: Variants = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: DUR.moderate } },
  exit:   { opacity: 0, transition: { duration: DUR.fast } },
}
```

---

## 3. Library + setup

### 3a. Provider (mount once) — the whole bundle + a11y story

```tsx
// components/motion/motion-provider.tsx
'use client'
import { LazyMotion, domMax, MotionConfig } from 'motion/react'

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    // domMax = animations + gestures + AnimatePresence + LAYOUT animations (lists need this)
    // strict   = forbids heavy `motion.*`; only tree-shaken `m.*` allowed (throws in dev otherwise)
    <LazyMotion features={domMax} strict>
      {/* reducedMotion="user": disables transform/layout for OS reduce-motion; keeps opacity/color */}
      <MotionConfig reducedMotion="user" transition={{ duration: 0.18 }}>
        {children}
      </MotionConfig>
    </LazyMotion>
  )
}
```

### 3b. Wire it into the existing client provider (keep `layout.tsx` a server component)

`app/providers.tsx` is already `'use client'`. Nest `MotionProvider` **inside** React Query so it covers
the tree; never add `'use client'` to `layout.tsx`.

```tsx
// app/providers.tsx — extend the existing file
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { MotionProvider } from '@/components/motion'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () => new QueryClient({
      defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
    }),
  )
  return (
    <QueryClientProvider client={client}>
      <MotionProvider>{children}</MotionProvider>
    </QueryClientProvider>
  )
}
```

### 3c. `'use client'` rule (Next 15 App Router — critical)

`motion/react` is **client-only**. Every file importing `m`, `motion`, `AnimatePresence`,
`useReducedMotion`, `MotionConfig`, `LazyMotion` **must** carry `'use client'`. Server components that
fetch with the auth token (`app/exams/page.tsx`, `app/exams/[id]/page.tsx`) **stay server** — delegate
animation to a small child client component (e.g. extract the exam `<ul>` into a `'use client'`
`<ExamList>`). **Never hide server-rendered, AT/SEO-relevant content behind `initial:{opacity:0}`** without
a fallback — use `whileInView` or `initial={false}` so SSR content is visible on first paint and only
*new* client-inserted items animate (see §6).

### 3d. Reduced motion is already half-done

`globals.css` already ships the correct CSS backstop — **keep it as-is**:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

One known gap it creates: `animate-spin` on `Loader2` spinners freezes mid-rotation. Fix per-spinner with
`animate-spin motion-reduce:animate-none` so the icon sits still rather than frozen at a random angle
(same idiom as the existing `motion-reduce:active:scale-100` on buttons). Full reduced-motion strategy: §6.

---

## 4. The animated component kit

### 4a. File layout

```
web/components/motion/
  motion-provider.tsx     # LazyMotion(domMax) + MotionConfig(reducedMotion="user")
  variants.ts             # tokens + variants — the ONLY place durations/easings live (§2)
  fade-in-up.tsx          # FadeInUp — one element/section reveal
  stagger.tsx             # Stagger + StaggerItem — sequenced list/section reveal
  animated-list.tsx       # AnimatedList + AnimatedListItem — add/remove via AnimatePresence + layout
  pane.tsx                # Pane — keyed cross-fade (master-detail swap + route template.tsx)
  interactive-card.tsx    # InteractiveCard — hover-lift + press, wraps ui/card
  press.tsx               # Press — generic tap-scale wrapper (buttons, chips, icon buttons)
  dialog.tsx              # AnimatedDialog / AnimatedSheet — modal + side sheet
  skeleton.tsx            # Skeleton — shimmer placeholder (pure CSS, no JS)
  number-ticker.tsx       # NumberTicker — spring-animated count
  index.ts                # barrel — feature code imports ONLY from '@/components/motion'
```

**Conventions (enforced):** (1) all motion lives here; feature files never import `motion/react`
directly — they import from `@/components/motion`. (2) Use `m.*`, never `motion.*` (`strict` enforces).
(3) Durations/easings are tokens from `variants.ts`, never literals. (4) Opt-in is one wrapper, not
per-element edits. (5) Transform/opacity/`layout` only. (6) A11y is global (§3a), not per-component.
(7) Components are PascalCase nouns describing the *effect* (`FadeInUp`, `AnimatedList`), and list items
always take a stable `id`.

### 4b. `FadeInUp` — page / section reveal

```tsx
// components/motion/fade-in-up.tsx
'use client'
import { m } from 'motion/react'
import { fadeInUp } from './variants'

export function FadeInUp({
  children, className, delay = 0, as = 'div',
}: { children: React.ReactNode; className?: string; delay?: number; as?: 'div' | 'section' | 'header' }) {
  const Comp = m[as]
  return (
    <Comp className={className} variants={fadeInUp} initial="hidden" animate="show" transition={{ delay }}>
      {children}
    </Comp>
  )
}
```
**API:** `children`, `className?`, `delay?` (s), `as?`. **Use:** wrap the `/login` card; the `/exams` header;
any first-mount section. Do **not** wrap server-rendered above-the-fold lists (use `Stagger` with
`whileInView`, §4c).

### 4c. `Stagger` + `StaggerItem` — sequenced reveal

Parent owns `staggerChildren`; children just declare the variant — the parent drives `initial/animate`.

```tsx
// components/motion/stagger.tsx
'use client'
import { m } from 'motion/react'
import { staggerParent, staggerChild } from './variants'

export function Stagger({
  children, className, inView = false,
}: { children: React.ReactNode; className?: string; inView?: boolean }) {
  // inView=true for SSR'd lists (animate on scroll-in, content stays visible). Else animate on mount.
  const trigger = inView
    ? { whileInView: 'show', viewport: { once: true, margin: '-10%' } }
    : { animate: 'show' }
  return (
    <m.div className={className} variants={staggerParent} initial="hidden" {...trigger}>
      {children}
    </m.div>
  )
}
export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return <m.div className={className} variants={staggerChild}>{children}</m.div>
}
```
**API:** `Stagger({ children, className?, inView? })`, `StaggerItem({ children, className? })`. **Use:** the
`/exams` list (`inView`), the builder's question picker — lists that render-and-reveal but aren't doing
live optimistic CRUD. **Cap staggered children to ~8–10** (principle: no staircase lag).

### 4d. `AnimatedList` + `AnimatedListItem` — live add/remove (optimistic CRUD)

The `/questions` workhorse. `mode="popLayout"` pulls a removed row out of layout flow instantly so
survivors **slide up** (`layout` FLIP) while it fades. New rows animate from `hidden`.

```tsx
// components/motion/animated-list.tsx
'use client'
import { AnimatePresence, m } from 'motion/react'
import { listItem, SPRING } from './variants'

export function AnimatedList({ children }: { children: React.ReactNode }) {
  return <AnimatePresence mode="popLayout">{children}</AnimatePresence>
}

export function AnimatedListItem({
  id, children, className,
}: { id: string; children: React.ReactNode; className?: string }) {
  return (
    <m.div
      key={id}
      layout                       // FLIP reflow when siblings add/remove
      layoutId={id}                // stable identity across reorders
      variants={listItem}
      initial="hidden" animate="show" exit="exit"
      transition={SPRING.layout}
      className={className}
    >
      {children}
    </m.div>
  )
}
```
**API:** `AnimatedList({ children })`, `AnimatedListItem({ id, children, className? })`. **Use** —
`/questions` list and the builder's "selected" column.
**⚠ Stable-key rule (write a `/learned` note):** with optimistic create, the temp client id differs from
the server id; key on a **client-stable `clientId` kept across the reconcile swap**, not the server `id`,
or the row exit+re-enters when the mutation settles. Cap `layout` lists to ~30 items; beyond that,
virtualize or drop to a plain `transition-opacity` fade (§6).

### 4e. `Pane` — keyed cross-fade (master-detail + route transitions)

```tsx
// components/motion/pane.tsx
'use client'
import { AnimatePresence, m } from 'motion/react'
import { DUR, EASE } from './variants'

export function Pane({ paneKey, children, className }: {
  paneKey: string; children: React.ReactNode; className?: string
}) {
  return (
    <AnimatePresence mode="wait">
      <m.div
        key={paneKey}
        className={className}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0, transition: { duration: DUR.moderate, ease: EASE.out } }}
        exit={{ opacity: 0, y: -6, transition: { duration: DUR.fast, ease: EASE.in } }}
      >
        {children}
      </m.div>
    </AnimatePresence>
  )
}
```
**Use:** master-detail editor pane in `/questions` (`paneKey={selectedId}`); **route transitions** via
`app/template.tsx` (`paneKey={usePathname()}`). This is the chosen substitute for the View Transitions API.

### 4f. `InteractiveCard` — hover-lift + press (wraps `ui/card`)

```tsx
// components/motion/interactive-card.tsx
'use client'
import { m } from 'motion/react'
import { Card } from '@/components/ui/card'
import { SPRING } from './variants'
import { cn } from '@/lib/utils'

const MotionCard = m.create(Card) // v12 helper to make the cva Card a motion component (once)

export function InteractiveCard({
  className, interactive = true, ...props
}: React.ComponentProps<typeof Card> & { interactive?: boolean }) {
  if (!interactive) return <Card className={className} {...props} />
  return (
    <MotionCard
      className={cn('cursor-pointer', className)}
      whileHover={{ y: -2 }}      // 2px lift; pairs with hover:shadow-e2 ring upgrade (§5)
      whileTap={{ scale: 0.99 }}
      transition={SPRING.press}
      {...props}
    />
  )
}
```
**Use:** clickable cards only — exam cards on `/exams` (navigate), selectable question cards in the builder.
The static `QuestionCard` in the editor list stays a plain `Card` (its buttons are the targets), so
non-interactive things never feel clickable.

### 4g. `Press` — universal tap feedback

```tsx
// components/motion/press.tsx
'use client'
import { m } from 'motion/react'
import { SPRING } from './variants'
import { cn } from '@/lib/utils'

export function Press({ children, className, scale = 0.97 }: {
  children: React.ReactNode; className?: string; scale?: number
}) {
  return (
    <m.span className={cn('inline-flex', className)} whileTap={{ scale }} transition={SPRING.press}>
      {children}
    </m.span>
  )
}
```
**Use:** wrap icon buttons, "Add option", builder pick-chips at the call site. Keep the `ui/button.tsx`
primitive motion-free (it already does `active:scale-[0.98] motion-reduce:active:scale-100` in CSS, which is
fine); wrap with `<Press>` where you want spring feedback. If you want it built in later, `m.create(Button)`.

### 4h. `AnimatedDialog` / `AnimatedSheet` — modal + side sheet

Replaces the inline "Yes, delete / Cancel" toggle in `question-card.tsx`. Overlay fades; panel scales/rises.

```tsx
// components/motion/dialog.tsx
'use client'
import { AnimatePresence, m } from 'motion/react'
import { dialogPanel, overlay } from './variants'
import { cn } from '@/lib/utils'

export function AnimatedDialog({ open, onClose, children, className }: {
  open: boolean; onClose: () => void; children: React.ReactNode; className?: string
}) {
  return (
    <AnimatePresence>
      {open && (
        <m.div className="fixed inset-0 z-50 grid place-items-center p-4"
               variants={overlay} initial="hidden" animate="show" exit="exit">
          <m.div className="absolute inset-0 bg-slate-900/40" onClick={onClose} variants={overlay} />
          <m.div role="dialog" aria-modal="true"
                 className={cn('relative w-full max-w-sm rounded-xl bg-card p-6 ring-1 ring-border shadow-e3', className)}
                 variants={dialogPanel} initial="hidden" animate="show" exit="exit">
            {children}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
```
**API:** `{ open, onClose, children, className? }`. **`AnimatedSheet`** = same file, panel variant swapped
to slide (`hidden:{ x:'100%' }`) and pinned `right-0 inset-y-0` — reuse for a future side panel. Convention:
destructive confirms use the `destructive` button; the dialog itself stays calm (no shake/red flash) —
"result is never punitive."

### 4i. `Skeleton` — shimmer placeholder (pure CSS, zero JS)

```css
/* app/globals.css */
@keyframes shimmer { 100% { transform: translateX(100%); } }
@media (prefers-reduced-motion: reduce) { .qf-skeleton::after { animation: none; } }
```
```tsx
// components/motion/skeleton.tsx
import { cn } from '@/lib/utils'

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      'qf-skeleton relative overflow-hidden rounded-md bg-slate-200/70',
      'after:absolute after:inset-0 after:-translate-x-full',
      'after:bg-gradient-to-r after:from-transparent after:via-white/60 after:to-transparent',
      'after:animate-[shimmer_1.5s_infinite]',
      className,
    )} />
  )
}
```
**Use:** `/questions` and `/exams` loading states (react-query `isPending`) — render 3–4
`<Skeleton className="h-28 w-full" />` inside a `<Stagger>` so even skeletons cascade. Shimmer as CSS is
cheaper and more reduced-motion-friendly than JS.

### 4j. `NumberTicker` — spring-animated count

```tsx
// components/motion/number-ticker.tsx
'use client'
import { useEffect } from 'react'
import { useSpring, useTransform, useReducedMotion, m } from 'motion/react'
import { SPRING } from './variants'

export function NumberTicker({ value, className }: { value: number; className?: string }) {
  const reduce = useReducedMotion()
  const spring = useSpring(value, SPRING.count)
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString())
  useEffect(() => { spring.set(value) }, [value, spring])
  if (reduce) return <span className={className}>{value}</span> // snap to final value, no tween
  return <m.span className={`font-mono tabular-nums ${className ?? ''}`}>{display}</m.span>
}
```
**Use:** the question-count badge (`<NumberTicker value={questions.length} />`) and the builder summary
total — reinforces optimistic create. **Don't** use on rapidly-changing counts (debounce/skip, principle).
Uses JetBrains Mono `tabular-nums` so digits don't jitter.

### 4k. Barrel — `index.ts`

```ts
// components/motion/index.ts
export { MotionProvider } from './motion-provider'
export { FadeInUp } from './fade-in-up'
export { Stagger, StaggerItem } from './stagger'
export { AnimatedList, AnimatedListItem } from './animated-list'
export { Pane } from './pane'
export { InteractiveCard } from './interactive-card'
export { Press } from './press'
export { AnimatedDialog } from './dialog'
export { Skeleton } from './skeleton'
export { NumberTicker } from './number-ticker'
export * from './variants' // DUR / EASE / SPRING for the rare one-off
```

---

## 5. Visual elevation (static layer, on `DESIGN.md` tokens)

Replace the flat `shadow-xs`-everywhere look with a **3-tier elevation scale + hairline rings + one
polished focus-visible + an intentful selected-state language**. All transform/opacity-free (visual, not
motion), all on existing OKLCH tokens. No glassmorphism/neumorphism (reads "consumer flashy," wrong for
exam software).

### 5.0 Foundation — add once, reuse everywhere

Add inside `:root` (light) and `.dark` in `globals.css`. Shadows use the **slate foreground hue
(`0.21 0.04 256`), not pure black** — black shadows on a blue-slate UI look muddy.

```css
:root {
  --elevation-1: 0 1px 2px 0 oklch(0.21 0.04 256 / 0.04), 0 1px 1px 0 oklch(0.21 0.04 256 / 0.03);   /* resting card */
  --elevation-2: 0 1px 2px 0 oklch(0.21 0.04 256 / 0.05), 0 4px 8px -2px oklch(0.21 0.04 256 / 0.06); /* hover / sticky */
  --elevation-3: 0 2px 4px -1px oklch(0.21 0.04 256 / 0.06), 0 12px 24px -6px oklch(0.21 0.04 256 / 0.10); /* dialogs */
  --highlight-top: inset 0 1px 0 0 oklch(1 0 0 / 0.6);  /* "lit from above" top edge */
}
.dark {
  --elevation-1: 0 1px 2px 0 oklch(0 0 0 / 0.30);
  --elevation-2: 0 1px 2px 0 oklch(0 0 0 / 0.35), 0 4px 8px -2px oklch(0 0 0 / 0.40);
  --elevation-3: 0 2px 4px -1px oklch(0 0 0 / 0.40), 0 12px 24px -6px oklch(0 0 0 / 0.55);
  --highlight-top: inset 0 1px 0 0 oklch(1 0 0 / 0.06);
}
@theme inline {
  --shadow-e1: var(--elevation-1);
  --shadow-e2: var(--elevation-2);
  --shadow-e3: var(--elevation-3);
}
```

**One polished focus-visible** (the single biggest premium tell). Currently buttons use `ring-2 ring-ring
ring-offset-2` but inputs use `ring-2 ring-ring` with **no offset** — inconsistent. Standardize on a
reusable class (WCAG 2.2 SC 2.4.11/2.4.13: ≥2 px, ≥3:1, offset = surface so the ring floats):

```css
@layer base {
  .focus-ring {
    @apply outline-none focus-visible:ring-2 focus-visible:ring-ring
           focus-visible:ring-offset-2 focus-visible:ring-offset-background;
  }
}
```
Apply `.focus-ring` to **Input** (adds the missing offset), Button (standardize), bare
`<input type=radio/checkbox>`, and every `<a>`/`Link` nav link + the builder "Back" link (currently
**focus-invisible** — a real a11y gap).

**Card primitive — the one edit that elevates every screen at once** (`components/ui/card.tsx`):
```tsx
// before: 'rounded-xl border bg-card text-card-foreground shadow-xs'
'rounded-xl bg-card text-card-foreground ring-1 ring-border/70 [box-shadow:var(--highlight-top),var(--elevation-1)]'
```
Swap the hard `border` for a `ring-1 ring-border/70` hairline + top highlight (the Linear/Vercel pattern).
Keep `rounded-xl` (the 10px radius token). Because `Card` is on every screen, this upgrades login,
questions, exams, and builder simultaneously — the "framework inherits it" win.

**Button** (`components/ui/button.tsx`): make primary actions read as raised objects, standardize focus:
```tsx
// default:  bg-primary [box-shadow:var(--highlight-top),var(--elevation-1)] hover:shadow-e2 hover:bg-primary/90
// outline/secondary: ring-1 ring-border  (instead of border) for hairline consistency
// all variants: replace the inline ring soup with the .focus-ring class
```
**Badge:** add `ring-1 ring-inset ring-border/60` to `outline`/`secondary`; `success`/`warning` keep their
subtle fills (the tint is the signal).

**Typography (global, cheap):** `tracking-tight` on `h1`/`h2` page titles; `text-pretty` on
`CardDescription` and empty-state paragraphs (no orphans); extend `font-mono tabular-nums` to every
count/score/points/duration so figures align.

### 5.1 `/login`
- **Backdrop:** replace `bg-muted/40` with a 6%-opacity primary radial wash (invisible-until-felt; text
  never sits on it): `bg-background [background-image:radial-gradient(ellipse_80%_60%_at_50%_-10%,oklch(0.55_0.20_264_/_0.06),transparent_70%)]`.
- **Card:** hero → `shadow-e2` + inherited top highlight (drop the old `shadow-xs`).
- **Logo "Q":** `bg-gradient-to-b from-primary to-[oklch(0.50_0.20_264)] ring-1 ring-primary/20 shadow-e1`
  (tonal gradient makes it a real object, not a swatch).
- **Title:** `text-2xl font-semibold tracking-tight`. **Submit:** inherits Button highlight; keep `active:scale-[0.98]`.

### 5.2 `/questions` (master-detail)
- **Sticky editor panel:** `shadow-e2` (one tier above the resting list → encodes "this stays put").
- **Option rows:** `ring-1 ring-border/70`; correct/checked →
  `has-[:checked]:ring-success/40 has-[:checked]:bg-success-subtle/60 has-[:checked]:shadow-[inset_3px_0_0_0_var(--success)]`
  (3 px inset success bar = decisive but calm). Letter chip → `ring-1 ring-border/60` (key-cap), keep `font-mono tabular-nums`.
- **Question cards:** inherit `e1` + hairline + highlight. Hover → `hover:shadow-e2 hover:ring-border`
  (ring 70%→100% = lift+sharpen) on `transition-[box-shadow,border-color]`.
- **Editing (selected) state:** `ring-2 ring-primary shadow-e2` + a **left primary accent bar**
  (`relative overflow-hidden` + `before:absolute before:inset-y-3 before:left-0 before:w-1 before:rounded-full before:bg-primary`).
- **Correct-answer row inside the card:** identical `ring-1 ring-success/30` + 3 px inset success bar; "Correct" label `text-success-text`.
- **Pending (optimistic):** replace `opacity-50` with `opacity-70 saturate-[0.85]` ("settling," not "disabled").
- **Empty state:** `rounded-xl border border-dashed border-border bg-muted/30 py-14 ring-1 ring-inset ring-border/40`;
  icon in a soft circle (`grid size-12 place-items-center rounded-full bg-muted ring-1 ring-border/60 text-muted-foreground`);
  title `font-medium`, body `text-pretty`, CTA `variant="outline"`.

### 5.3 `/exams` (list + create)
- **Create panel:** sticky `Card` → `shadow-e2`; resting list → `e1` (the gap is what reads as hierarchy).
- **Exam list items (Link cards):** resting `e1` + hairline; hover →
  `hover:shadow-e2 hover:ring-primary/30` (faint **primary** tint = "navigable, goes somewhere"); add a
  `ChevronRight` affordance. Put `focus-ring rounded-xl` on the `Link` so the whole card is the focus target.
- **Status badges:** `published` → `success` + `bg-success` dot; `draft` → `outline text-muted-foreground`
  + `before:size-1.5 before:rounded-full before:bg-muted-foreground/50` dot. Amber reserved for "needs
  attention" (e.g. exam with 0 questions); never red. Meta line numbers → `font-mono tabular-nums`.

### 5.4 `/exams/[id]` (builder)
- **Sticky summary bar:** highest lift of any persistent surface — `shadow-e2 ring-1 ring-border`; when
  there are unsaved changes, add `ring-primary/30`. Count badge → `font-mono tabular-nums` (+ `NumberTicker`).
- **Selectable rows:** unselected resting `e1` + hairline, `hover:ring-primary/30 hover:shadow-e2`;
  **selected** → `ring-2 ring-primary bg-primary/[0.03] shadow-e2` + the **same** left primary accent bar
  as the editing card (one selected-language app-wide). Checkbox → `accent-primary` + `focus-ring rounded`.
  Points `<input type=number>` → inherited offset focus ring + `font-mono tabular-nums`.
- **Empty state:** same refined dashed treatment. **Back link:** add `focus-ring rounded`.

### 5.5 Guardrails (why this stays restrained)
- **3 elevation tiers only** (e1 resting / e2 hover+sticky / e3 dialogs) — limiting levels is what keeps
  elevation trustworthy, not noisy.
- **Color only with intent:** primary tint = navigable/selected, success = correct/published,
  amber = not-yet, red = delete/error only. Gradients ≤6% tonal washes, never decorative.
- **All transform/opacity-safe and reduced-motion-safe** (pure shadow/ring/border).
- **One focus-visible, one selected-language, one card depth** across all four screens = the reusable
  framework, not bespoke styling per component.

---

## 6. Reduced-motion + performance rules

### Reduced motion — defense in depth (3 layers)
1. **CSS backstop (already in `globals.css`, keep it).** Neutralizes any CSS transition/animation —
   including Tailwind `transition-*`, sonner, and third-party — even on components the lib never touches.
   Fix: spinners get `animate-spin motion-reduce:animate-none` so they sit still, not frozen mid-spin.
2. **Global lib config (the spine):** `<MotionConfig reducedMotion="user">` (§3a) disables
   transform/layout animations site-wide when the OS asks, **preserving opacity/color**. A future feature
   that just renders an `<m.div>` preset is compliant with **zero extra code**.
3. **Per-component escape hatch (rare):** `useReducedMotion()` for JS branches the global config can't
   express (spinner, conditional slide-vs-fade, `NumberTicker` snap-to-value). Values still come from
   `variants.ts`.

### Performance rules (prescriptive)
1. **Animate only `transform` (`x/y/scale/rotate`) and `opacity`** — GPU-composited, no layout/paint.
   Never `width/height/top/left/margin/padding/box-shadow`-in-a-loop.
2. **Size/reflow → the `layout` prop, sparingly.** FLIP animates as `transform`, not real height. Cap to
   the `/questions` list and builder selection; don't nest deeply. Reduced motion auto-disables it.
3. **`will-change` is a scalpel.** The lib sets/removes `will-change:transform` automatically during an
   active animation. Never add `will-change-transform` globally in Tailwind (a permanent layer per element
   hurts memory on long lists).
4. **Lazy-mount heavy motion.** `LazyMotion` loads the `domMax` chunk only when the first `m.*` mounts.
   For lists >~30 items, drop `layout` per item → virtualize or plain `transition-opacity` fade.
5. **`AnimatePresence` exit needs stable keys** (the optimistic temp→real `id` swap must key on a stable
   `clientId`, §4d) or rows double-mount.
6. **fps budget.** Press/hover **≤120 ms**; enter/exit **160–220 ms**; layout reflow **≤280 ms**;
   anything **>320 ms is a bug**. Enters use `EASE.out`; springs only for the optimistic add / press /
   count, never for static list reveals.

### SSR / hydration
- Every `motion/react` file = `'use client'`; data-fetching server components stay server (§3c).
- Never hide SSR/AT-relevant content behind `initial:{opacity:0}` — use `whileInView` (the `Stagger
  inView` prop) or `initial={false}` so first paint is visible and only client-inserted items animate.

---

## 7. Retrofit plan (login → questions → exams)

Order = **risk × reward**: smallest blast radius first to prove the framework, then the screen where motion
adds the most product value, then the server-rendered screens last (they need the client-boundary refactor).

**Step 0 — Foundation (no visible change, ~1 session).** `npm i motion@^12.23.0`; add the motion tokens to
`@theme` + the elevation tokens/`--highlight-top`/`.focus-ring`/`shimmer` to `globals.css`; create
`components/motion/variants.ts` + `motion-provider.tsx`; wire into `app/providers.tsx`. Upgrade the **Card,
Button, Input, Badge** primitives (§5.0) — this alone elevates all four screens. Confirm bundle size +
nothing breaks.

**Step 1 — `/login` (smallest surface; proves the system + Layer-2 auto-degrade).**
- `<FadeInUp>` around the card; logo "Q" gets the gradient/ring + a one-off spring `scale` pop on mount.
- Error `<Alert>` → wrap in `AnimatePresence` (opacity fade, ≤120 ms — instant, never a slide).
- Apply backdrop wash + `shadow-e2` (§5.1). Keep the existing `active:scale-[0.98]` submit press.
- **Win:** the page "arrives"; the error feels intentional, not punitive.

**Step 2 — `/questions` (highest product value — the optimistic-CRUD showcase).**
- List → `<AnimatedList>` + each card `<AnimatedListItem id={clientStableId}>` (key on a client-stable id
  through the temp→real swap, §4d). Create slides in, delete fades+collapses, reorder FLIPs.
- Pending state → animate `opacity` (and the §5.2 `opacity-70 saturate-[0.85]` visual) instead of a jump.
- Delete confirm → `<AnimatedDialog>` (replaces the inline toggle). Count badge → `<NumberTicker>`.
- Selected/editing card → §5.2 left-accent + `ring-2 ring-primary`. Loading → `<Skeleton>` in a `<Stagger>`.
- **Watch:** gate `layout` if the list can exceed ~30 items (§6).
- **Win:** optimistic updates become *legible* — you can see exactly what just happened.

**Step 3 — `/exams` + `/exams/[id]` (last — needs the client-boundary refactor).**
- `app/exams/page.tsx` is a **server component**: extract the `<ul>` into a `'use client'` `<ExamList>` and
  animate with `<Stagger inView>` (40 ms stagger) so SSR content stays visible/AT-readable. Cards →
  `<InteractiveCard>` (hover-lift, §4f/§5.3) + `ChevronRight` + status dots.
- `exam-create-form.tsx` (client) → same card/error entrance as login.
- `exam-builder.tsx` (client) → summary total via `<NumberTicker>`; selecting a question animates the
  `ring`/accent (§5.4); the points `<Input>` reveal via `AnimatePresence` fade. Sticky bar gets `ring-primary/30`
  when dirty.
- **Win:** the last screens inherit the exact same vocabulary; the builder's live total self-explains.

---

## 8. UI compliance checklist for every new feature

A feature is not "done" until every box passes. This is the PR self-review gate (mirror into `DESIGN.md`).

**Tokens & design language**
- [ ] Colors from tokens (`bg-primary`, `text-success-text`, …) — **zero hex literals** in components.
- [ ] Intent correct: success = green, "not yet" = **amber/warning (never red)**, red = destructive/error only.
- [ ] Radius via `rounded-md/lg/xl` (10px system); spacing on the 4/8 grid; numbers `font-mono tabular-nums`.

**Motion primitives (no bespoke animation)**
- [ ] Uses `m.*` from `@/components/motion` (never `motion.*` directly; `strict` enforces), inside the global `LazyMotion`/`MotionConfig`.
- [ ] Durations/easings/distances come from `variants.ts` (`DUR`/`EASE`/`SPRING`/shift tokens) — **no inline magic numbers**.
- [ ] Animates **only `transform`/`opacity`** (or the `layout` prop). No `width/height/top/left/margin/box-shadow`-in-a-loop.
- [ ] Enter/exit lists use `AnimatePresence` with **stable keys**; `layout` only where justified and gated for >30-item lists.
- [ ] Enter decelerates (`ease-out`), exit accelerates (`ease-in`); durations within the §6 fps budget (≤320 ms).

**Reduced motion**
- [ ] Verified with OS "Reduce motion" ON: no transform/scale/slide; content still appears; **nothing frozen mid-spin** (`motion-reduce:animate-none`).
- [ ] Any JS-branched animation uses `useReducedMotion()`; CSS-only animations carry `motion-reduce:` fallbacks.

**Accessibility (WCAG AA)**
- [ ] Text/icon contrast ≥4.5:1 (3:1 large) in **both** light and dark.
- [ ] Decorative icons `aria-hidden`; interactive controls have an accessible name.
- [ ] No info conveyed by motion/color alone (a fade-out delete is paired with a toast/text).
- [ ] Nothing auto-loops >5 s without a pause; nothing flashes >3×/s.

**Focus & interaction states**
- [ ] Keyboard-focusable; visible ring via `.focus-ring` (the standardized `ring-2 ring-ring ring-offset-2 ring-offset-background`).
- [ ] Focus not trapped or orphaned when an element animates out (`AnimatePresence` exit must move focus before unmount).
- [ ] Hover has a non-hover equivalent for touch/keyboard; `active:scale` carries `motion-reduce:active:scale-100`.

**Visual elevation**
- [ ] Surfaces use the 3-tier scale (`shadow-e1` resting / `e2` hover+sticky / `e3` dialogs) — not flat `shadow-xs`.
- [ ] Selected/active state uses the shared **left-primary-accent + `ring-2 ring-primary`** language.
- [ ] Cards use `ring-1 ring-border` hairline + `--highlight-top`, not a hard `border`.

**SSR / Next App Router**
- [ ] Every file importing `motion/react` has `'use client'`; data-fetching server components stay server and delegate animation to a child client component.
- [ ] No SSR/AT/SEO-relevant content hidden behind `initial:{opacity:0}` without a `whileInView`/`initial={false}` fallback.

---

## Relevant files
- `web/app/globals.css` — add §2 motion tokens to `@theme`, §5.0 elevation tokens to `:root`/`.dark`, `.focus-ring`, `shimmer` keyframe. **Keep** `--ease-quart` + the `prefers-reduced-motion` block.
- `web/app/providers.tsx` — nest `<MotionProvider>` inside React Query.
- `web/app/template.tsx` — **new**, route transitions via `<Pane paneKey={usePathname()}>`.
- `web/components/motion/*` — **new** kit (§4).
- `web/components/ui/card.tsx · button.tsx · input.tsx · badge.tsx` — §5.0 primitive upgrades (Card/Button raised; Input/Button focus standardized; Badge ring).
- `web/app/login/page.tsx · app/questions/questions-manager.tsx · app/questions/question-card.tsx · app/exams/page.tsx · app/exams/[id]/exam-builder.tsx · app/exams/exam-create-form.tsx` — retrofit targets (§7).

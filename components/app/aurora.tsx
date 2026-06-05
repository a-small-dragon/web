// Decorative animated gradient mesh for the marketing/auth surfaces. Pure CSS (no JS), behind
// content, aria-hidden; frozen under prefers-reduced-motion by the global rule in globals.css.
export function Aurora() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="qf-dotgrid absolute inset-0" />
      <div className="qf-aurora size-[38rem] bg-primary/30" style={{ top: '-14rem', left: '-8rem' }} />
      <div
        className="qf-aurora size-[30rem] bg-[oklch(0.72_0.13_185_/_0.30)]"
        style={{ top: '-6rem', right: '-6rem', animationDelay: '-7s' }}
      />
      <div
        className="qf-aurora size-[28rem] bg-[oklch(0.58_0.24_300_/_0.22)]"
        style={{ bottom: '-12rem', left: '28%', animationDelay: '-14s' }}
      />
    </div>
  )
}

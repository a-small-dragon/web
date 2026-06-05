/** @type {import('next').NextConfig} */

// Conservative security headers on every response. CSP is intentionally omitted for now
// (a strict policy needs nonce wiring for Next's inline runtime) — tracked as a follow-up.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
]

const nextConfig = {
  // standalone output → small Docker runtime image (server.js)
  output: 'standalone',
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig

/** @type {import('next').NextConfig} */

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co https://api.brevo.com https://api.telegram.org; base-uri 'none'; form-action 'self';"
  }
]

// The contributor portal and its admin moved to Nextrium on 15 Oct 2026:
// the portal is now contribute.nextrium.org and its admin is the Contributor
// portal section of dashboard.nextrium.org. Paths map one to one
// (/contribute/tasks/x -> /tasks/x) and query strings are kept. Temporary
// (307) for now; make them permanent once the move has settled.
const PORTAL = 'https://contribute.nextrium.org'
const PORTAL_ADMIN = 'https://dashboard.nextrium.org/portal'

const nextConfig = {
  async redirects() {
    return [
      { source: '/contribute', destination: `${PORTAL}/`, permanent: false },
      { source: '/contribute/:path*', destination: `${PORTAL}/:path*`, permanent: false },
      { source: '/admin', destination: PORTAL_ADMIN, permanent: false },
      { source: '/admin/:path*', destination: PORTAL_ADMIN, permanent: false },
    ]
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = nextConfig

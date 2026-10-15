import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

// The contributor portal moved to Nextrium on 15 Oct 2026 and the Telegram bot
// was retired with it. Every /api route belonged to one of the two, so they all
// answer 410 Gone. The path is decoded and lowercased first so no spelling of
// it reaches a route.
function isRetiredApi(pathname: string): boolean {
  let p = pathname
  try { p = decodeURIComponent(pathname) } catch { return true }
  p = p.toLowerCase()
  return p === '/api' || p.startsWith('/api/')
}

export async function proxy(request: NextRequest) {
  if (isRetiredApi(request.nextUrl.pathname)) {
    return NextResponse.json({ error: 'This endpoint has been retired.' }, { status: 410 })
  }
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, verifySession, ACCESS_COOKIE, COOKIE_NAME, CSRF_COOKIE, verifyCsrfToken } from '@/lib/auth-edge'

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/invite', '/reset-password', '/verify-email']
const PUBLIC_DYNAMIC_PREFIXES = ['/share/']
const PUBLIC_PREFIXES = ['/api/', '/_next/', '/fonts/', '/images/']

// Mutation methods that require CSRF verification
const MUTATION_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const { method } = req

  // ─── Public routes ────────────────────────────────────────────────────────

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
  const isPublicPrefix = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))

  if (pathname === '/favicon.ico') return NextResponse.next()
  if (isPublicPrefix) return NextResponse.next()

  // ─── CSRF check for internal API mutations ────────────────────────────────
  // Only applies to internal routes (not /api/v1/ — those use Bearer tokens)
  // Not applied to auth routes (login uses credentials, not session cookies)

  if (
    pathname.startsWith('/api/') &&
    !pathname.startsWith('/api/v1/') &&
    !pathname.startsWith('/api/auth/') &&
    !pathname.startsWith('/api/health') &&
    !pathname.startsWith('/api/mcp') &&
    MUTATION_METHODS.includes(method)
  ) {
    const csrfCookie = req.cookies.get(CSRF_COOKIE)?.value
    const csrfHeader = req.headers.get('x-csrf-token') ?? undefined
    if (!verifyCsrfToken(csrfCookie, csrfHeader)) {
      return NextResponse.json({ error: 'CSRF token invalid' }, { status: 403 })
    }
  }

  // ─── Public page routes — no auth needed ─────────────────────────────────

  const isPublicDynamic = PUBLIC_DYNAMIC_PREFIXES.some((p) => pathname.startsWith(p))
  if (isPublicRoute || isPublicDynamic) return NextResponse.next()

  // ─── Auth check for app pages ─────────────────────────────────────────────

  // Try new access token first
  const accessToken = req.cookies.get(ACCESS_COOKIE)?.value
  if (accessToken) {
    const session = await verifyAccessToken(accessToken)
    if (session) return NextResponse.next()
  }

  // Fallback: legacy session cookie (for existing share-link sessions)
  const legacyToken = req.cookies.get(COOKIE_NAME)?.value
  if (legacyToken) {
    const session = await verifySession(legacyToken)
    if (session) return NextResponse.next()
  }

  // Per-project guest cookie (for share links)
  const projectSlug = pathname.split('/')[1]
  if (projectSlug) {
    const projectToken = req.cookies.get(`arbo_project_${projectSlug}`)?.value
    if (projectToken) {
      const session = await verifySession(projectToken)
      if (session) return NextResponse.next()
    }
  }

  // ─── Not authenticated — redirect to login ────────────────────────────────

  const loginUrl = new URL('/login', req.url)
  loginUrl.searchParams.set('redirect', pathname)
  if (projectSlug && projectSlug !== 'login' && projectSlug !== 'signup') {
    loginUrl.searchParams.set('project', projectSlug)
  }
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|fonts/).*)'],
}

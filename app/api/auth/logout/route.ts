import { NextRequest, NextResponse } from 'next/server'
import { clearAuthCookies, revokeRefreshToken, REFRESH_COOKIE } from '@/lib/auth'

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get(REFRESH_COOKIE)?.value
  if (refreshToken) {
    revokeRefreshToken(refreshToken)
  }

  const res = NextResponse.json({ ok: true })
  clearAuthCookies(res)
  return res
}

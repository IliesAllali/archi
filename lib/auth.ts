import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "dev-secret-change-in-prod"
)
const COOKIE_NAME = "arbo_session"

export async function createSession(payload: Record<string, string>) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(JWT_SECRET)
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload
  } catch {
    return null
  }
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySession(token)
}

export { COOKIE_NAME }

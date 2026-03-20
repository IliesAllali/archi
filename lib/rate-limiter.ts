/**
 * In-memory rate limiter.
 * Acceptable for V1 single-instance deployment.
 * Replace with Redis-backed limiter if scaling to multiple instances.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

/**
 * Check and increment rate limit for a key.
 * Returns { allowed: true } or { allowed: false, retryAfter: seconds }.
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, retryAfter }
  }

  entry.count++
  return { allowed: true }
}

/** Pre-configured limiters */

/** Auth routes: 10 attempts per minute per IP */
export function checkAuthLimit(ip: string) {
  return checkRateLimit(`auth:${ip}`, 10, 60_000)
}

/** AI API: 60 requests per minute per token */
export function checkAiTokenLimit(tokenId: string) {
  return checkRateLimit(`ai:${tokenId}`, 60, 60_000)
}

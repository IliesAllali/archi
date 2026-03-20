/**
 * Simple in-memory rate limiter for AI endpoints.
 * Per-user, sliding window.
 */

const AI_LIMIT = 20;           // max requests per window
const AI_WINDOW_MS = 60 * 60 * 1000; // 1 hour

const userRequests = new Map<string, number[]>();

// Cleanup old entries every 10 minutes
setInterval(() => {
  const cutoff = Date.now() - AI_WINDOW_MS;
  for (const [key, timestamps] of userRequests) {
    const filtered = timestamps.filter((t) => t > cutoff);
    if (filtered.length === 0) {
      userRequests.delete(key);
    } else {
      userRequests.set(key, filtered);
    }
  }
}, 10 * 60 * 1000);

export function checkAiRateLimit(userId: string): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const cutoff = now - AI_WINDOW_MS;

  const timestamps = (userRequests.get(userId) || []).filter((t) => t > cutoff);

  if (timestamps.length >= AI_LIMIT) {
    const oldestInWindow = timestamps[0];
    const retryAfterSeconds = Math.ceil((oldestInWindow + AI_WINDOW_MS - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  timestamps.push(now);
  userRequests.set(userId, timestamps);
  return { allowed: true, remaining: AI_LIMIT - timestamps.length, retryAfterSeconds: 0 };
}

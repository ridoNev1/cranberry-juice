type Entry = { count: number; resetAt: number }

// In-memory store — replace with Redis for multi-instance deployments.
const store = new Map<string, Entry>()

// Prune expired entries every 5 minutes to prevent unbounded growth.
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now()
      for (const [key, entry] of store) {
        if (now > entry.resetAt) store.delete(key)
      }
    },
    5 * 60 * 1000
  )
}

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterMs: number }

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { allowed: false, retryAfterMs: entry.resetAt - now }
  }

  entry.count++
  return { allowed: true, remaining: limit - entry.count }
}

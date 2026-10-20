import { getRequestIP, setResponseHeader } from 'h3'
import type { H3Event } from 'h3'
import { LOG_EVENT } from '../../consts/log-event.const'
import type { IRateLimitOptions, IRateLimitResult } from '../../interfaces/rate-limit.interface'
import { logger } from '../logger.util'
import { tooManyRequests } from './api-error.util'

/**
 * Fenêtre glissante en mémoire. Suffisant pour UNE instance : avec plusieurs
 * instances, chacune compte séparément (limite documentée dans le README).
 */
export class SlidingWindowRateLimiter {
  private readonly hits = new Map<string, number[]>()
  private lastSweepAt: number

  constructor(
    private readonly options: IRateLimitOptions,
    private readonly now: () => number = Date.now
  ) {
    this.lastSweepAt = now()
  }

  check(key: string): IRateLimitResult {
    const now = this.now()
    this.sweep(now)

    const windowStart = now - this.options.windowMs
    const recent = (this.hits.get(key) ?? []).filter((timestamp) => timestamp > windowStart)

    if (recent.length >= this.options.maxRequests) {
      this.hits.set(key, recent)
      return { allowed: false, remaining: 0, retryAfterMs: recent[0]! + this.options.windowMs - now }
    }

    recent.push(now)
    this.hits.set(key, recent)
    return { allowed: true, remaining: this.options.maxRequests - recent.length, retryAfterMs: 0 }
  }

  /** Purge les clés expirées au plus une fois par fenêtre, pour borner la mémoire. */
  private sweep(now: number): void {
    if (now - this.lastSweepAt < this.options.windowMs) {
      return
    }
    this.lastSweepAt = now
    const windowStart = now - this.options.windowMs
    for (const [key, timestamps] of this.hits) {
      if (timestamps.every((timestamp) => timestamp <= windowStart)) {
        this.hits.delete(key)
      }
    }
  }
}

let sharedLimiter: SlidingWindowRateLimiter | undefined

const useRateLimiter = (): SlidingWindowRateLimiter => {
  if (!sharedLimiter) {
    const { rateLimit } = useRuntimeConfig()
    sharedLimiter = new SlidingWindowRateLimiter({
      windowMs: Number(rateLimit.windowMs),
      maxRequests: Number(rateLimit.maxRequests)
    })
  }
  return sharedLimiter
}

/** À appeler en tête de handler : lève une 429 avec `Retry-After` au dépassement. */
export const enforceRateLimit = (event: H3Event, routeKey: string): void => {
  const ip = getRequestIP(event) ?? 'unknown'
  const result = useRateLimiter().check(`${ip}:${routeKey}`)

  if (!result.allowed) {
    setResponseHeader(event, 'Retry-After', Math.ceil(result.retryAfterMs / 1000))
    logger.warn(LOG_EVENT.RATE_LIMIT_EXCEEDED, { requestId: event.context.requestId, route: routeKey })
    throw tooManyRequests()
  }
}

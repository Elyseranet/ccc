import { getRequestIP, setResponseHeader } from 'h3'
import type { H3Event } from 'h3'
import { LOG_EVENT } from '../../../consts/log-event.const'
import { RATE_LIMIT_OPTION_NAMES, RATE_LIMIT_ROUTE_CONFIG_KEY, RATE_LIMIT_ROUTE_KEY } from '../../../consts/rate-limit.const'
import type { IRateLimitOptions, IRateLimitResult } from '../../../interfaces/rate-limit.interface'
import { normalizeIpForRateLimit, truncateIpForLog } from '../ip.util'
import { logger } from '../logger.util'
import { tooManyRequests } from './api-error.util'

/**
 * Chaque réglage doit être un entier strictement positif : NaN, 0 ou une valeur négative
 * rendrait le plafond inopérant (`size > NaN` est faux). Le message nomme le réglage, jamais une valeur secrète.
 */
export const assertRateLimitOptions = (options: IRateLimitOptions): IRateLimitOptions => {
  for (const name of RATE_LIMIT_OPTION_NAMES) {
    if (!Number.isSafeInteger(options[name]) || options[name] <= 0) {
      throw new Error(`Invalid rate limit setting "${name}": expected a strictly positive integer`)
    }
  }
  return options
}

/** Réglages d'une route : valeurs par défaut de `runtimeConfig.rateLimit`, surchargées par celles de la route. */
export const resolveRateLimitOptions = (
  rateLimit: Record<string, unknown>,
  routeKey: string
): IRateLimitOptions => {
  const configKey = (RATE_LIMIT_ROUTE_CONFIG_KEY as Record<string, string>)[routeKey]
  const override = (configKey ? rateLimit[configKey] : undefined) as Partial<IRateLimitOptions> | undefined
  return assertRateLimitOptions({
    windowMs: Number(override?.windowMs ?? rateLimit.windowMs),
    maxRequests: Number(override?.maxRequests ?? rateLimit.maxRequests),
    maxKeys: Number(override?.maxKeys ?? rateLimit.maxKeys)
  })
}

/** Valide au démarrage les réglages de toutes les routes limitées (échec explicite, pas de plafond désactivé). */
export const assertRateLimitConfig = (rateLimit: Record<string, unknown>): void => {
  for (const routeKey of Object.values(RATE_LIMIT_ROUTE_KEY)) {
    resolveRateLimitOptions(rateLimit, routeKey)
  }
}

/**
 * Fenêtre glissante en mémoire. Suffisant pour UNE instance : avec plusieurs
 * instances, chacune compte séparément. Le plafond `maxKeys` est un LRU : un grand nombre d'IP
 * distinctes peut évincer des compteurs légitimes (limite documentée dans le README, cf. T-SEC-02).
 */
export class SlidingWindowRateLimiter {
  private readonly hits = new Map<string, number[]>()
  private lastSweepAt: number

  constructor(
    private readonly options: IRateLimitOptions,
    private readonly now: () => number = Date.now
  ) {
    assertRateLimitOptions(options)
    this.lastSweepAt = now()
  }

  get size(): number {
    return this.hits.size
  }

  check(key: string): IRateLimitResult {
    const now = this.now()
    this.sweep(now)

    const windowStart = now - this.options.windowMs
    const recent = (this.hits.get(key) ?? []).filter((timestamp) => timestamp > windowStart)

    if (recent.length >= this.options.maxRequests) {
      this.touch(key, recent)
      return { allowed: false, remaining: 0, retryAfterMs: recent[0]! + this.options.windowMs - now }
    }

    recent.push(now)
    this.touch(key, recent)
    return { allowed: true, remaining: this.options.maxRequests - recent.length, retryAfterMs: 0 }
  }

  /** Oublie les tentatives d'une clé (ex. : un login réussi remet à zéro le compteur de l'email). */
  reset(key: string): void {
    this.hits.delete(key)
  }

  /** LRU : une Map garde l'ordre d'insertion, réinsérer la clé la place en dernier. */
  private touch(key: string, timestamps: number[]): void {
    this.hits.delete(key)
    this.hits.set(key, timestamps)
    if (this.hits.size > this.options.maxKeys) {
      const oldest = this.hits.keys().next().value
      if (oldest !== undefined) {
        this.hits.delete(oldest)
      }
    }
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

const limiters = new Map<string, SlidingWindowRateLimiter>()

const useRateLimiter = (routeKey: string): SlidingWindowRateLimiter => {
  let limiter = limiters.get(routeKey)
  if (!limiter) {
    const { rateLimit } = useRuntimeConfig()
    limiter = new SlidingWindowRateLimiter(resolveRateLimitOptions(rateLimit, routeKey))
    limiters.set(routeKey, limiter)
  }
  return limiter
}

/** À appeler en tête de handler : lève une 429 avec `Retry-After` au dépassement. */
export const enforceRateLimit = (event: H3Event, routeKey: string): void => {
  const ip = normalizeIpForRateLimit(getRequestIP(event) ?? 'unknown')
  const result = useRateLimiter(routeKey).check(`${ip}:${routeKey}`)

  if (!result.allowed) {
    setResponseHeader(event, 'Retry-After', Math.ceil(result.retryAfterMs / 1000))
    logger.warn(LOG_EVENT.RATE_LIMIT_EXCEEDED, { requestId: event.context.requestId, key: routeKey, ip: truncateIpForLog(ip) })
    throw tooManyRequests()
  }
}

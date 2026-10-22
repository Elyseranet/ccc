import { setResponseHeader } from 'h3'
import type { H3Event } from 'h3'
import { PASSWORD_CHANGE_MAX_ATTEMPTS, RATE_LIMIT_AUTH_ROUTE_KEY } from '../consts/auth.const.js'
import { LOG_EVENT } from '../consts/log-event.const.js'
import type { ILoginLimiters } from '../interfaces/rate-limit.interface.js'
import { getClientIp } from './client-ip.util.js'
import { normalizeIpForRateLimit } from './ip.util.js'
import { logger } from './logger.util.js'
import { tooManyRequests } from './api-error.util.js'
import { SlidingWindowRateLimiter } from './rate-limit.util.js'

let limiters: ILoginLimiters<SlidingWindowRateLimiter> | undefined

const useLimiters = (): ILoginLimiters<SlidingWindowRateLimiter> => {
  if (!limiters) {
    const { auth } = useRuntimeConfig()
    const { windowMs, maxIpAttempts, maxKeys } = auth.loginRateLimit
    const base = { windowMs: Number(windowMs), maxKeys: Number(maxKeys) }
    limiters = {
      byIp: new SlidingWindowRateLimiter({ ...base, maxRequests: Number(maxIpAttempts) }),
      byPasswordChange: new SlidingWindowRateLimiter({ ...base, maxRequests: PASSWORD_CHANGE_MAX_ATTEMPTS })
    }
  }
  return limiters
}

/** 429 avec `Retry-After` (en secondes, arrondi au supérieur). */
export const rejectTooManyRequests = (event: H3Event, routeKey: string, retryAfterMs: number): never => {
  setResponseHeader(event, 'Retry-After', Math.max(1, Math.ceil(retryAfterMs / 1000)))
  logger.warn(LOG_EVENT.RATE_LIMIT_EXCEEDED, { requestId: event.context.requestId, route: routeKey })
  throw tooManyRequests()
}

/**
 * Limite le login par IP : elle freine le balayage de nombreux emails depuis une seule adresse.
 * Le ralentissement par compte (SEC-A2) est persisté en base, voir `login-throttle.util.ts`.
 */
export const enforceLoginRateLimit = (event: H3Event): void => {
  const ip = normalizeIpForRateLimit(getClientIp(event) ?? 'unknown')
  const result = useLimiters().byIp.check(ip)
  if (!result.allowed) {
    rejectTooManyRequests(event, RATE_LIMIT_AUTH_ROUTE_KEY.LOGIN_IP, result.retryAfterMs)
  }
}

/** Freine le devinage de l'ancien mot de passe depuis une session volée. */
export const enforcePasswordChangeRateLimit = (event: H3Event, userId: string): void => {
  const result = useLimiters().byPasswordChange.check(userId)
  if (!result.allowed) {
    rejectTooManyRequests(event, RATE_LIMIT_AUTH_ROUTE_KEY.CHANGE_PASSWORD, result.retryAfterMs)
  }
}

import { getRequestIP, setResponseHeader } from 'h3'
import type { H3Event } from 'h3'
import { EMAIL_MAX_LENGTH, PASSWORD_CHANGE_MAX_ATTEMPTS, RATE_LIMIT_AUTH_ROUTE_KEY } from '../../consts/auth.const'
import { LOG_EVENT } from '../../consts/log-event.const'
import type { ILoginLimiters } from '../../interfaces/rate-limit.interface'
import { normalizeIpForRateLimit } from '../ip.util'
import { logger } from '../logger.util'
import { tooManyRequests } from '../http/api-error.util'
import { SlidingWindowRateLimiter } from '../http/rate-limit.util'



let limiters: ILoginLimiters<SlidingWindowRateLimiter> | undefined

const useLimiters = (): ILoginLimiters<SlidingWindowRateLimiter> => {
  if (!limiters) {
    const { auth } = useRuntimeConfig()
    const { windowMs, maxIpAttempts, maxEmailAttempts, maxKeys } = auth.loginRateLimit
    const base = { windowMs: Number(windowMs), maxKeys: Number(maxKeys) }
    limiters = {
      byIp: new SlidingWindowRateLimiter({ ...base, maxRequests: Number(maxIpAttempts) }),
      byEmail: new SlidingWindowRateLimiter({ ...base, maxRequests: Number(maxEmailAttempts) }),
      byPasswordChange: new SlidingWindowRateLimiter({ ...base, maxRequests: PASSWORD_CHANGE_MAX_ATTEMPTS })
    }
  }
  return limiters
}

const reject = (event: H3Event, routeKey: string, retryAfterMs: number): never => {
  setResponseHeader(event, 'Retry-After', Math.ceil(retryAfterMs / 1000))
  logger.warn(LOG_EVENT.RATE_LIMIT_EXCEEDED, { requestId: event.context.requestId, route: routeKey })
  throw tooManyRequests()
}

/**
 * Limite le login par IP ET par email (normalisé). Le compteur par email freine le bourrage
 * d'identifiants depuis plusieurs IP, celui par IP freine le balayage de nombreux emails depuis une
 * seule. Un email bloqué le reste même avec le bon mot de passe, jusqu'à la fin de la fenêtre.
 */
export const enforceLoginRateLimit = (event: H3Event, normalizedEmail: string): void => {
  const { byIp, byEmail } = useLimiters()
  const ip = normalizeIpForRateLimit(getRequestIP(event) ?? 'unknown')
  const ipResult = byIp.check(ip)
  const emailResult = byEmail.check(normalizedEmail.slice(0, EMAIL_MAX_LENGTH))
  if (!ipResult.allowed) {
    reject(event, RATE_LIMIT_AUTH_ROUTE_KEY.LOGIN_IP, ipResult.retryAfterMs)
  }
  if (!emailResult.allowed) {
    reject(event, RATE_LIMIT_AUTH_ROUTE_KEY.LOGIN_EMAIL, emailResult.retryAfterMs)
  }
}

/** Un login réussi remet à zéro le compteur de l'email : seuls les échecs consécutifs verrouillent. */
export const clearLoginEmailAttempts = (normalizedEmail: string): void => {
  useLimiters().byEmail.reset(normalizedEmail.slice(0, EMAIL_MAX_LENGTH))
}

/** Freine le devinage de l'ancien mot de passe depuis une session volée. */
export const enforcePasswordChangeRateLimit = (event: H3Event, userId: string): void => {
  const result = useLimiters().byPasswordChange.check(userId)
  if (!result.allowed) {
    reject(event, RATE_LIMIT_AUTH_ROUTE_KEY.CHANGE_PASSWORD, result.retryAfterMs)
  }
}

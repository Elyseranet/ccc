import { getCookie, getRequestHeader, getRequestURL } from 'h3'
import { LOG_EVENT } from '../consts/log-event.const'
import { API_PREFIX } from '../consts/request.const'
import { isCrossSiteWrite, parseAllowedOrigins } from '../utils/auth/csrf.util'
import { getSessionCookieName, isWellFormedSessionToken } from '../utils/auth/session-token.util'
import { resolveSession } from '../utils/auth/session-store.util'
import { forbiddenOrigin } from '../utils/http/api-error.util'
import { sanitizeRouteForLog } from '../utils/log-sanitize.util'
import { logger } from '../utils/logger.util'

/**
 * Sous /api : (1) refuse une écriture venue d'une autre origine, (2) résout la session et pose
 * `event.context.user`. Le middleware n'exige rien : c'est `requireUser` / `requireRole` qui garde
 * chaque route, donc une route publique n'a rien à faire pour rester publique.
 */
export default defineEventHandler(async (event) => {
  if (!event.path?.startsWith(API_PREFIX)) {
    return
  }

  const { auth } = useRuntimeConfig()
  const secFetchSite = getRequestHeader(event, 'sec-fetch-site')
  if (isCrossSiteWrite({
    method: event.method,
    origin: getRequestHeader(event, 'origin'),
    secFetchSite,
    ownOrigin: getRequestURL(event).origin,
    allowedOrigins: parseAllowedOrigins(String(auth.allowedOrigins))
  })) {
    logger.warn(LOG_EVENT.AUTH_CROSS_ORIGIN_REFUSED, {
      requestId: event.context.requestId,
      route: sanitizeRouteForLog(event.path),
      method: event.method
    })
    throw forbiddenOrigin()
  }

  const token = getCookie(event, getSessionCookieName(process.env.NODE_ENV === 'production'))
  if (isWellFormedSessionToken(token)) {
    const user = await resolveSession(await useDataSource(), token)
    if (user) {
      event.context.user = user
    }
  }
})

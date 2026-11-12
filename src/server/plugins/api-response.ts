import { send, setResponseHeader, setResponseStatus } from 'h3'
import { LOG_EVENT } from '../../consts/log-event.const'
import { API_PREFIX } from '../../consts/request.const'
import { toApiError } from '../../utils/api-error.util'
import { databaseTimeoutError, isDatabaseTimeout } from '../../utils/database-timeouts.util'
import { sanitizeRouteForLog } from '../../utils/log-sanitize.util'
import { logger } from '../../utils/logger.util'

export default defineNitroPlugin((nitroApp) => {
  const originalOnError = nitroApp.h3App.options.onError

  // Sous /api/, toute erreur sort au format IApiError { statusCode, code, message, details? }.
  // Le détail d'une erreur 5xx est journalisé et ne part jamais dans la réponse.
  nitroApp.h3App.options.onError = async (error, event) => {
    if (!event.path?.startsWith(API_PREFIX) || event.handled) {
      return originalOnError?.(error, event)
    }

    // T-SEC-17 : un délai de la base (connexion, instruction annulée) répond 503 + Retry-After, jamais un 500 ni le message
    // du pilote. Toute autre erreur 5xx garde exactement son traitement.
    const databaseTimeout = isDatabaseTimeout(error)
    if (databaseTimeout) {
      const cause = ((error as { cause?: unknown }).cause ?? error) as { name?: string, code?: string }
      logger.error(LOG_EVENT.DATABASE_TIMEOUT, {
        requestId: event.context.requestId,
        route: sanitizeRouteForLog(event.path),
        errorName: cause.name,
        errorCode: cause.code
      })
    }
    const handled = databaseTimeout ? databaseTimeoutError() : error
    const apiError = toApiError(handled)
    if (apiError.statusCode >= 500 && !databaseTimeout) {
      logger.error(LOG_EVENT.UNHANDLED_ERROR, {
        requestId: event.context.requestId,
        route: sanitizeRouteForLog(event.path),
        errorName: error.name
      })
    }

    const retryAfterSeconds = (handled.data as { retryAfterSeconds?: unknown } | undefined)?.retryAfterSeconds
    if (apiError.statusCode === 503 && typeof retryAfterSeconds === 'number' && retryAfterSeconds > 0) {
      setResponseHeader(event, 'Retry-After', Math.ceil(retryAfterSeconds))
    }
    setResponseStatus(event, apiError.statusCode)
    setResponseHeader(event, 'Cache-Control', 'no-store')
    return send(event, JSON.stringify(apiError), 'application/json')
  }

  nitroApp.hooks.hook('afterResponse', (event) => {
    const startedAt = event.context.requestStartedAt
    logger.info(LOG_EVENT.REQUEST_COMPLETED, {
      requestId: event.context.requestId,
      route: sanitizeRouteForLog(event.path),
      method: event.method,
      statusCode: event.node.res.statusCode,
      durationMs: startedAt === undefined ? undefined : Date.now() - startedAt
    })
  })
})

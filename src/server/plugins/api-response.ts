import { send, setResponseHeader, setResponseStatus } from 'h3'
import { LOG_EVENT } from '../../consts/log-event.const'
import { API_PREFIX } from '../../consts/request.const'
import { toApiError } from '../../utils/api-error.util'
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

    const apiError = toApiError(error)
    if (apiError.statusCode >= 500) {
      logger.error(LOG_EVENT.UNHANDLED_ERROR, {
        requestId: event.context.requestId,
        route: sanitizeRouteForLog(event.path),
        errorName: error.name
      })
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

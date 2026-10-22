import { deleteCookie, getCookie, setResponseHeader, setResponseStatus } from 'h3'
import { LOG_EVENT } from '../../../../consts/log-event.const'
import { revokeSessionByToken } from '../../../../utils/session-store.util'
import { buildSessionCookieOptions, getSessionCookieName, isWellFormedSessionToken } from '../../../../utils/session-token.util'
import { logger } from '../../../../utils/logger.util'
import { useDataSource } from '../../../../utils/database.util'

/** Idempotent : sans session, avec une session expirée ou déjà révoquée, la réponse reste 204. */
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { auth } = useRuntimeConfig()
  const token = getCookie(event, getSessionCookieName(auth))
  if (isWellFormedSessionToken(token)) {
    await revokeSessionByToken(await useDataSource(), token)
    logger.info(LOG_EVENT.AUTH_LOGOUT, { requestId: event.context.requestId, userId: event.context.user?.id })
  }
  const { maxAge: _maxAge, ...cookieOptions } = buildSessionCookieOptions(auth)
  deleteCookie(event, getSessionCookieName(auth), cookieOptions)
  setResponseStatus(event, 204)
  return null
})

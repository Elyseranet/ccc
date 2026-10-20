import { deleteCookie, getCookie, setResponseHeader, setResponseStatus } from 'h3'
import { SESSION_COOKIE_NAME } from '../../../consts/auth.const'
import { LOG_EVENT } from '../../../consts/log-event.const'
import { revokeSessionByToken } from '../../../utils/auth/session-store.util'
import { buildSessionCookieOptions, isWellFormedSessionToken } from '../../../utils/auth/session-token.util'
import { logger } from '../../../utils/logger.util'

/** Idempotent : sans session, avec une session expirée ou déjà révoquée, la réponse reste 204. */
export default defineEventHandler(async (event) => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const token = getCookie(event, SESSION_COOKIE_NAME)
  if (isWellFormedSessionToken(token)) {
    await revokeSessionByToken(await useDataSource(), token)
    logger.info(LOG_EVENT.AUTH_LOGOUT, { requestId: event.context.requestId, userId: event.context.user?.id })
  }
  const { maxAge: _maxAge, ...cookieOptions } = buildSessionCookieOptions(process.env.NODE_ENV === 'production')
  deleteCookie(event, SESSION_COOKIE_NAME, cookieOptions)
  setResponseStatus(event, 204)
  return null
})

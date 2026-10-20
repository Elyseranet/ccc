import { getCookie, setCookie, setResponseHeader } from 'h3'
import { USER_STATUS } from '../../../../shared/enums/user.enum'
import type { IMe } from '../../../../shared/interfaces/api/me.interface'
import { normalizeEmail } from '../../../../shared/utils/email.util'
import { RATE_LIMIT_AUTH_ROUTE_KEY } from '../../../consts/auth.const'
import { LOG_EVENT } from '../../../consts/log-event.const'
import { UserEntity } from '../../../database/entities/user.entity'
import { loginSchema } from '../../../schemas/auth.schema'
import { enforceLoginRateLimit, rejectTooManyRequests } from '../../../utils/auth/login-rate-limit.util'
import { recordLoginFailure, remainingThrottleSeconds } from '../../../utils/auth/login-throttle.util'
import { loadMe } from '../../../utils/auth/me.util'
import { burnPasswordCheck, verifyPassword } from '../../../utils/auth/password.util'
import { createSession, purgeExpiredSessions, revokeSessionByToken } from '../../../utils/auth/session-store.util'
import { buildSessionCookieOptions, getSessionCookieName, isWellFormedSessionToken } from '../../../utils/auth/session-token.util'
import { invalidCredentials } from '../../../utils/http/api-error.util'
import { readBodyWithSchema } from '../../../utils/http/validation.util'
import { logger } from '../../../utils/logger.util'

export default defineEventHandler(async (event): Promise<IMe> => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const body = await readBodyWithSchema(event, loginSchema)
  const email = normalizeEmail(body.email)
  enforceLoginRateLimit(event)

  const dataSource = await useDataSource()
  const user = await dataSource.getRepository(UserEntity).findOne({
    where: { email },
    select: { id: true, status: true, passwordHash: true, throttledUntil: true }
  })

  // SEC-A2 : pendant le délai du compte, 429 sans même vérifier le mot de passe (ni brûler de scrypt).
  const waitSeconds = user ? remainingThrottleSeconds(user.throttledUntil, new Date()) : 0
  if (waitSeconds > 0) {
    logger.warn(LOG_EVENT.AUTH_LOGIN_THROTTLED, { requestId: event.context.requestId, userId: user?.id })
    rejectTooManyRequests(event, RATE_LIMIT_AUTH_ROUTE_KEY.LOGIN_THROTTLED, waitSeconds * 1000)
  }

  let accepted = false
  if (user && user.status === USER_STATUS.ACTIVE && user.passwordHash) {
    accepted = await verifyPassword(body.password, user.passwordHash)
  } else {
    await burnPasswordCheck(body.password)
  }

  if (!user || !accepted) {
    if (user) {
      await recordLoginFailure(dataSource, user.id)
    }
    // Ni l'email ni le mot de passe ne sont journalisés : un utilisateur tape parfois l'un à la place de l'autre.
    logger.warn(LOG_EVENT.AUTH_LOGIN_FAILED, { requestId: event.context.requestId })
    throw invalidCredentials()
  }

  // Rotation : une session présentée avec la requête est révoquée, le jeton émis est toujours neuf.
  const previousToken = getCookie(event, getSessionCookieName(process.env.NODE_ENV === 'production'))
  if (isWellFormedSessionToken(previousToken)) {
    await revokeSessionByToken(dataSource, previousToken)
  }
  const token = await createSession(dataSource, user.id)
  await dataSource.getRepository(UserEntity).update(
    { id: user.id },
    { lastLoginAt: new Date(), failedLoginCount: 0, throttledUntil: null }
  )
  await purgeExpiredSessions(dataSource)

  setCookie(event, getSessionCookieName(process.env.NODE_ENV === 'production'), token, buildSessionCookieOptions(process.env.NODE_ENV === 'production'))
  logger.info(LOG_EVENT.AUTH_LOGIN_SUCCEEDED, { requestId: event.context.requestId, userId: user.id })
  return loadMe(dataSource, user.id)
})

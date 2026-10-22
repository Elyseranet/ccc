import { getCookie, setCookie, setResponseHeader } from 'h3'
import { USER_STATUS } from '../../../../enums/user.enum'
import type { IMe } from '../../../../interfaces/me.interface'
import { normalizeEmail } from '../../../../utils/email.util'
import { RATE_LIMIT_AUTH_ROUTE_KEY } from '../../../../consts/auth.const'
import { LOG_EVENT } from '../../../../consts/log-event.const'
import { UserEntity } from '../../../db/typeorm/entities/user.entity'
import { loginSchema } from '../../../schemas/auth.schema'
import {
  buildDeviceCookieOptions,
  getDeviceCookieName,
  resolveDeviceCookieSecret,
  signDeviceCookie,
  verifyDeviceCookie
} from '../../../../utils/device-cookie.util'
import { findTrustedDevice, registerDevice, resetDeviceFailures } from '../../../../utils/device-store.util'
import { enforceLoginRateLimit, rejectTooManyRequests } from '../../../../utils/login-rate-limit.util'
import { reserveDeviceLoginAttempt, reserveLoginAttempt } from '../../../../utils/login-throttle.util'
import { loadMe } from '../../../../utils/me.util'
import { assertPasswordHashCapacity, burnPasswordCheck, verifyPassword } from '../../../../utils/password.util'
import { createSession, purgeExpiredSessions, revokeSessionByToken } from '../../../../utils/session-store.util'
import { buildSessionCookieOptions, getSessionCookieName, isWellFormedSessionToken } from '../../../../utils/session-token.util'
import { invalidCredentials } from '../../../../utils/api-error.util'
import { readBodyWithSchema } from '../../../../utils/validation.util'
import { logger } from '../../../../utils/logger.util'
import { useDataSource } from '../../../../utils/database.util'

export default defineEventHandler(async (event): Promise<IMe> => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  // Le limiteur par IP passe avant la lecture du corps : une rafale de corps volumineux ou invalides consomme le quota.
  enforceLoginRateLimit(event)
  const body = await readBodyWithSchema(event, loginSchema)
  const email = normalizeEmail(body.email)

  const { auth } = useRuntimeConfig()
  const deviceSecret = resolveDeviceCookieSecret(String(auth.deviceCookieSecret))
  const now = new Date()

  // L2 : refuser (503) avant de réserver une tentative, pour qu'un serveur saturé ne compte pas comme un échec.
  assertPasswordHashCapacity()

  const dataSource = await useDataSource()
  const user = await dataSource.getRepository(UserEntity).findOne({
    where: { email },
    select: { id: true, status: true, passwordHash: true }
  })

  // SEC-A4 : un appareil de confiance (cookie signé, lié à CE compte, ligne encore présente) n'est pas soumis
  // au délai du compte et n'a que son propre compteur. Tout le reste est « non reconnu ».
  const claim = verifyDeviceCookie(getCookie(event, getDeviceCookieName(auth)), deviceSecret, Math.floor(now.getTime() / 1000))
  const trustedDevice = user && claim ? await findTrustedDevice(dataSource, claim, user.id, now) : null

  // SEC-A2 : la tentative est réservée atomiquement AVANT scrypt, sur le compteur de l'appareil de confiance
  // ou, à défaut, sur celui du compte. Pendant le délai (ou si une tentative concurrente a déjà pris la place),
  // 429 sans vérifier le mot de passe. La réservation compte la tentative comme un échec ; seul un succès
  // remet le compteur à zéro.
  if (user) {
    const reservation = trustedDevice
      ? await reserveDeviceLoginAttempt(dataSource, trustedDevice.id, now)
      : await reserveLoginAttempt(dataSource, user.id, now)
    if (!reservation.reserved) {
      logger.warn(LOG_EVENT.AUTH_LOGIN_THROTTLED, {
        requestId: event.context.requestId,
        userId: user.id,
        trustedDevice: trustedDevice !== null
      })
      rejectTooManyRequests(event, RATE_LIMIT_AUTH_ROUTE_KEY.LOGIN_THROTTLED, reservation.retryAfterSeconds * 1000)
    }
  }

  let accepted = false
  if (user && user.status === USER_STATUS.ACTIVE && user.passwordHash) {
    accepted = await verifyPassword(body.password, user.passwordHash)
  } else {
    await burnPasswordCheck(body.password)
  }

  if (!user || !accepted) {
    // Ni l'email ni le mot de passe ne sont journalisés : un utilisateur tape parfois l'un à la place de l'autre.
    logger.warn(LOG_EVENT.AUTH_LOGIN_FAILED, { requestId: event.context.requestId })
    throw invalidCredentials()
  }

  // Rotation : une session présentée avec la requête est révoquée, le jeton émis est toujours neuf.
  const previousToken = getCookie(event, getSessionCookieName(auth))
  if (isWellFormedSessionToken(previousToken)) {
    await revokeSessionByToken(dataSource, previousToken)
  }
  const token = await createSession(dataSource, user.id)
  await dataSource.getRepository(UserEntity).update(
    { id: user.id },
    { lastLoginAt: now, failedLoginCount: 0, throttledUntil: null }
  )
  await purgeExpiredSessions(dataSource)
  setCookie(event, getSessionCookieName(auth), token, buildSessionCookieOptions(auth))

  // Appareil déjà reconnu : son compteur repart de zéro. Sinon, l'appareil devient de confiance.
  if (trustedDevice) {
    await resetDeviceFailures(dataSource, trustedDevice.id)
  } else {
    const device = await registerDevice(dataSource, user.id, now)
    setCookie(event, getDeviceCookieName(auth), signDeviceCookie(device, deviceSecret), buildDeviceCookieOptions(auth))
  }

  logger.info(LOG_EVENT.AUTH_LOGIN_SUCCEEDED, { requestId: event.context.requestId, userId: user.id, trustedDevice: trustedDevice !== null })
  return loadMe(dataSource, user.id)
})

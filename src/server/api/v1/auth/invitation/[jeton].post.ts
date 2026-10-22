import { getCookie, getRouterParam, setCookie, setResponseHeader } from 'h3'
import type { IMe } from '../../../../../interfaces/me.interface'
import { RATE_LIMIT_ROUTE_KEY } from '../../../../../consts/rate-limit.const'
import { acceptInvitationSchema } from '../../../../schemas/invitation.schema'
import { acceptInvitation } from '../../../../../services/invitation.service'
import { notFound } from '../../../../../utils/api-error.util'
import { useDataSource } from '../../../../../utils/database.util'
import { isWellFormedInvitationToken } from '../../../../../utils/invitation-token.util'
import { loadMe } from '../../../../../utils/me.util'
import { assertPasswordHashCapacity } from '../../../../../utils/password.util'
import { enforceRateLimit } from '../../../../../utils/rate-limit.util'
import { revokeSessionByToken } from '../../../../../utils/session-store.util'
import { buildSessionCookieOptions, getSessionCookieName, isWellFormedSessionToken } from '../../../../../utils/session-token.util'
import { readBodyWithSchema } from '../../../../../utils/validation.util'

/**
 * POST /api/v1/auth/invitation/{jeton} (public, jeton valide) : définit le mot de passe, complète le profil,
 * consomme le jeton et ouvre une session. 404 jeton inconnu, 410 expiré ou consommé. Pas d'avatar (B-16).
 */
export default defineEventHandler(async (event): Promise<IMe> => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  enforceRateLimit(event, RATE_LIMIT_ROUTE_KEY.INVITATION_TOKEN)
  const token = getRouterParam(event, 'jeton')
  if (!isWellFormedInvitationToken(token)) {
    throw notFound()
  }
  const body = await readBodyWithSchema(event, acceptInvitationSchema)
  // Saturation de scrypt : 503 avant d'ouvrir la moindre transaction (le 503 remonte tel quel).
  assertPasswordHashCapacity()
  const dataSource = await useDataSource()

  const accepted = await acceptInvitation(dataSource, token, body)

  // Rotation, comme au login : une session présentée avec la requête est révoquée, le jeton émis est neuf.
  const { auth } = useRuntimeConfig()
  const previousToken = getCookie(event, getSessionCookieName(auth))
  if (isWellFormedSessionToken(previousToken)) {
    await revokeSessionByToken(dataSource, previousToken)
  }
  setCookie(event, getSessionCookieName(auth), accepted.sessionToken, buildSessionCookieOptions(auth))
  return loadMe(dataSource, accepted.userId)
})

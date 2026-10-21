import type { USER_ROLE } from '../../shared/enums/user.enum'

/** Identité résolue par `server/middleware/auth.ts` et posée sur `event.context.user`. */
export interface IAuthUser {
  id: string
  email: string
  role: USER_ROLE
  competitorId: string | null
  sessionId: string
}

export interface ISessionCookieOptions {
  httpOnly: true
  secure: boolean
  sameSite: 'lax'
  path: '/'
  maxAge: number
}

export interface ICrossSiteInput {
  method: string
  origin: string | undefined
  secFetchSite: string | undefined
  ownOrigin: string
  allowedOrigins: string[]
}

/** Changements de `PATCH /moi` appliqués ensemble par `applyProfileChanges`. */
export interface IProfileChanges {
  userId: string
  currentSessionId: string
  competitorId: string | null
  avatarUrl?: string | null
  phone?: string | null
  newPasswordHash?: string
}

/** Compteur d'échecs commun au compte et à l'appareil de confiance. */
export interface IThrottleCounters {
  failedLoginCount: number
  throttledUntil: Date | null
}

/** Contenu signé du cookie d'appareil : compte, nonce (identifiant de l'appareil), expiration en secondes epoch. */
export interface IDeviceCookiePayload {
  userId: string
  nonce: string
  expiresAt: number
}


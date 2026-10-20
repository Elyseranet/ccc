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

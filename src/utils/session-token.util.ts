import { createHash, randomBytes } from 'node:crypto'
import { SESSION_COOKIE_NAME, SESSION_COOKIE_NAME_PRODUCTION, SESSION_TOKEN_BYTES, SESSION_ABSOLUTE_TIMEOUT_SECONDS, SESSION_TOKEN_PATTERN } from '../consts/auth.const.js'
import type { IAuthCookieConfig, ISessionCookieOptions } from '../interfaces/auth.interface.js'
import { resolveSecureCookie } from './cookie-config.util.js'

export const hashSessionToken = (token: string): string => createHash('sha256').update(token).digest('hex')

export const generateSessionToken = (): { token: string, tokenHash: string } => {
  const token = randomBytes(SESSION_TOKEN_BYTES).toString('base64url')
  return { token, tokenHash: hashSessionToken(token) }
}

/** Un cookie mal formé est écarté avant toute requête en base. */
export const isWellFormedSessionToken = (token: string | undefined): token is string =>
  token !== undefined && SESSION_TOKEN_PATTERN.test(token)

/** `auth` = `useRuntimeConfig().auth` : `Secure` suit `auth.secureCookie`, pas `NODE_ENV` (L3). */
export const buildSessionCookieOptions = (auth: IAuthCookieConfig | undefined, maxAge = SESSION_ABSOLUTE_TIMEOUT_SECONDS): ISessionCookieOptions => ({
  httpOnly: true,
  secure: resolveSecureCookie(auth),
  sameSite: 'lax',
  path: '/',
  maxAge
})

export const getSessionCookieName = (auth: IAuthCookieConfig | undefined): string =>
  resolveSecureCookie(auth) ? SESSION_COOKIE_NAME_PRODUCTION : SESSION_COOKIE_NAME

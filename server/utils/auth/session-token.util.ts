import { createHash, randomBytes } from 'node:crypto'
import { SESSION_COOKIE_NAME, SESSION_COOKIE_NAME_PRODUCTION, SESSION_TOKEN_BYTES, SESSION_TTL_SECONDS } from '../../consts/auth.const'
import type { ISessionCookieOptions } from '../../interfaces/auth.interface'

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/

export const hashSessionToken = (token: string): string => createHash('sha256').update(token).digest('hex')

export const generateSessionToken = (): { token: string, tokenHash: string } => {
  const token = randomBytes(SESSION_TOKEN_BYTES).toString('base64url')
  return { token, tokenHash: hashSessionToken(token) }
}

/** Un cookie mal formé est écarté avant toute requête en base. */
export const isWellFormedSessionToken = (token: string | undefined): token is string =>
  token !== undefined && TOKEN_PATTERN.test(token)

export const buildSessionCookieOptions = (isProduction: boolean, maxAge = SESSION_TTL_SECONDS): ISessionCookieOptions => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
  maxAge
})


export const getSessionCookieName = (isProduction: boolean): string =>
  isProduction ? SESSION_COOKIE_NAME_PRODUCTION : SESSION_COOKIE_NAME

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { DEVICE_COOKIE_NAME, DEVICE_COOKIE_NAME_PRODUCTION, DEVICE_COOKIE_SEPARATOR, DEVICE_COOKIE_TTL_SECONDS, DEVICE_NONCE_BYTES, DEVICE_SECRET_MIN_LENGTH, DEVICE_NONCE_PATTERN, DEVICE_USER_ID_PATTERN } from '../consts/auth.const.js'
import { PRODUCTION_NODE_ENV } from '../consts/node-env.const.js'
import type { IAuthCookieConfig, IDeviceCookiePayload, ISessionCookieOptions } from '../interfaces/auth.interface.js'
import { resolveSecureCookie } from './cookie-config.util.js'

let ephemeralSecret: string | undefined

/**
 * Secret HMAC. En production, un secret absent ou trop court empêche le démarrage (le message nomme la
 * variable, jamais sa valeur). Hors production, un secret aléatoire propre au processus sert de repli :
 * les cookies d'appareil ne survivent alors pas à un redémarrage, ce qui est sans conséquence en développement.
 */
export const resolveDeviceCookieSecret = (configured: string, nodeEnv: string | undefined = process.env.NODE_ENV): string => {
  if (configured.length >= DEVICE_SECRET_MIN_LENGTH) {
    return configured
  }
  if (nodeEnv === PRODUCTION_NODE_ENV) {
    throw new Error(`NUXT_AUTH_DEVICE_COOKIE_SECRET is required in production (at least ${DEVICE_SECRET_MIN_LENGTH} characters)`)
  }
  ephemeralSecret ??= randomBytes(DEVICE_SECRET_MIN_LENGTH).toString('hex')
  return ephemeralSecret
}

const sign = (body: string, secret: string): Buffer => createHmac('sha256', secret).update(body).digest()

export const generateDeviceNonce = (): string => randomBytes(DEVICE_NONCE_BYTES).toString('hex')

/** Format : `base64url(JSON{u,n,e}).base64url(HMAC-SHA256)`. */
export const signDeviceCookie = (payload: IDeviceCookiePayload, secret: string): string => {
  const body = Buffer.from(JSON.stringify({ u: payload.userId, n: payload.nonce, e: payload.expiresAt })).toString('base64url')
  return `${body}${DEVICE_COOKIE_SEPARATOR}${sign(body, secret).toString('base64url')}`
}

/** Signature, forme et expiration vérifiées ; sinon `null` (l'appareil est alors « non reconnu »). */
export const verifyDeviceCookie = (value: string | undefined, secret: string, nowSeconds: number): IDeviceCookiePayload | null => {
  if (!value) {
    return null
  }
  const parts = value.split(DEVICE_COOKIE_SEPARATOR)
  if (parts.length !== 2) {
    return null
  }
  const [body, signature] = parts as [string, string]
  const given = Buffer.from(signature, 'base64url')
  const expected = sign(body, secret)
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return null
  }
  try {
    const parsed = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as { u?: unknown, n?: unknown, e?: unknown }
    if (
      typeof parsed.u !== 'string' || !DEVICE_USER_ID_PATTERN.test(parsed.u)
      || typeof parsed.n !== 'string' || !DEVICE_NONCE_PATTERN.test(parsed.n)
      || typeof parsed.e !== 'number' || !Number.isFinite(parsed.e) || parsed.e <= nowSeconds
    ) {
      return null
    }
    return { userId: parsed.u, nonce: parsed.n, expiresAt: parsed.e }
  } catch {
    return null
  }
}

export const getDeviceCookieName = (auth: IAuthCookieConfig | undefined): string =>
  resolveSecureCookie(auth) ? DEVICE_COOKIE_NAME_PRODUCTION : DEVICE_COOKIE_NAME

export const buildDeviceCookieOptions = (auth: IAuthCookieConfig | undefined): ISessionCookieOptions => ({
  httpOnly: true,
  secure: resolveSecureCookie(auth),
  sameSite: 'lax',
  path: '/',
  maxAge: DEVICE_COOKIE_TTL_SECONDS
})

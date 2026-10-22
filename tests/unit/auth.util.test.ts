import { describe, expect, it } from 'vitest'
import { LOGIN_DELAY_MAX_SECONDS, PASSWORD_MIN_LENGTH } from '../../src/consts/auth.const'
import {
  buildDeviceCookieOptions,
  generateDeviceNonce,
  getDeviceCookieName,
  resolveDeviceCookieSecret,
  signDeviceCookie,
  verifyDeviceCookie
} from '../../src/utils/device-cookie.util'
import { computeLoginDelaySeconds, remainingThrottleSeconds } from '../../src/utils/login-throttle.util'
import { loginSchema, updateMeSchema } from '../../src/server/schemas/auth.schema'
import { isCrossSiteWrite, parseAllowedOrigins } from '../../src/utils/csrf.util'
import { burnPasswordCheck, hashPassword, verifyPassword } from '../../src/utils/password.util'
import {
  buildSessionCookieOptions,
  getSessionCookieName,
  generateSessionToken,
  hashSessionToken,
  isWellFormedSessionToken
} from '../../src/utils/session-token.util'
import type { H3Event } from 'h3'
import { USER_ROLE } from '../../src/enums/user.enum'
import { requireRole, requireUser } from '../../src/utils/require-role.util'
import { normalizeEmail } from '../../src/utils/email.util'

const OWN = 'https://ccc.example'

const SECURE = { secureCookie: true }
const INSECURE = { secureCookie: false }

describe('login throttle delay (SEC-A2)', () => {
  it('has no delay up to 5 failures', () => {
    for (const failures of [0, 1, 2, 3, 4, 5]) {
      expect(computeLoginDelaySeconds(failures)).toBe(0)
    }
  })

  it('grows as 2^(failures - 5) seconds beyond 5', () => {
    expect([6, 7, 8, 9, 10, 11].map(computeLoginDelaySeconds)).toEqual([2, 4, 8, 16, 32, 64])
  })

  it('is capped at 300 s and never exceeds it, however many failures', () => {
    expect(computeLoginDelaySeconds(13)).toBe(256)
    expect(computeLoginDelaySeconds(14)).toBe(LOGIN_DELAY_MAX_SECONDS)
    for (const failures of [15, 50, 1000, 1_000_000]) {
      expect(computeLoginDelaySeconds(failures)).toBe(LOGIN_DELAY_MAX_SECONDS)
    }
    expect(LOGIN_DELAY_MAX_SECONDS).toBe(300)
  })

  it('reports the remaining delay with an injected clock', () => {
    const now = new Date('2026-10-20T10:00:00Z')
    expect(remainingThrottleSeconds(null, now)).toBe(0)
    expect(remainingThrottleSeconds(new Date(now.getTime() - 1), now)).toBe(0)
    expect(remainingThrottleSeconds(new Date(now.getTime() + 1500), now)).toBe(2)
  })
})

describe('password hashing (scrypt)', () => {
  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await hashPassword('correct horse battery')
    expect(await verifyPassword('correct horse battery', hash)).toBe(true)
    expect(await verifyPassword('correct horse batterz', hash)).toBe(false)
  })

  it('salts: the same password never gives the same hash', async () => {
    expect(await hashPassword('same-password-1')).not.toBe(await hashPassword('same-password-1'))
  })

  it('does not contain the clear password and stores its parameters', async () => {
    const hash = await hashPassword('visible-secret-1')
    expect(hash).not.toContain('visible-secret-1')
    expect(hash.split('$').slice(0, 4)).toEqual(['scrypt', '65536', '8', '2'])
  })

  it('answers false (never throws) on a missing or malformed hash', async () => {
    expect(await verifyPassword('x', null)).toBe(false)
    expect(await verifyPassword('x', '')).toBe(false)
    expect(await verifyPassword('x', 'bcrypt$1$2$3$4$5')).toBe(false)
    expect(await verifyPassword('x', 'scrypt$a$b$c$d$e')).toBe(false)
  })

  it('burnPasswordCheck resolves without result', async () => {
    await expect(burnPasswordCheck('whatever')).resolves.toBeUndefined()
  })
})

describe('session token', () => {
  it('generates distinct 256-bit url-safe tokens and stores only their SHA-256', () => {
    const first = generateSessionToken()
    const second = generateSessionToken()
    expect(first.token).not.toBe(second.token)
    expect(isWellFormedSessionToken(first.token)).toBe(true)
    expect(first.tokenHash).toMatch(/^[0-9a-f]{64}$/)
    expect(first.tokenHash).toBe(hashSessionToken(first.token))
    expect(first.tokenHash).not.toContain(first.token)
  })

  it('rejects malformed tokens before any database access', () => {
    expect(isWellFormedSessionToken(undefined)).toBe(false)
    expect(isWellFormedSessionToken('short')).toBe(false)
    expect(isWellFormedSessionToken(`${'a'.repeat(42)}!`)).toBe(false)
  })

  it('cookie: HttpOnly, SameSite=Lax, Path=/, Secure follows auth.secureCookie', () => {
    expect(buildSessionCookieOptions(SECURE)).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/', secure: true })
    expect(buildSessionCookieOptions(INSECURE)).toMatchObject({ httpOnly: true, sameSite: 'lax', secure: false })
  })
})

describe('CSRF origin check', () => {
  const base = { secFetchSite: undefined, ownOrigin: OWN, allowedOrigins: [] as string[] }

  it('never blocks safe methods', () => {
    expect(isCrossSiteWrite({ ...base, method: 'GET', origin: 'https://evil.test' })).toBe(false)
  })

  it('blocks a write from a foreign Origin, allows own and configured origins', () => {
    expect(isCrossSiteWrite({ ...base, method: 'POST', origin: 'https://evil.test' })).toBe(true)
    expect(isCrossSiteWrite({ ...base, method: 'PATCH', origin: OWN })).toBe(false)
    expect(isCrossSiteWrite({ ...base, method: 'DELETE', origin: 'https://app.test', allowedOrigins: ['https://app.test'] })).toBe(false)
  })

  it('falls back on Sec-Fetch-Site when Origin is absent', () => {
    expect(isCrossSiteWrite({ ...base, method: 'POST', origin: undefined, secFetchSite: 'cross-site' })).toBe(true)
    expect(isCrossSiteWrite({ ...base, method: 'POST', origin: undefined, secFetchSite: 'same-origin' })).toBe(false)
  })

  it('lets non-browser clients (no Origin, no Sec-Fetch-Site) through', () => {
    expect(isCrossSiteWrite({ ...base, method: 'POST', origin: undefined })).toBe(false)
  })

  it('parses the allowed-origins list', () => {
    expect(parseAllowedOrigins(' https://a.test/ , ,https://b.test')).toEqual(['https://a.test', 'https://b.test'])
    expect(parseAllowedOrigins('')).toEqual([])
  })
})

describe('schemas', () => {
  it('normalizes emails', () => {
    expect(normalizeEmail('  Foo@Bar.TEST ')).toBe('foo@bar.test')
  })

  it('login refuses unknown fields', () => {
    expect(loginSchema.safeParse({ email: 'a@b.c', password: 'x', role: 'ADMIN' }).success).toBe(false)
  })

  it.each(['role', 'email', 'nickname', 'displayName', 'firstName', 'id'])('PATCH /moi refuses %s (A4 whitelist)', (field) => {
    expect(updateMeSchema.safeParse({ phone: '+33 6 12 34 56 78', [field]: 'x' }).success).toBe(false)
  })

  it('PATCH /moi accepts avatar and phone, and null to clear them', () => {
    expect(updateMeSchema.safeParse({ avatarUrl: 'https://img.test/a.png', phone: '+33 6 12 34 56 78' }).success).toBe(true)
    expect(updateMeSchema.safeParse({ avatarUrl: null, phone: null }).success).toBe(true)
  })

  it('PATCH /moi refuses a non-https avatar or one with credentials, a bad phone and an empty body', () => {
    expect(updateMeSchema.safeParse({ avatarUrl: 'javascript:alert(1)' }).success).toBe(false)
    expect(updateMeSchema.safeParse({ avatarUrl: 'http://img.test/a.png' }).success).toBe(false)
    expect(updateMeSchema.safeParse({ avatarUrl: 'https://u:p@img.test/a.png' }).success).toBe(false)
    expect(updateMeSchema.safeParse({ phone: 'call me' }).success).toBe(false)
    expect(updateMeSchema.safeParse({}).success).toBe(false)
  })

  it('PATCH /moi requires both passwords together and a minimum length', () => {
    expect(updateMeSchema.safeParse({ newPassword: 'a'.repeat(PASSWORD_MIN_LENGTH) }).success).toBe(false)
    expect(updateMeSchema.safeParse({ currentPassword: 'old' }).success).toBe(false)
    expect(updateMeSchema.safeParse({ currentPassword: 'old', newPassword: 'a'.repeat(PASSWORD_MIN_LENGTH - 1) }).success).toBe(false)
    expect(updateMeSchema.safeParse({ currentPassword: 'old', newPassword: 'a'.repeat(PASSWORD_MIN_LENGTH) }).success).toBe(true)
  })
})

describe('device cookie (SEC-A4)', () => {
  const SECRET = 'unit-test-device-secret-unit-test-device-secret'
  const NOW = 1_800_000_000
  const userId = '11111111-1111-4111-8111-111111111111'
  const payload = { userId, nonce: generateDeviceNonce(), expiresAt: NOW + 3600 }

  it('round-trips a signed payload bound to the account', () => {
    expect(verifyDeviceCookie(signDeviceCookie(payload, SECRET), SECRET, NOW)).toEqual(payload)
  })

  it('treats a forged signature, a wrong secret or a tampered body as unrecognised', () => {
    const cookie = signDeviceCookie(payload, SECRET)
    expect(verifyDeviceCookie(cookie, 'another-secret-another-secret-another!', NOW)).toBeNull()
    expect(verifyDeviceCookie(`${cookie.split('.')[0]}.${'A'.repeat(43)}`, SECRET, NOW)).toBeNull()
    const forgedBody = Buffer.from(JSON.stringify({ u: '22222222-2222-4222-8222-222222222222', n: payload.nonce, e: payload.expiresAt })).toString('base64url')
    expect(verifyDeviceCookie(`${forgedBody}.${cookie.split('.')[1]}`, SECRET, NOW)).toBeNull()
  })

  it('treats an expired cookie as unrecognised', () => {
    const cookie = signDeviceCookie(payload, SECRET)
    expect(verifyDeviceCookie(cookie, SECRET, payload.expiresAt - 1)).not.toBeNull()
    expect(verifyDeviceCookie(cookie, SECRET, payload.expiresAt)).toBeNull()
  })

  it('treats garbage as unrecognised without throwing', () => {
    for (const value of [undefined, '', 'x', 'a.b.c', '.', 'e30.e30']) {
      expect(verifyDeviceCookie(value, SECRET, NOW)).toBeNull()
    }
  })

  it('requires a 32+ character secret in production and falls back to an ephemeral one elsewhere', () => {
    expect(() => resolveDeviceCookieSecret('', 'production')).toThrow(/NUXT_AUTH_DEVICE_COOKIE_SECRET/)
    expect(() => resolveDeviceCookieSecret('too-short', 'production')).toThrow()
    expect(resolveDeviceCookieSecret(SECRET, 'production')).toBe(SECRET)
    expect(resolveDeviceCookieSecret('', 'development').length).toBeGreaterThanOrEqual(32)
    expect(resolveDeviceCookieSecret('', 'development')).toBe(resolveDeviceCookieSecret('', 'test'))
  })

  it('cookie: __Host- prefix and Secure in production, HttpOnly, SameSite=Lax, 90 days', () => {
    expect(getDeviceCookieName(SECURE)).toBe('__Host-ccc_device')
    expect(getDeviceCookieName(INSECURE)).toBe('ccc_device')
    expect(buildDeviceCookieOptions(SECURE)).toMatchObject({ httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 90 * 24 * 3600 })
    expect(buildDeviceCookieOptions(INSECURE).secure).toBe(false)
  })
})

describe('session cookie name', () => {
  it('uses the __Host- prefix when secureCookie is true', () => {
    expect(getSessionCookieName(SECURE)).toBe('__Host-ccc_session')
    expect(getSessionCookieName(INSECURE)).toBe('ccc_session')
  })

  it('production cookie satisfies the __Host- requirements: Secure, Path=/, no Domain', () => {
    const options = buildSessionCookieOptions(SECURE)
    expect(options).toMatchObject({ secure: true, path: '/' })
    expect(options).not.toHaveProperty('domain')
  })
})

describe('requireRole', () => {
  const eventFor = (role?: USER_ROLE) => ({
    context: role ? { user: { id: 'u', email: 'u@ccc.test', role, competitorId: null, sessionId: 's' } } : {}
  }) as unknown as H3Event

  it('is 401 without identity', () => {
    expect(() => requireRole(eventFor(), USER_ROLE.ADMIN)).toThrowError(expect.objectContaining({ statusCode: 401 }))
  })

  it('is 403 for a participant on an admin guard', () => {
    expect(() => requireRole(eventFor(USER_ROLE.PARTICIPANT), USER_ROLE.ADMIN)).toThrowError(expect.objectContaining({ statusCode: 403 }))
  })

  it('lets an admin through and returns the identity', () => {
    expect(requireRole(eventFor(USER_ROLE.ADMIN), USER_ROLE.ADMIN).role).toBe(USER_ROLE.ADMIN)
  })

  it('requireUser accepts any authenticated role', () => {
    expect(requireUser(eventFor(USER_ROLE.PARTICIPANT)).role).toBe(USER_ROLE.PARTICIPANT)
  })
})

import { describe, expect, it } from 'vitest'
import { PASSWORD_MIN_LENGTH } from '../../server/consts/auth.const'
import { loginSchema, updateMeSchema } from '../../server/schemas/auth.schema'
import { isCrossSiteWrite, parseAllowedOrigins } from '../../server/utils/auth/csrf.util'
import { burnPasswordCheck, hashPassword, verifyPassword } from '../../server/utils/auth/password.util'
import {
  buildSessionCookieOptions,
  generateSessionToken,
  hashSessionToken,
  isWellFormedSessionToken
} from '../../server/utils/auth/session-token.util'
import { normalizeEmail } from '../../shared/utils/email.util'

const OWN = 'https://ccc.example'

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

  it('cookie: HttpOnly, SameSite=Lax, Path=/, Secure only in production', () => {
    expect(buildSessionCookieOptions(true)).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/', secure: true })
    expect(buildSessionCookieOptions(false)).toMatchObject({ httpOnly: true, sameSite: 'lax', secure: false })
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

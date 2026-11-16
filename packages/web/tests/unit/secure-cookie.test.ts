import { describe, expect, it } from 'vitest'
import { resolveSecureCookie } from '../../src/utils/cookie-config.util'
import { buildDeviceCookieOptions, getDeviceCookieName } from '../../src/utils/device-cookie.util'
import { buildSessionCookieOptions, getSessionCookieName } from '../../src/utils/session-token.util'

describe('L3: secureCookie option drives Secure and the __Host- prefix', () => {
  it.each([undefined, true, 'true', '1', '', 'yes', null, 0])('is true (fail safe) for %j', (value) => {
    expect(resolveSecureCookie({ secureCookie: value })).toBe(true)
  })

  it('is true without any config', () => {
    expect(resolveSecureCookie(undefined)).toBe(true)
  })

  it.each([false, 'false', 'FALSE', ' false ', '0'])('is false only for explicit %j', (value) => {
    expect(resolveSecureCookie({ secureCookie: value })).toBe(false)
  })

  it('option true: __Host-, Secure, Path=/, no Domain (session and device)', () => {
    const auth = { secureCookie: true }
    expect(getSessionCookieName(auth)).toBe('__Host-ccc_session')
    expect(getDeviceCookieName(auth)).toBe('__Host-ccc_device')
    for (const options of [buildSessionCookieOptions(auth), buildDeviceCookieOptions(auth)]) {
      expect(options).toMatchObject({ secure: true, path: '/', httpOnly: true })
      expect(options).not.toHaveProperty('domain')
    }
  })

  it('option false: neither Secure nor __Host- (session and device)', () => {
    const auth = { secureCookie: false }
    expect(getSessionCookieName(auth)).toBe('ccc_session')
    expect(getDeviceCookieName(auth)).toBe('ccc_device')
    expect(buildSessionCookieOptions(auth).secure).toBe(false)
    expect(buildDeviceCookieOptions(auth).secure).toBe(false)
  })

  it('does not depend on NODE_ENV', () => {
    const previous = process.env.NODE_ENV
    try {
      for (const env of ['production', 'development', 'test']) {
        process.env.NODE_ENV = env
        expect(getSessionCookieName({ secureCookie: true })).toBe('__Host-ccc_session')
        expect(getSessionCookieName({ secureCookie: false })).toBe('ccc_session')
      }
    } finally {
      process.env.NODE_ENV = previous
    }
  })
})

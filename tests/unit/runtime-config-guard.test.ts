import { describe, expect, it } from 'vitest'
import { DEFAULT_MAIL_FROM, DEFAULT_MAIL_HOST, DEFAULT_MAIL_TRANSPORT, DEFAULT_SITE_URL } from '../../src/consts/runtime-config.const'
import { assertStrictRuntimeConfig, isStrictRuntimeConfig } from '../../src/utils/runtime-config-guard.util'

interface IPatch {
  siteUrl?: unknown
  transport?: unknown
  host?: unknown
  from?: unknown
  strict?: unknown
  secureCookie?: unknown
  deviceSecret?: unknown
  productionImage?: boolean
}

const SECRET = 's'.repeat(32)

const configWith = (patch: IPatch = {}) => ({
  strictRuntimeConfig: 'strict' in patch ? patch.strict : true,
  productionImage: patch.productionImage,
  public: { siteUrl: 'siteUrl' in patch ? patch.siteUrl : 'https://ccc.example.org' },
  mail: {
    transport: 'transport' in patch ? patch.transport : 'smtp',
    host: 'host' in patch ? patch.host : 'smtp.example.org',
    from: 'from' in patch ? patch.from : 'CCC <no-reply@ccc.example.org>'
  },
  auth: {
    secureCookie: 'secureCookie' in patch ? patch.secureCookie : true,
    deviceCookieSecret: 'deviceSecret' in patch ? patch.deviceSecret : SECRET
  }
})

describe('assertStrictRuntimeConfig (PROD-1, T-SEC-06, T-SEC-12)', () => {
  it('accepts a valid production configuration, without SMTP credentials', () => {
    expect(() => assertStrictRuntimeConfig(configWith())).not.toThrow()
    expect(() => assertStrictRuntimeConfig(configWith({ productionImage: true }))).not.toThrow()
  })

  it.each([
    ['http site URL', { siteUrl: 'http://ccc.example.org' }, 'NUXT_PUBLIC_SITE_URL'],
    ['localhost site URL', { siteUrl: 'https://localhost' }, 'NUXT_PUBLIC_SITE_URL'],
    ['LOCALHOST site URL, any case, with port', { siteUrl: 'https://LocalHost:3000' }, 'NUXT_PUBLIC_SITE_URL'],
    ['127.0.0.1 site URL', { siteUrl: 'https://127.0.0.1' }, 'NUXT_PUBLIC_SITE_URL'],
    ['[::1] site URL', { siteUrl: 'https://[::1]:3000' }, 'NUXT_PUBLIC_SITE_URL'],
    ['0.0.0.0 site URL', { siteUrl: 'https://0.0.0.0' }, 'NUXT_PUBLIC_SITE_URL'],
    ['*.localhost site URL', { siteUrl: 'https://ccc.localhost' }, 'NUXT_PUBLIC_SITE_URL'],
    ['default site URL', { siteUrl: DEFAULT_SITE_URL }, 'NUXT_PUBLIC_SITE_URL'],
    ['unparsable site URL', { siteUrl: 'not a url' }, 'NUXT_PUBLIC_SITE_URL'],
    ['empty site URL', { siteUrl: '' }, 'NUXT_PUBLIC_SITE_URL'],
    ['capture transport', { transport: 'capture' }, 'NUXT_MAIL_TRANSPORT'],
    ['missing transport', { transport: undefined }, 'NUXT_MAIL_TRANSPORT'],
    ['localhost SMTP host', { host: 'localhost' }, 'NUXT_MAIL_HOST'],
    ['127.0.0.1 SMTP host', { host: '127.0.0.1' }, 'NUXT_MAIL_HOST'],
    ['::1 SMTP host', { host: '::1' }, 'NUXT_MAIL_HOST'],
    ['[::1] SMTP host', { host: '[::1]' }, 'NUXT_MAIL_HOST'],
    ['0.0.0.0 SMTP host', { host: '0.0.0.0' }, 'NUXT_MAIL_HOST'],
    ['*.localhost SMTP host', { host: 'smtp.localhost' }, 'NUXT_MAIL_HOST'],
    ['SMTP service name without a dot', { host: 'mailpit' }, 'NUXT_MAIL_HOST'],
    ['default SMTP host', { host: DEFAULT_MAIL_HOST }, 'NUXT_MAIL_HOST'],
    ['empty SMTP host', { host: ' ' }, 'NUXT_MAIL_HOST'],
    ['empty sender', { from: '' }, 'NUXT_MAIL_FROM'],
    ['blank sender', { from: '   ' }, 'NUXT_MAIL_FROM'],
    ['default sender', { from: DEFAULT_MAIL_FROM }, 'NUXT_MAIL_FROM'],
    ['default sender address alone', { from: 'no-reply@ccc.local' }, 'NUXT_MAIL_FROM'],
    ['cookies without Secure (boolean)', { secureCookie: false }, 'NUXT_AUTH_SECURE_COOKIE'],
    ['cookies without Secure (string false)', { secureCookie: 'false' }, 'NUXT_AUTH_SECURE_COOKIE'],
    ['cookies without Secure (string 0)', { secureCookie: '0' }, 'NUXT_AUTH_SECURE_COOKIE'],
    ['missing device cookie secret', { deviceSecret: '' }, 'NUXT_AUTH_DEVICE_COOKIE_SECRET'],
    ['undefined device cookie secret', { deviceSecret: undefined }, 'NUXT_AUTH_DEVICE_COOKIE_SECRET'],
    ['too short device cookie secret', { deviceSecret: 's'.repeat(31) }, 'NUXT_AUTH_DEVICE_COOKIE_SECRET']
  ] as Array<[string, IPatch, string]>)('refuses %s, naming the variable', (_label, patch, variable) => {
    expect(() => assertStrictRuntimeConfig(configWith(patch))).toThrow(variable)
  })

  it('accepts a 32 character device cookie secret and an IPv6-free fully qualified SMTP host', () => {
    expect(() => assertStrictRuntimeConfig(configWith({ deviceSecret: 's'.repeat(32), host: 'relay.mail.example.org' }))).not.toThrow()
  })

  it('refuses the nuxt.config defaults as a whole and names every faulty variable', () => {
    const defaults = {
      strictRuntimeConfig: true,
      public: { siteUrl: DEFAULT_SITE_URL },
      mail: { transport: DEFAULT_MAIL_TRANSPORT, host: DEFAULT_MAIL_HOST, from: DEFAULT_MAIL_FROM },
      auth: { secureCookie: true, deviceCookieSecret: '' }
    }
    expect(() => assertStrictRuntimeConfig(defaults)).toThrow(/NUXT_PUBLIC_SITE_URL.*NUXT_MAIL_HOST.*NUXT_MAIL_FROM.*NUXT_AUTH_DEVICE_COOKIE_SECRET/)
  })

  it('never puts a configured value in the message', () => {
    const secrets = { siteUrl: 'http://user:s3cret-pass@internal.example.org', host: 'mailpit-s3cret', from: '', transport: 'capture-s3cret', deviceSecret: 'short-s3cret' }
    try {
      assertStrictRuntimeConfig(configWith(secrets))
      expect.unreachable()
    } catch (error) {
      const message = (error as Error).message
      expect(message).not.toContain('s3cret')
      expect(message).not.toContain('internal.example.org')
      expect(message).toContain('NUXT_MAIL_TRANSPORT')
      expect(message).toContain('NUXT_AUTH_DEVICE_COOKIE_SECRET')
    }
  })

  it('does nothing without the flag outside the production image, whatever the configuration', () => {
    const local = configWith({ siteUrl: DEFAULT_SITE_URL, transport: 'capture', host: 'localhost', from: '', secureCookie: false, deviceSecret: '' })
    for (const strict of [undefined, null, false, 'false', 'FALSE', '0', '', ' ']) {
      expect(() => assertStrictRuntimeConfig({ ...local, strictRuntimeConfig: strict })).not.toThrow()
    }
    expect(() => assertStrictRuntimeConfig({})).not.toThrow()
  })

  it('treats any other flag value as on (fail closed)', () => {
    const local = configWith({ siteUrl: DEFAULT_SITE_URL })
    for (const strict of [true, 'true', 'TRUE', '1', 'yes', 'on', 1]) {
      expect(isStrictRuntimeConfig(strict), String(strict)).toBe(true)
      expect(() => assertStrictRuntimeConfig({ ...local, strictRuntimeConfig: strict })).toThrow('NUXT_PUBLIC_SITE_URL')
    }
  })
})

describe('production image marker (T-SEC-06, Q1)', () => {
  const lenientLocal = { siteUrl: DEFAULT_SITE_URL, host: 'localhost', from: '', deviceSecret: '' }

  it('marker absent, flag on: the strict checks apply', () => {
    expect(() => assertStrictRuntimeConfig(configWith({ ...lenientLocal, productionImage: false }))).toThrow('NUXT_PUBLIC_SITE_URL')
  })

  it('marker absent, flag off: nothing is checked (development, API test build)', () => {
    expect(() => assertStrictRuntimeConfig(configWith({ ...lenientLocal, strict: false, productionImage: false }))).not.toThrow()
    expect(() => assertStrictRuntimeConfig(configWith({ ...lenientLocal, strict: undefined }))).not.toThrow()
  })

  it('marker present, flag on: the strict checks apply', () => {
    expect(() => assertStrictRuntimeConfig(configWith({ ...lenientLocal, productionImage: true }))).toThrow('NUXT_PUBLIC_SITE_URL')
    expect(() => assertStrictRuntimeConfig(configWith({ productionImage: true }))).not.toThrow()
  })

  it.each([false, 'false', 'FALSE', '0', '', ' ', undefined, null])('marker present, flag off (%j): refuses to start, naming the variable only', (strict) => {
    const call = () => assertStrictRuntimeConfig(configWith({ strict, productionImage: true }))
    expect(call).toThrow('NUXT_STRICT_RUNTIME_CONFIG cannot be turned off in the production image')
  })
})

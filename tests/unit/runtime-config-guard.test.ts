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
    ['localhost. (trailing dot) site URL', { siteUrl: 'https://localhost.' }, 'NUXT_PUBLIC_SITE_URL'],
    ['a.localhost. (trailing dot) site URL', { siteUrl: 'https://a.localhost.' }, 'NUXT_PUBLIC_SITE_URL'],
    ['[::ffff:127.0.0.1] site URL', { siteUrl: 'https://[::ffff:127.0.0.1]' }, 'NUXT_PUBLIC_SITE_URL'],
    ['[::ffff:7f00:1] site URL', { siteUrl: 'https://[::ffff:7f00:1]' }, 'NUXT_PUBLIC_SITE_URL'],
    ['[0:0:0:0:0:ffff:7f00:1] site URL', { siteUrl: 'https://[0:0:0:0:0:ffff:7f00:1]' }, 'NUXT_PUBLIC_SITE_URL'],
    ['[::] site URL', { siteUrl: 'https://[::]' }, 'NUXT_PUBLIC_SITE_URL'],
    ['127.0.0.2 site URL (127.0.0.0/8)', { siteUrl: 'https://127.0.0.2' }, 'NUXT_PUBLIC_SITE_URL'],
    ['127.255.255.254 site URL', { siteUrl: 'https://127.255.255.254' }, 'NUXT_PUBLIC_SITE_URL'],
    ['127.1 shorthand site URL', { siteUrl: 'https://127.1' }, 'NUXT_PUBLIC_SITE_URL'],
    ['decimal 2130706433 site URL', { siteUrl: 'https://2130706433' }, 'NUXT_PUBLIC_SITE_URL'],
    ['LOCALHOST. mixed case site URL', { siteUrl: 'https://LocalHost.' }, 'NUXT_PUBLIC_SITE_URL'],
    ['10.0.0.1 private site URL (10/8)', { siteUrl: 'https://10.0.0.1' }, 'NUXT_PUBLIC_SITE_URL'],
    ['10.255.255.254 private site URL', { siteUrl: 'https://10.255.255.254' }, 'NUXT_PUBLIC_SITE_URL'],
    ['172.16.0.1 private site URL (172.16/12)', { siteUrl: 'https://172.16.0.1' }, 'NUXT_PUBLIC_SITE_URL'],
    ['172.31.255.254 private site URL', { siteUrl: 'https://172.31.255.254' }, 'NUXT_PUBLIC_SITE_URL'],
    ['192.168.1.10 private site URL (192.168/16)', { siteUrl: 'https://192.168.1.10' }, 'NUXT_PUBLIC_SITE_URL'],
    ['169.254.169.254 link-local site URL (169.254/16)', { siteUrl: 'https://169.254.169.254' }, 'NUXT_PUBLIC_SITE_URL'],
    ['[fd00::25] unique-local site URL (fc00::/7)', { siteUrl: 'https://[fd00::25]' }, 'NUXT_PUBLIC_SITE_URL'],
    ['[fc00::1] unique-local site URL', { siteUrl: 'https://[fc00::1]' }, 'NUXT_PUBLIC_SITE_URL'],
    ['[fe80::1] link-local site URL (fe80::/10)', { siteUrl: 'https://[fe80::1]' }, 'NUXT_PUBLIC_SITE_URL'],
    ['[febf::1] link-local site URL (top of fe80::/10)', { siteUrl: 'https://[febf::1]' }, 'NUXT_PUBLIC_SITE_URL'],
    ['[::ffff:10.0.0.1] mapped private site URL', { siteUrl: 'https://[::ffff:10.0.0.1]' }, 'NUXT_PUBLIC_SITE_URL'],
    ['[::ffff:c0a8:101] mapped 192.168.1.1 site URL', { siteUrl: 'https://[::ffff:c0a8:101]' }, 'NUXT_PUBLIC_SITE_URL'],
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
    ['localhost. (trailing dot) SMTP host', { host: 'localhost.' }, 'NUXT_MAIL_HOST'],
    ['a.localhost. (trailing dot) SMTP host', { host: 'a.localhost.' }, 'NUXT_MAIL_HOST'],
    ['[::ffff:127.0.0.1] SMTP host', { host: '[::ffff:127.0.0.1]' }, 'NUXT_MAIL_HOST'],
    ['::ffff:7f00:1 SMTP host (no brackets)', { host: '::ffff:7f00:1' }, 'NUXT_MAIL_HOST'],
    ['[::] SMTP host', { host: '[::]' }, 'NUXT_MAIL_HOST'],
    ['127.0.0.2 SMTP host', { host: '127.0.0.2' }, 'NUXT_MAIL_HOST'],
    ['LOCALHOST SMTP host with a port', { host: 'LocalHost:1025' }, 'NUXT_MAIL_HOST'],
    ['dotless service name with a trailing dot', { host: 'mailpit.' }, 'NUXT_MAIL_HOST'],
    ['unparsable SMTP host', { host: 'bad host' }, 'NUXT_MAIL_HOST'],
    ['SMTP service name without a dot', { host: 'mailpit' }, 'NUXT_MAIL_HOST'],
    ['default SMTP host', { host: DEFAULT_MAIL_HOST }, 'NUXT_MAIL_HOST'],
    ['empty SMTP host', { host: ' ' }, 'NUXT_MAIL_HOST'],
    ['empty sender', { from: '' }, 'NUXT_MAIL_FROM'],
    ['blank sender', { from: '   ' }, 'NUXT_MAIL_FROM'],
    ['default sender', { from: DEFAULT_MAIL_FROM }, 'NUXT_MAIL_FROM'],
    ['default sender address alone', { from: 'no-reply@ccc.local' }, 'NUXT_MAIL_FROM'],
    ['default sender domain, other local part', { from: 'CCC <admin@ccc.local>' }, 'NUXT_MAIL_FROM'],
    ['default sender domain, upper case', { from: 'CCC <No-Reply@CCC.LOCAL>' }, 'NUXT_MAIL_FROM'],
    ['default sender domain, trailing dot', { from: 'no-reply@ccc.local.' }, 'NUXT_MAIL_FROM'],
    ['cookies without Secure (boolean)', { secureCookie: false }, 'NUXT_AUTH_SECURE_COOKIE'],
    ['cookies without Secure (string false)', { secureCookie: 'false' }, 'NUXT_AUTH_SECURE_COOKIE'],
    ['cookies without Secure (string 0)', { secureCookie: '0' }, 'NUXT_AUTH_SECURE_COOKIE'],
    ['missing device cookie secret', { deviceSecret: '' }, 'NUXT_AUTH_DEVICE_COOKIE_SECRET'],
    ['undefined device cookie secret', { deviceSecret: undefined }, 'NUXT_AUTH_DEVICE_COOKIE_SECRET'],
    ['too short device cookie secret', { deviceSecret: 's'.repeat(31) }, 'NUXT_AUTH_DEVICE_COOKIE_SECRET']
  ] as Array<[string, IPatch, string]>)('refuses %s, naming the variable', (_label, patch, variable) => {
    expect(() => assertStrictRuntimeConfig(configWith(patch))).toThrow(variable)
  })

  it.each([
    ['https://ccc.example.org', {}],
    ['https URL with a port', { siteUrl: 'https://ccc.example.org:8443' }],
    ['https public IPv6 site URL', { siteUrl: 'https://[2001:db8::1]' }],
    ['https public IPv4 site URL', { siteUrl: 'https://203.0.113.10' }],
    ['https URL whose name merely contains localhost', { siteUrl: 'https://notlocalhost.example.org' }],
    ['https URL on 128.0.0.1 (outside 127/8)', { siteUrl: 'https://128.0.0.1' }],
    ['https URL on 172.32.0.1 (just outside 172.16/12)', { siteUrl: 'https://172.32.0.1' }],
    ['https URL on 11.0.0.1 (just outside 10/8)', { siteUrl: 'https://11.0.0.1' }],
    ['https URL on 192.169.0.1 (just outside 192.168/16)', { siteUrl: 'https://192.169.0.1' }],
    ['https URL on [fec0::1] (outside fe80::/10)', { siteUrl: 'https://[fec0::1]' }],
    ['SMTP relay on 10.0.0.25 (private, accepted for SMTP)', { host: '10.0.0.25' }],
    ['SMTP relay on 172.20.0.5', { host: '172.20.0.5' }],
    ['SMTP relay on 192.168.1.25', { host: '192.168.1.25' }],
    ['SMTP relay on fd00::25 (unique-local, accepted for SMTP)', { host: 'fd00::25' }],
    ['SMTP relay on [fd00::25]', { host: '[fd00::25]' }],
    ['SMTP relay on 169.254.1.1 (link-local, accepted for SMTP)', { host: '169.254.1.1' }],
    ['SMTP relay on fe80::1 (link-local, accepted for SMTP)', { host: 'fe80::1' }],
    ['SMTP relay on [::ffff:10.0.0.25] (mapped private)', { host: '[::ffff:10.0.0.25]' }],
    ['smtp.example.org', { host: 'smtp.example.org' }],
    ['SMTP host with a port', { host: 'smtp.example.org:587' }],
    ['SMTP host in upper case', { host: 'SMTP.Example.ORG' }],
    ['SMTP host with a trailing dot', { host: 'smtp.example.org.' }],
    ['public IPv6 SMTP host', { host: '[2001:db8::25]' }],
    ['public IPv6 SMTP host without brackets', { host: '2001:db8::25' }],
    ['public IPv4 SMTP host', { host: '203.0.113.25' }],
    ['sender on a similar domain', { from: 'CCC <no-reply@notccc.local.example.org>' }],
    ['sender whose display name mentions ccc.local', { from: 'ccc.local <no-reply@example.org>' }],
    ['sender on a ccc.local subdomain name inside another domain', { from: 'no-reply@evilccc.local.test' }]
  ] as Array<[string, IPatch]>)('accepts %s', (_label, patch) => {
    expect(() => assertStrictRuntimeConfig(configWith(patch))).not.toThrow()
  })

  it('accepts a 32 character device cookie secret and a fully qualified SMTP host', () => {
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

  it('words the site error as a public https URL, without the value', () => {
    expect(() => assertStrictRuntimeConfig(configWith({ siteUrl: 'https://192.168.7.7' })))
      .toThrow('NUXT_PUBLIC_SITE_URL must be a public https URL (no localhost, private or link-local address)')
    try {
      assertStrictRuntimeConfig(configWith({ siteUrl: 'https://192.168.7.7' }))
    } catch (error) {
      expect((error as Error).message).not.toContain('192.168.7.7')
    }
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

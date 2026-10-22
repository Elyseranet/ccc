import { describe, expect, it } from 'vitest'
import { DEFAULT_MAIL_FROM, DEFAULT_MAIL_HOST, DEFAULT_MAIL_TRANSPORT, DEFAULT_SITE_URL } from '../../src/consts/runtime-config.const'
import { assertStrictRuntimeConfig, isStrictRuntimeConfig } from '../../src/utils/runtime-config-guard.util'

const VALID = {
  strictRuntimeConfig: true,
  public: { siteUrl: 'https://ccc.example.org' },
  mail: { transport: 'smtp', host: 'smtp.example.org', from: 'CCC <no-reply@ccc.example.org>' }
}

const with_ = (patch: { siteUrl?: unknown, transport?: unknown, host?: unknown, from?: unknown, strict?: unknown }) => ({
  strictRuntimeConfig: 'strict' in patch ? patch.strict : VALID.strictRuntimeConfig,
  public: { siteUrl: 'siteUrl' in patch ? patch.siteUrl : VALID.public.siteUrl },
  mail: {
    transport: 'transport' in patch ? patch.transport : VALID.mail.transport,
    host: 'host' in patch ? patch.host : VALID.mail.host,
    from: 'from' in patch ? patch.from : VALID.mail.from
  }
})

describe('assertStrictRuntimeConfig (PROD-1)', () => {
  it('accepts a valid production configuration', () => {
    expect(() => assertStrictRuntimeConfig(VALID)).not.toThrow()
  })

  it.each([
    ['http site URL', { siteUrl: 'http://ccc.example.org' }, 'NUXT_PUBLIC_SITE_URL'],
    ['localhost site URL', { siteUrl: 'https://localhost' }, 'NUXT_PUBLIC_SITE_URL'],
    ['LOCALHOST site URL, any case, with port', { siteUrl: 'https://LocalHost:3000' }, 'NUXT_PUBLIC_SITE_URL'],
    ['127.0.0.1 site URL', { siteUrl: 'https://127.0.0.1' }, 'NUXT_PUBLIC_SITE_URL'],
    ['default site URL', { siteUrl: DEFAULT_SITE_URL }, 'NUXT_PUBLIC_SITE_URL'],
    ['unparsable site URL', { siteUrl: 'not a url' }, 'NUXT_PUBLIC_SITE_URL'],
    ['empty site URL', { siteUrl: '' }, 'NUXT_PUBLIC_SITE_URL'],
    ['capture transport', { transport: 'capture' }, 'NUXT_MAIL_TRANSPORT'],
    ['missing transport', { transport: undefined }, 'NUXT_MAIL_TRANSPORT'],
    ['localhost SMTP host', { host: 'localhost' }, 'NUXT_MAIL_HOST'],
    ['127.0.0.1 SMTP host', { host: '127.0.0.1' }, 'NUXT_MAIL_HOST'],
    ['default SMTP host', { host: DEFAULT_MAIL_HOST }, 'NUXT_MAIL_HOST'],
    ['empty SMTP host', { host: ' ' }, 'NUXT_MAIL_HOST'],
    ['empty sender', { from: '' }, 'NUXT_MAIL_FROM'],
    ['blank sender', { from: '   ' }, 'NUXT_MAIL_FROM']
  ])('refuses %s, naming the variable', (_label, patch, variable) => {
    expect(() => assertStrictRuntimeConfig(with_(patch))).toThrow(variable)
  })

  it('refuses the nuxt.config defaults as a whole and names every faulty variable', () => {
    const defaults = {
      strictRuntimeConfig: true,
      public: { siteUrl: DEFAULT_SITE_URL },
      mail: { transport: DEFAULT_MAIL_TRANSPORT, host: DEFAULT_MAIL_HOST, from: '' }
    }
    expect(() => assertStrictRuntimeConfig(defaults)).toThrow(/NUXT_PUBLIC_SITE_URL.*NUXT_MAIL_HOST.*NUXT_MAIL_FROM/)
  })

  it('never puts a configured value in the message', () => {
    const secrets = { siteUrl: 'http://user:s3cret-pass@internal.example.org', host: 'localhost', from: '', transport: 'capture-s3cret' }
    try {
      assertStrictRuntimeConfig(with_(secrets))
      expect.unreachable()
    } catch (error) {
      const message = (error as Error).message
      expect(message).not.toContain('s3cret')
      expect(message).not.toContain('internal.example.org')
      expect(message).toContain('NUXT_MAIL_TRANSPORT')
    }
  })

  it('does nothing without the flag, whatever the configuration', () => {
    const local = with_({ siteUrl: DEFAULT_SITE_URL, transport: 'capture', host: 'localhost', from: '' })
    for (const strict of [undefined, null, false, 'false', 'FALSE', '0', '', ' ']) {
      expect(() => assertStrictRuntimeConfig({ ...local, strictRuntimeConfig: strict })).not.toThrow()
    }
    expect(() => assertStrictRuntimeConfig({})).not.toThrow()
  })

  it('treats any other flag value as on (fail closed)', () => {
    const local = with_({ siteUrl: DEFAULT_SITE_URL })
    for (const strict of [true, 'true', 'TRUE', '1', 'yes', 'on', 1]) {
      expect(isStrictRuntimeConfig(strict), String(strict)).toBe(true)
      expect(() => assertStrictRuntimeConfig({ ...local, strictRuntimeConfig: strict })).toThrow('NUXT_PUBLIC_SITE_URL')
    }
  })

  it('has no recette bypass: no field of the configuration switches it off other than the flag itself', () => {
    const local = { ...with_({ siteUrl: DEFAULT_SITE_URL }), recette: true, bypass: true, mail: { transport: 'smtp', host: 'localhost', from: DEFAULT_MAIL_FROM } }
    expect(() => assertStrictRuntimeConfig(local)).toThrow()
  })
})

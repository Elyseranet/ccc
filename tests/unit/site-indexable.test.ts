import { describe, expect, it } from 'vitest'
import { DEFAULT_SITE_INDEXABLE } from '../../src/consts/runtime-config.const'
import { isSiteIndexable } from '../../src/utils/site-indexable.util'

describe('isSiteIndexable (T-SEO-01)', () => {
  it('is not indexable by default', () => {
    expect(isSiteIndexable({ public: { siteIndexable: DEFAULT_SITE_INDEXABLE } })).toBe(false)
    expect(isSiteIndexable({})).toBe(false)
    expect(isSiteIndexable({ public: {} })).toBe(false)
  })

  it('is indexable only for true or the string true', () => {
    expect(isSiteIndexable({ public: { siteIndexable: true } })).toBe(true)
    expect(isSiteIndexable({ public: { siteIndexable: 'true' } })).toBe(true)
    expect(isSiteIndexable({ public: { siteIndexable: ' TRUE ' } })).toBe(true)
  })

  it('fails closed on any other value', () => {
    for (const value of [false, 'false', 1, '1', 'yes', 'on', '', null, undefined, 'tru', {}]) {
      expect(isSiteIndexable({ public: { siteIndexable: value } })).toBe(false)
    }
  })
})

import { describe, expect, it } from 'vitest'
import { normalizeIpForRateLimit } from '../../server/utils/ip.util'

describe('normalizeIpForRateLimit', () => {
  it('keeps an IPv4 whole', () => {
    expect(normalizeIpForRateLimit('203.0.113.7')).toBe('203.0.113.7')
  })

  it('keeps an IPv4-mapped IPv6 whole and distinct from other addresses', () => {
    const mapped = normalizeIpForRateLimit('::ffff:203.0.113.7')
    expect(mapped).toBe('::ffff:203.0.113.7')
    expect(mapped).not.toBe(normalizeIpForRateLimit('::ffff:203.0.113.8'))
  })

  it('gives two IPv6 addresses of the same /64 the same key', () => {
    expect(normalizeIpForRateLimit('2001:db8:1:2::1')).toBe(normalizeIpForRateLimit('2001:db8:1:2:ffff:ffff:ffff:ffff'))
    expect(normalizeIpForRateLimit('2001:DB8:0001:2::5')).toBe(normalizeIpForRateLimit('2001:db8:1:2::9'))
  })

  it('gives IPv6 addresses of different /64 different keys', () => {
    expect(normalizeIpForRateLimit('2001:db8:1:2::1')).not.toBe(normalizeIpForRateLimit('2001:db8:1:3::1'))
  })

  it('handles a leading :: compression', () => {
    expect(normalizeIpForRateLimit('::1')).toBe('0:0:0:0::/64')
  })
})

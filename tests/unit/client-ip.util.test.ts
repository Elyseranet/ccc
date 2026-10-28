import { describe, expect, it } from 'vitest'
import { TRUST_PROXY_HOPS_MAX } from '../../src/consts/request.const'
import { assertTrustProxyHops, isTrustedProxyAddress, resolveClientIp } from '../../src/utils/client-ip.util'

const SOCKET = '10.0.0.2'

describe('resolveClientIp (proxy trust policy)', () => {
  it('ignores X-Forwarded-For when no proxy is trusted (default)', () => {
    expect(resolveClientIp(SOCKET, '203.0.113.7', 0)).toBe(SOCKET)
  })

  it('takes the entry appended by the single trusted proxy', () => {
    expect(resolveClientIp(SOCKET, '203.0.113.7', 1)).toBe('203.0.113.7')
  })

  it('ignores what the client forged on the left of the chain', () => {
    expect(resolveClientIp(SOCKET, '198.51.100.1, 203.0.113.7', 1)).toBe('203.0.113.7')
  })

  it('counts hops from the right with two trusted proxies', () => {
    expect(resolveClientIp(SOCKET, '198.51.100.1, 203.0.113.7, 10.0.0.9', 2)).toBe('203.0.113.7')
  })

  it('falls back to the socket address when the chain is shorter than the trusted hops', () => {
    expect(resolveClientIp(SOCKET, '203.0.113.7', 2)).toBe(SOCKET)
    expect(resolveClientIp(SOCKET, undefined, 1)).toBe(SOCKET)
  })

  it('falls back to the socket address when the trusted entry is not an IP', () => {
    expect(resolveClientIp(SOCKET, 'not-an-ip', 1)).toBe(SOCKET)
    expect(resolveClientIp(SOCKET, '203.0.113.7:4321', 1)).toBe(SOCKET)
  })

  it('ignores X-Forwarded-For when the socket is not a private or loopback address (proxy bypassed)', () => {
    expect(resolveClientIp('198.51.100.50', '203.0.113.7', 1)).toBe('198.51.100.50')
  })

  it('accepts an IPv6 client', () => {
    expect(resolveClientIp(SOCKET, '2001:db8::1', 1)).toBe('2001:db8::1')
  })
})

describe('assertTrustProxyHops', () => {
  it('accepts an integer from 0 to the maximum, as number or string', () => {
    expect(assertTrustProxyHops(0)).toBe(0)
    expect(assertTrustProxyHops('1')).toBe(1)
    expect(assertTrustProxyHops(TRUST_PROXY_HOPS_MAX)).toBe(TRUST_PROXY_HOPS_MAX)
  })

  it('refuses a negative, fractional, too large or non numeric value, naming the setting only', () => {
    for (const value of [-1, 1.5, TRUST_PROXY_HOPS_MAX + 1, 'abc']) {
      expect(() => assertTrustProxyHops(value)).toThrow(/NUXT_TRUST_PROXY_HOPS/)
    }
  })
})

describe('isTrustedProxyAddress', () => {
  it('accepts loopback and private ranges, IPv4-mapped included', () => {
    for (const address of ['127.0.0.1', '10.0.0.2', '172.18.0.3', '192.168.1.1', '::1', 'fd12::1', '::ffff:10.0.0.2']) {
      expect(isTrustedProxyAddress(address)).toBe(true)
    }
  })

  it('refuses public addresses and missing or invalid ones', () => {
    for (const address of ['8.8.8.8', '172.32.0.1', '2001:db8::1', undefined, 'nope']) {
      expect(isTrustedProxyAddress(address)).toBe(false)
    }
  })
})

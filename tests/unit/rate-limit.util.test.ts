import { describe, expect, it } from 'vitest'
import { SlidingWindowRateLimiter } from '../../server/utils/http/rate-limit.util'

const createClock = (start = 1_000_000) => {
  let current = start
  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms
    }
  }
}

describe('SlidingWindowRateLimiter', () => {
  it('allows requests up to the limit then refuses', () => {
    const clock = createClock()
    const limiter = new SlidingWindowRateLimiter({ windowMs: 1000, maxRequests: 3, maxKeys: 100 }, clock.now)

    expect(limiter.check('ip:route')).toEqual({ allowed: true, remaining: 2, retryAfterMs: 0 })
    expect(limiter.check('ip:route').remaining).toBe(1)
    expect(limiter.check('ip:route').remaining).toBe(0)
    expect(limiter.check('ip:route').allowed).toBe(false)
  })

  it('reports how long to wait until the oldest hit leaves the window', () => {
    const clock = createClock()
    const limiter = new SlidingWindowRateLimiter({ windowMs: 1000, maxRequests: 1, maxKeys: 100 }, clock.now)

    limiter.check('k')
    clock.advance(400)
    expect(limiter.check('k')).toEqual({ allowed: false, remaining: 0, retryAfterMs: 600 })
  })

  it('allows again once the window has slid past the old hits', () => {
    const clock = createClock()
    const limiter = new SlidingWindowRateLimiter({ windowMs: 1000, maxRequests: 2, maxKeys: 100 }, clock.now)

    limiter.check('k')
    clock.advance(500)
    limiter.check('k')
    expect(limiter.check('k').allowed).toBe(false)

    clock.advance(501)
    expect(limiter.check('k').allowed).toBe(true)
    expect(limiter.check('k').allowed).toBe(false)
  })

  it('does not count refused attempts against the window', () => {
    const clock = createClock()
    const limiter = new SlidingWindowRateLimiter({ windowMs: 1000, maxRequests: 1, maxKeys: 100 }, clock.now)

    limiter.check('k')
    clock.advance(500)
    limiter.check('k')
    limiter.check('k')
    clock.advance(501)
    expect(limiter.check('k').allowed).toBe(true)
  })

  it('counts each key separately', () => {
    const clock = createClock()
    const limiter = new SlidingWindowRateLimiter({ windowMs: 1000, maxRequests: 1, maxKeys: 100 }, clock.now)

    expect(limiter.check('1.1.1.1:login').allowed).toBe(true)
    expect(limiter.check('2.2.2.2:login').allowed).toBe(true)
    expect(limiter.check('1.1.1.1:invite').allowed).toBe(true)
    expect(limiter.check('1.1.1.1:login').allowed).toBe(false)
  })
})

describe('SlidingWindowRateLimiter key cap', () => {
  it('evicts the least recently used key once maxKeys is exceeded', () => {
    const clock = createClock()
    const limiter = new SlidingWindowRateLimiter({ windowMs: 1000, maxRequests: 1, maxKeys: 2 }, clock.now)

    limiter.check('a')
    limiter.check('b')
    limiter.check('a') // refused but refreshes 'a': 'b' is now the oldest
    limiter.check('c') // evicts 'b'

    expect(limiter.check('a').allowed).toBe(false)
    expect(limiter.check('b').allowed).toBe(true) // 'b' was forgotten
  })

  it('never holds more than maxKeys keys', () => {
    const clock = createClock()
    const limiter = new SlidingWindowRateLimiter({ windowMs: 1000, maxRequests: 1, maxKeys: 3 }, clock.now)

    for (let index = 0; index < 50; index++) {
      limiter.check(`ip-${index}`)
    }

    expect(limiter.size).toBe(3)
  })
})

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { ConcurrencyGate } from '../../src/utils/concurrency-gate.util'
import { toApiError } from '../../src/utils/api-error.util'

// scrypt est remplacé par un double contrôlé : on compte les calculs réellement en cours.
const state = vi.hoisted(() => ({ running: 0, peak: 0, started: 0, release: [] as Array<() => void> }))
vi.mock('node:crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:crypto')>()
  return {
    ...actual,
    scrypt: (_p: unknown, _s: unknown, keyLength: number, _o: unknown, callback: (error: Error | null, key: Buffer) => void) => {
      state.running += 1
      state.started += 1
      state.peak = Math.max(state.peak, state.running)
      state.release.push(() => {
        state.running -= 1
        callback(null, Buffer.alloc(keyLength, 1))
      })
    }
  }
})

const { assertPasswordHashCapacity, configurePasswordHashConcurrency, hashPassword, verifyPassword } = await import('../../src/utils/password.util')

const tick = () => new Promise((resolve) => setImmediate(resolve))
const finishAll = () => {
  while (state.release.length > 0) {
    state.release.shift()!()
  }
}

describe('L2: scrypt concurrency semaphore', () => {
  beforeEach(() => {
    state.running = 0
    state.peak = 0
    state.started = 0
    state.release = []
  })
  afterEach(() => {
    finishAll()
  })

  it('N+1 simultaneous hashes: N computations run, one gets 503 SERVICE_BUSY with a retry delay', async () => {
    const limit = configurePasswordHashConcurrency(3)
    const results = Array.from({ length: limit + 1 }, (_, index) => hashPassword(`password-number-${index}`).then(
      (value) => ({ ok: true as const, value }),
      (error: unknown) => ({ ok: false as const, error })
    ))
    await tick()
    expect(state.started).toBe(limit)
    expect(state.peak).toBe(limit)
    expect(() => assertPasswordHashCapacity()).toThrow()

    finishAll()
    const settled = await Promise.all(results)
    expect(settled.filter((r) => r.ok)).toHaveLength(limit)
    const rejected = settled.filter((r) => !r.ok)
    expect(rejected).toHaveLength(1)
    const error = (rejected[0] as { error: { statusCode: number, data: { retryAfterSeconds: number } } }).error
    expect(error.statusCode).toBe(503)
    expect(error.data.retryAfterSeconds).toBeGreaterThan(0)
    expect(toApiError(error)).toMatchObject({ statusCode: 503, code: API_ERROR_CODE.SERVICE_BUSY })
  })

  it('applies to verifyPassword too, and frees the slot afterwards', async () => {
    configurePasswordHashConcurrency(1)
    const stored = `scrypt$16384$8$1$${Buffer.alloc(16, 2).toString('base64')}$${Buffer.alloc(64, 1).toString('base64')}`
    const first = verifyPassword('some-password-value', stored)
    await tick()
    await expect(verifyPassword('another-password-value', stored)).rejects.toMatchObject({ statusCode: 503 })
    finishAll()
    expect(await first).toBe(true)
    expect(() => assertPasswordHashCapacity()).not.toThrow()
    const again = verifyPassword('some-password-value', stored)
    await tick()
    finishAll()
    expect(await again).toBe(true)
  })

  it('rejects an invalid configured limit', () => {
    for (const bad of [0, -1, 1.5, 'abc', 1000, undefined]) {
      expect(() => configurePasswordHashConcurrency(bad)).toThrow(/NUXT_AUTH_PASSWORD_HASH_CONCURRENCY/)
    }
    expect(configurePasswordHashConcurrency('4')).toBe(4)
  })
})

describe('ConcurrencyGate', () => {
  it('releases the slot when the task throws', async () => {
    const gate = new ConcurrencyGate(1)
    await expect(gate.tryRun(async () => { throw new Error('boom') })).rejects.toThrow('boom')
    expect(gate.activeCount).toBe(0)
    expect(await gate.tryRun(async () => 7)).toEqual({ ran: true, value: 7 })
  })
})

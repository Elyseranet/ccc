import { createError } from 'h3'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { buildDataSourceOptions } from '../../src/server/db/typeorm/data-source-options'
import { databaseTimeoutError, toApiError } from '../../src/utils/api-error.util'
import { isDatabaseTimeout, resolveDatabaseTimeouts } from '../../src/utils/database-timeouts.util'
import { DeadlineExceededError, withDeadline } from '../../src/utils/deadline.util'

describe('resolveDatabaseTimeouts', () => {
  it('uses the runtime defaults (3 s connection, 3 s statement, 3.5 s client query)', () => {
    expect(resolveDatabaseTimeouts({}, 'runtime')).toEqual({
      timeouts: { connectionTimeoutMs: 3000, statementTimeoutMs: 3000, queryTimeoutMs: 3500 },
      invalidVariables: []
    })
  })

  it('bounds only the connection for the CLI, so a long migration is not cut', () => {
    expect(resolveDatabaseTimeouts({}, 'cli')).toEqual({
      timeouts: { connectionTimeoutMs: 10000, statementTimeoutMs: 0, queryTimeoutMs: 0 },
      invalidVariables: []
    })
  })

  it('accepts numbers and numeric strings (Nitro parses env values), 0 meaning no timeout', () => {
    expect(resolveDatabaseTimeouts({ connectionTimeoutMs: '1500', statementTimeoutMs: 0, queryTimeoutMs: 8000 }, 'runtime').timeouts)
      .toEqual({ connectionTimeoutMs: 1500, statementTimeoutMs: 0, queryTimeoutMs: 8000 })
  })

  it.each(['abc', '-5', '1.5', '1e3', 600001, -1, 2.5, {}, true])('keeps the default and names the variable for %j, never its value', (value) => {
    const { timeouts, invalidVariables } = resolveDatabaseTimeouts({ statementTimeoutMs: value }, 'runtime')
    expect(timeouts.statementTimeoutMs).toBe(3000)
    expect(invalidVariables).toEqual(['NUXT_DATABASE_STATEMENT_TIMEOUT_MS'])
    expect(JSON.stringify(invalidVariables)).not.toContain(String(value))
  })

  it('names the CLI variables in the CLI scope', () => {
    expect(resolveDatabaseTimeouts({ connectionTimeoutMs: 'x' }, 'cli').invalidVariables).toEqual(['NUXT_DATABASE_CLI_CONNECTION_TIMEOUT_MS'])
  })

  it('treats absent and empty values as "use the default", not as invalid', () => {
    expect(resolveDatabaseTimeouts({ connectionTimeoutMs: undefined, statementTimeoutMs: '', queryTimeoutMs: null }, 'runtime').invalidVariables).toEqual([])
  })
})

describe('buildDataSourceOptions : pg timeouts', () => {
  const base = { host: 'h', port: 5432, username: 'u', password: 'p', database: 'd' }

  it('passes the three timeouts to pg through `extra`', () => {
    const options = buildDataSourceOptions({ ...base, timeouts: { connectionTimeoutMs: 3000, statementTimeoutMs: 3000, queryTimeoutMs: 3500 } })
    expect(options.extra).toEqual({ connectionTimeoutMillis: 3000, statement_timeout: 3000, query_timeout: 3500 })
  })

  it('omits a timeout set to 0 (CLI: connection only)', () => {
    const options = buildDataSourceOptions({ ...base, timeouts: { connectionTimeoutMs: 10000, statementTimeoutMs: 0, queryTimeoutMs: 0 } })
    expect(options.extra).toEqual({ connectionTimeoutMillis: 10000 })
  })

  it('sets nothing when no timeouts are given', () => {
    expect(buildDataSourceOptions(base).extra).toBeUndefined()
  })
})

describe('isDatabaseTimeout', () => {
  it('recognises a statement_timeout cancellation (SQLSTATE 57014), bare or wrapped by TypeORM', () => {
    expect(isDatabaseTimeout(Object.assign(new Error('canceling statement due to statement timeout'), { code: '57014' }))).toBe(true)
    expect(isDatabaseTimeout(Object.assign(new Error('QueryFailedError'), { driverError: { code: '57014' } }))).toBe(true)
    expect(isDatabaseTimeout(createError({ statusCode: 500, cause: Object.assign(new Error('x'), { code: '57014' }) }))).toBe(true)
  })

  it.each(['timeout exceeded when trying to connect', 'Connection terminated due to connection timeout', 'Query read timeout'])(
    'recognises the pg client message "%s"', (message) => {
      expect(isDatabaseTimeout(new Error(message))).toBe(true)
      expect(isDatabaseTimeout(Object.assign(new Error('wrapped'), { driverError: new Error(message) }))).toBe(true)
    }
  )

  it.each([
    new Error('boom'),
    Object.assign(new Error('duplicate key'), { code: '23505' }),
    Object.assign(new Error('Connection terminated unexpectedly'), { code: 'ECONNRESET' }),
    createError({ statusCode: 500, message: 'oops' }),
    null,
    undefined,
    'timeout',
    42
  ])('does not treat %j as a database timeout', (error) => {
    expect(isDatabaseTimeout(error)).toBe(false)
  })
})

describe('database timeout answer and the other 5xx (unchanged)', () => {
  it('maps to 503 SERVICE_UNAVAILABLE with a generic message and no driver detail', () => {
    const apiError = toApiError(databaseTimeoutError())
    expect(apiError).toEqual({ statusCode: 503, code: API_ERROR_CODE.SERVICE_UNAVAILABLE, message: 'Service unavailable' })
    expect((databaseTimeoutError().data as { retryAfterSeconds: number }).retryAfterSeconds).toBe(5)
  })

  it('keeps every other 5xx exactly as before', () => {
    expect(toApiError(new Error('x'))).toEqual({ statusCode: 500, code: API_ERROR_CODE.INTERNAL_ERROR, message: 'Internal server error' })
    expect(toApiError(createError({ statusCode: 502, message: 'bad gateway' })).statusCode).toBe(500)
    expect(toApiError(createError({ statusCode: 500, message: 'oops', data: { code: API_ERROR_CODE.CONFLICT } })).code).toBe(API_ERROR_CODE.INTERNAL_ERROR)
    expect(toApiError(createError({ statusCode: 503, data: { code: API_ERROR_CODE.SERVICE_BUSY } })).code).toBe(API_ERROR_CODE.SERVICE_BUSY)
  })
})

describe('withDeadline', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('resolves with the value when the promise wins', async () => {
    await expect(withDeadline(Promise.resolve(7), 1000)).resolves.toBe(7)
  })

  it('rejects with the promise error when the promise fails first', async () => {
    await expect(withDeadline(Promise.reject(new Error('db down')), 1000)).rejects.toThrow('db down')
  })

  it('rejects with DeadlineExceededError when the deadline wins, and frees the timer', async () => {
    vi.useFakeTimers()
    const never = new Promise<number>(() => undefined)
    const outcome = withDeadline(never, 4000).then(() => null, (error: unknown) => error)
    await vi.advanceTimersByTimeAsync(4000)
    expect(await outcome).toBeInstanceOf(DeadlineExceededError)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('absorbs the late rejection of the losing promise: no unhandledRejection', async () => {
    const unhandled = vi.fn()
    process.on('unhandledRejection', unhandled)
    try {
      const late = new Promise<never>((_resolve, reject) => setTimeout(() => reject(new Error('late failure')), 60))
      await expect(withDeadline(late, 10)).rejects.toBeInstanceOf(DeadlineExceededError)
      await new Promise((resolve) => setTimeout(resolve, 150))
      expect(unhandled).not.toHaveBeenCalled()
    } finally {
      process.off('unhandledRejection', unhandled)
    }
  })
})

import { describe, expect, it } from 'vitest'
import { LOG_MAX_VALUE_LENGTH, LOG_SECRET_SEGMENT_PLACEHOLDER } from '../../src/consts/log.const'
import { describeErrorForLog, sanitizeRouteForLog, truncateLogValue } from '../../src/utils/log-sanitize.util'

describe('log sanitizing', () => {
  it('truncates a long value to the fixed bound', () => {
    expect(truncateLogValue('x'.repeat(LOG_MAX_VALUE_LENGTH * 5))).toHaveLength(LOG_MAX_VALUE_LENGTH)
  })

  it('leaves a short value untouched', () => {
    expect(truncateLogValue('short')).toBe('short')
  })

  it('drops the query string from a route', () => {
    expect(sanitizeRouteForLog('/api/v1/health?token=SECRET&x=1')).toBe('/api/v1/health')
  })

  it('truncates a very long route and still hides the query string', () => {
    const route = sanitizeRouteForLog(`/api/v1/${'a'.repeat(LOG_MAX_VALUE_LENGTH * 5)}?token=SECRET`)
    expect(route).toHaveLength(LOG_MAX_VALUE_LENGTH)
    expect(route).not.toContain('SECRET')
  })

  it('returns undefined when there is no path', () => {
    expect(sanitizeRouteForLog(undefined)).toBeUndefined()
  })
  describe('invitation token in the path (B-09)', () => {
    const token = 'Q'.repeat(43)

    it('replaces the token segment with a placeholder', () => {
      expect(sanitizeRouteForLog(`/api/v1/auth/invitation/${token}`)).toBe(`/api/v1/auth/invitation/${LOG_SECRET_SEGMENT_PLACEHOLDER}`)
    })

    it('hides the token behind a query string, a trailing path or a case or slash variant', () => {
      for (const path of [
        `/api/v1/auth/invitation/${token}?x=1`,
        `/api/v1/auth/invitation/${token}/extra`,
        `/API/V1/AUTH/INVITATION/${token}`,
        `//api/v1//auth/invitation/${token}`
      ]) {
        expect(sanitizeRouteForLog(path)).not.toContain(token)
      }
    })

    it('leaves the other routes untouched', () => {
      expect(sanitizeRouteForLog('/api/v1/competiteurs/abc/invitation')).toBe('/api/v1/competiteurs/abc/invitation')
    })
  })
})

describe('describeErrorForLog (T-SEC-09, L5)', () => {
  it('keeps the error type and the SQLSTATE code, never the message', () => {
    const error = Object.assign(new Error('no pg_hba.conf entry for host=10.0.0.5 user=ccc database=prod'), { name: 'error', code: '28000' })
    const fields = describeErrorForLog(error)
    expect(fields).toEqual({ errorName: 'error', errorCode: '28000' })
    expect(JSON.stringify(fields)).not.toMatch(/host=|user=|database=|10\.0\.0\.5/)
  })

  it('falls back to errno, then to null, and survives a non-Error value', () => {
    expect(describeErrorForLog(Object.assign(new Error('x'), { errno: -111 }))).toEqual({ errorName: 'Error', errorCode: -111 })
    expect(describeErrorForLog(new TypeError('x'))).toEqual({ errorName: 'TypeError', errorCode: null })
    expect(describeErrorForLog('boom')).toEqual({ errorName: 'UnknownError', errorCode: null })
    expect(describeErrorForLog(undefined)).toEqual({ errorName: 'UnknownError', errorCode: null })
  })
})


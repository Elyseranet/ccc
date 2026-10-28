import { describe, expect, it } from 'vitest'
import { LOG_MAX_VALUE_LENGTH, LOG_SECRET_SEGMENT_PLACEHOLDER } from '../../src/consts/log.const'
import { sanitizeRouteForLog, truncateLogValue } from '../../src/utils/log-sanitize.util'

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

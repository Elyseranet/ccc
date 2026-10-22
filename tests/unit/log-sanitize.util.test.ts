import { describe, expect, it } from 'vitest'
import { LOG_MAX_VALUE_LENGTH } from '../../src/consts/log.const'
import { sanitizeRouteForLog, truncateLogValue } from '../../src/server/utils/log-sanitize.util'

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
})

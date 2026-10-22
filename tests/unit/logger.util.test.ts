import { describe, expect, it } from 'vitest'
import { LOG_LEVEL } from '../../src/enums/log-level.enum'
import { createLogger } from '../../src/server/utils/logger.util'

describe('createLogger', () => {
  it('writes one JSON line with event, level, timestamp and the given fields', () => {
    const lines: string[] = []
    const log = createLogger((line) => lines.push(line), () => new Date('2026-10-20T10:00:00.000Z'))

    log.info('request_completed', { requestId: 'abc-123', route: '/api/v1/health', durationMs: 4 })

    expect(lines).toHaveLength(1)
    expect(JSON.parse(lines[0]!)).toEqual({
      event: 'request_completed',
      level: LOG_LEVEL.INFO,
      timestamp: '2026-10-20T10:00:00.000Z',
      requestId: 'abc-123',
      route: '/api/v1/health',
      durationMs: 4
    })
  })

  it('does not let fields override event and level', () => {
    const lines: string[] = []
    const log = createLogger((line) => lines.push(line))

    log.error('real_event', { event: 'spoofed', level: 'debug' })

    expect(JSON.parse(lines[0]!)).toMatchObject({ event: 'real_event', level: LOG_LEVEL.ERROR })
  })
})

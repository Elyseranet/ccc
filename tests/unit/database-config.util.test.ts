import { describe, expect, it } from 'vitest'
import { assertDatabaseConfig } from '../../src/server/utils/database-config.util'

const complete = { host: 'db.internal', port: 5432, username: 'ccc', password: 'S3CRET-VALUE', database: 'ccc' }

describe('assertDatabaseConfig', () => {
  it('accepts a complete configuration in production', () => {
    expect(() => assertDatabaseConfig(complete, 'production')).not.toThrow()
  })

  it('names every missing variable in production', () => {
    expect(() => assertDatabaseConfig({ ...complete, host: '', password: '' }, 'production'))
      .toThrow(/NUXT_DATABASE_HOST.*NUXT_DATABASE_PASSWORD/)
  })

  it('never puts a configured value in the message', () => {
    try {
      assertDatabaseConfig({ ...complete, host: '' }, 'production')
      expect.unreachable()
    } catch (error) {
      const message = (error as Error).message
      expect(message).not.toContain('S3CRET-VALUE')
      expect(message).not.toContain('db.internal')
    }
  })

  it.each(['development', 'test', undefined])('keeps the lenient behaviour when NODE_ENV is %s', (nodeEnv) => {
    expect(() => assertDatabaseConfig({ host: '', port: 5432, username: '', password: '', database: '' }, nodeEnv))
      .not.toThrow()
  })
})

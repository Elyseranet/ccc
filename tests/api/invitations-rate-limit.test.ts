import { fileURLToPath } from 'node:url'
import { setup } from '@nuxt/test-utils/e2e'
import { afterAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { getWith, jsonPost, resetTestDatabase } from './helpers/auth-fixtures'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'
import { requireTestDatabaseEnv } from './helpers/test-database'

const MAX_REQUESTS = 3

// Les routes publiques à jeton partagent un budget par IP : freine le devinage de jetons.
describe('invitation token rate limit', async () => {
  const env = requireTestDatabaseEnv()
  const dataSource: DataSource = await resetTestDatabase()

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: { ...env, NUXT_RATE_LIMIT_INVITATION_TOKEN_MAX_REQUESTS: String(MAX_REQUESTS) }
  })

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  it('answers 429 with Retry-After once the budget is spent, GET and POST sharing it', async () => {
    const path = `/api/v1/auth/invitation/${'Q'.repeat(43)}`
    expect((await getWith(path)).status).toBe(404)
    expect((await getWith(path)).status).toBe(404)
    expect((await jsonPost(path, { password: 'a-long-enough-password' })).status).toBe(404)

    const limited = await getWith(path)
    expect(limited.status).toBe(429)
    expect(Number(limited.headers.get('Retry-After'))).toBeGreaterThan(0)
    expect((await jsonPost(path, { password: 'a-long-enough-password' })).status).toBe(429)
  })
})

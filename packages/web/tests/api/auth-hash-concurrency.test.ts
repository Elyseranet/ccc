import { fileURLToPath } from 'node:url'
import { setup } from '@nuxt/test-utils/e2e'
import { afterAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { USER_ROLE } from '../../src/enums/user.enum'
import { login, resetTestDatabase, seedUser } from './helpers/auth-fixtures'
import { requireTestDatabaseEnv } from './helpers/test-database'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'

const PASSWORD = 'a-long-enough-password'
const PARALLEL_LOGINS = 6

// L2 : une seule vérification scrypt à la fois ; les connexions simultanées en trop reçoivent 503 + Retry-After.
describe('scrypt concurrency limit (NUXT_AUTH_PASSWORD_HASH_CONCURRENCY=1)', async () => {
  const env = requireTestDatabaseEnv()
  const dataSource: DataSource = await resetTestDatabase()
  const users = []
  for (let index = 0; index < PARALLEL_LOGINS; index += 1) {
    users.push(await seedUser(dataSource, { email: `parallel-${index}@ccc.test`, password: PASSWORD, role: USER_ROLE.PARTICIPANT }))
  }

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: { ...env, NODE_ENV: 'production', NUXT_AUTH_PASSWORD_HASH_CONCURRENCY: '1' }
  })

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  it('simultaneous logins beyond the limit get 503 SERVICE_BUSY with Retry-After, the others succeed', async () => {
    const responses = await Promise.all(users.map((user) => login(user.email, PASSWORD)))
    const busy = responses.filter((response) => response.status === 503)
    const ok = responses.filter((response) => response.status === 200)
    expect(ok.length).toBeGreaterThanOrEqual(1)
    expect(busy.length).toBeGreaterThanOrEqual(1)
    expect(ok.length + busy.length).toBe(PARALLEL_LOGINS)
    for (const response of busy) {
      expect(Number(response.headers.get('retry-after'))).toBeGreaterThan(0)
      expect((await response.json()).code).toBe(API_ERROR_CODE.SERVICE_BUSY)
    }
  })

  it('the server recovers once the computations are done', async () => {
    const retry = await login(users[0]!.email, PASSWORD)
    expect(retry.status).toBe(200)
  })
})

import { fileURLToPath } from 'node:url'
import { setup } from '@nuxt/test-utils/e2e'
import { afterAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { USER_ROLE } from '../../src/enums/user.enum'
import { deviceCookieHeaderOf, login, resetTestDatabase, seedUser, TEST_DEVICE_SECRET } from './helpers/auth-fixtures'
import { requireTestDatabaseEnv } from './helpers/test-database'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'

const IP_LIMIT = 3
const PASSWORD = 'a-long-enough-password'

describe('IP limit with a trusted device cookie (SEC-A4)', async () => {
  const env = requireTestDatabaseEnv()
  const dataSource: DataSource = await resetTestDatabase()
  const owner = await seedUser(dataSource, { email: 'device-owner@ccc.test', password: PASSWORD, role: USER_ROLE.PARTICIPANT })

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: {
      ...env,
      NODE_ENV: 'production',
      NUXT_AUTH_DEVICE_COOKIE_SECRET: TEST_DEVICE_SECRET,
      NUXT_AUTH_LOGIN_RATE_LIMIT_MAX_IP_ATTEMPTS: String(IP_LIMIT)
    }
  })

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  it('a valid device cookie does not exempt its IP from the per-IP limit', async () => {
    const first = await login(owner.email, PASSWORD)
    expect(first.status).toBe(200)
    const cookie = deviceCookieHeaderOf(first)

    expect((await login(owner.email, PASSWORD, cookie)).status).toBe(200)
    expect((await login(owner.email, PASSWORD, cookie)).status).toBe(200)

    const limited = await login(owner.email, PASSWORD, cookie)
    expect(limited.status).toBe(429)
    expect((await limited.json()).code).toBe(API_ERROR_CODE.RATE_LIMITED)
  })
})

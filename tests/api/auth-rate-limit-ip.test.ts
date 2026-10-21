import { fileURLToPath } from 'node:url'
import { setup } from '@nuxt/test-utils/e2e'
import { afterAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { API_ERROR_CODE } from '../../shared/enums/api-error-code.enum'
import { login, resetTestDatabase } from './helpers/auth-fixtures'
import { requireTestDatabaseEnv } from './helpers/test-database'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'

const IP_LIMIT = 3

describe('POST /auth/login rate limit per IP', async () => {
  const env = requireTestDatabaseEnv()
  const dataSource: DataSource = await resetTestDatabase()

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: { ...env, NUXT_AUTH_LOGIN_RATE_LIMIT_MAX_IP_ATTEMPTS: String(IP_LIMIT) }
  })

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  it('answers 429 once one IP tried too many different emails', async () => {
    const statuses: number[] = []
    for (let attempt = 0; attempt < IP_LIMIT + 1; attempt += 1) {
      const response = await login(`sweep${attempt}@ccc.test`, 'wrong-password-wrong')
      statuses.push(response.status)
      if (response.status === 429) {
        expect((await response.json()).code).toBe(API_ERROR_CODE.RATE_LIMITED)
      }
    }
    expect(statuses).toEqual([...Array(IP_LIMIT).fill(401), 429])
  })
})

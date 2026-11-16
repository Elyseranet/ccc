import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { API_JSON_BODY_MAX_BYTES } from '../../src/consts/request.const'
import { resetTestDatabase } from './helpers/auth-fixtures'
import { requireTestDatabaseEnv } from './helpers/test-database'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'

const IP_LIMIT = 2

describe('POST /auth/login: the IP limiter runs before the body is read (M2)', async () => {
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

  it('counts oversized bodies against the quota, then answers 429 whatever the body', async () => {
    const oversized = JSON.stringify({ email: 'a@ccc.test', password: 'x'.repeat(API_JSON_BODY_MAX_BYTES) })
    const statuses: number[] = []
    for (let attempt = 0; attempt < IP_LIMIT + 1; attempt += 1) {
      const response = await fetch('/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: oversized })
      statuses.push(response.status)
      if (response.status === 429) {
        expect((await response.json() as { code: API_ERROR_CODE }).code).toBe(API_ERROR_CODE.RATE_LIMITED)
      }
    }
    expect(statuses).toEqual([...Array(IP_LIMIT).fill(413), 429])
  })
})

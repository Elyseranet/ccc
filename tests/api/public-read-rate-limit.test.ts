import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { resetTestDatabase } from './helpers/auth-fixtures'
import { requireTestDatabaseEnv } from './helpers/test-database'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'

const PUBLIC_READ_LIMIT = 4
const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000'

const BUDGET_SPENDERS = [
  '/api/v1/competiteurs',
  '/api/v1/stats',
  '/api/v1/classements/acp',
  '/api/v1/editions'
]

const LIMITED_ROUTES = [
  '/api/v1/classements/all-time',
  '/api/v1/classements/evolution',
  '/api/v1/stats',
  '/api/v1/editions',
  '/api/v1/competiteurs',
  `/api/v1/competiteurs/${UNKNOWN_ID}`,
  `/api/v1/competiteurs/${UNKNOWN_ID}/face-a-face`,
  `/api/v1/editions/${UNKNOWN_ID}`,
  `/api/v1/editions/${UNKNOWN_ID}/poules`,
  `/api/v1/editions/${UNKNOWN_ID}/matchs`
]

describe('public GET shared rate limit (M3)', async () => {
  const env = requireTestDatabaseEnv()
  const dataSource: DataSource = await resetTestDatabase()

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: { ...env, NUXT_RATE_LIMIT_PUBLIC_READ_MAX_REQUESTS: String(PUBLIC_READ_LIMIT) }
  })

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  it('shares one budget across public routes, answers 429 with Retry-After, and spares /health and the search', async () => {
    expect(BUDGET_SPENDERS).toHaveLength(PUBLIC_READ_LIMIT)
    for (const path of BUDGET_SPENDERS) {
      expect((await fetch(path)).status, path).toBe(200)
    }

    for (const path of LIMITED_ROUTES) {
      const limited = await fetch(path)
      expect(limited.status, path).toBe(429)
      expect(Number(limited.headers.get('retry-after')), path).toBeGreaterThan(0)
      expect((await limited.json() as { code: API_ERROR_CODE }).code, path).toBe(API_ERROR_CODE.RATE_LIMITED)
    }

    expect((await fetch('/api/v1/health')).status).toBe(200)
    expect((await fetch('/api/v1/competiteurs?q=rem')).status).toBe(200)
  })
})

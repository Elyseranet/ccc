import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'
import { HEALTH_STATUS } from '../../src/enums/health-status.enum'
import { requireTestDatabaseEnv } from './helpers/test-database'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'

// Port 1 : rien n'y écoute, la connexion est refusée immédiatement.
const UNREACHABLE_PORT = '1'

describe('GET /api/v1/health (database cut)', async () => {
  const env = requireTestDatabaseEnv()

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: { ...env, NUXT_DATABASE_PORT: UNREACHABLE_PORT }
  })

  it('answers 503 and leaks neither the pg message nor connection details', async () => {
    const response = await fetch('/api/v1/health')
    const text = await response.text()

    expect(response.status).toBe(503)
    expect(JSON.parse(text)).toEqual({ status: HEALTH_STATUS.UNAVAILABLE })
    expect(text).not.toMatch(/ECONNREFUSED|127\.0\.0\.1|password|postgres/i)
    expect(text).not.toContain(env.NUXT_DATABASE_HOST)
    expect(text).not.toContain(env.NUXT_DATABASE_PASSWORD)
  })
})

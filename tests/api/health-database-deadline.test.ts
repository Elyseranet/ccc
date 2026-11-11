import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, describe, expect, it } from 'vitest'
import { HEALTH_STATUS } from '../../src/enums/health-status.enum'
import { requireTestDatabaseEnv } from './helpers/test-database'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'
import { startBlackHole } from './helpers/black-hole'

const HEALTHCHECK_TIMEOUT_MS = 5000

/**
 * T-SEC-17 : si les délais de la base sont réglés trop haut (ici 20 s de connexion), la sonde reste bornée par son propre
 * délai global de 4 s et répond 503 avant les 5 s du HEALTHCHECK.
 */
describe('GET /api/v1/health (database timeouts set far above the probe deadline)', async () => {
  const env = requireTestDatabaseEnv()
  const blackHole = await startBlackHole()
  const port = blackHole.port

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: { ...env, NUXT_DATABASE_HOST: '127.0.0.1', NUXT_DATABASE_PORT: String(port), NUXT_DATABASE_CONNECTION_TIMEOUT_MS: '20000' }
  })

  afterAll(async () => {
    await blackHole.close()
  })

  it('still answers 503 in under 5 s thanks to the global deadline', async () => {
    const startedAt = Date.now()
    const response = await fetch('/api/v1/health')
    const elapsedMs = Date.now() - startedAt
    expect(response.status).toBe(503)
    expect(elapsedMs).toBeLessThan(HEALTHCHECK_TIMEOUT_MS)
    expect(elapsedMs).toBeGreaterThanOrEqual(3500)
    expect(await response.json()).toEqual({ status: HEALTH_STATUS.UNAVAILABLE })
  })
})

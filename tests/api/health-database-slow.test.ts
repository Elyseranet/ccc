import { createServer } from 'node:net'
import type { Server } from 'node:net'
import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, describe, expect, it } from 'vitest'
import { HEALTH_STATUS } from '../../src/enums/health-status.enum'
import { requireTestDatabaseEnv } from './helpers/test-database'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'

// Le HEALTHCHECK de l'image attend 5 s (Dockerfile) : la sonde doit avoir répondu avant.
const HEALTHCHECK_TIMEOUT_MS = 5000

/**
 * T-SEC-17 : une base qui accepte la connexion TCP et ne répond jamais (le cas « base lente »). Avec les délais par défaut
 * du serveur (3 s de connexion), la sonde répond 503 en moins de 5 s, sans détail.
 */
describe('GET /api/v1/health (database accepts the connection and never answers)', async () => {
  const env = requireTestDatabaseEnv()
  const blackHole: Server = createServer(() => undefined)
  await new Promise<void>((resolve) => blackHole.listen(0, '127.0.0.1', resolve))
  const port = (blackHole.address() as { port: number }).port

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: { ...env, NUXT_DATABASE_HOST: '127.0.0.1', NUXT_DATABASE_PORT: String(port) }
  })

  afterAll(async () => {
    await new Promise<void>((resolve) => blackHole.close(() => resolve()))
  })

  it('answers 503 within the healthcheck delay, in the usual format, with no driver detail', async () => {
    const startedAt = Date.now()
    const response = await fetch('/api/v1/health')
    const elapsedMs = Date.now() - startedAt
    const text = await response.text()

    expect(response.status).toBe(503)
    expect(elapsedMs).toBeLessThan(HEALTHCHECK_TIMEOUT_MS)
    expect(JSON.parse(text)).toEqual({ status: HEALTH_STATUS.UNAVAILABLE })
    expect(text).not.toMatch(/timeout|127\.0\.0\.1|postgres|password|connect/i)
  })
})

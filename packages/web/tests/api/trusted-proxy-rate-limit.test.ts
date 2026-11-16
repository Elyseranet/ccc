import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { FORWARDED_FOR_HEADER } from '../../src/consts/request.const'
import { resetTestDatabase } from './helpers/auth-fixtures'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'
import { requireTestDatabaseEnv } from './helpers/test-database'

const MAX_REQUESTS = 2
const CLIENT_A = '203.0.113.10'
const CLIENT_B = '203.0.113.20'

const getAs = (path: string, forwardedFor: string): Promise<Response> =>
  fetch(path, { headers: { [FORWARDED_FOR_HEADER]: forwardedFor } })

// Derrière un proxy de confiance (NUXT_TRUST_PROXY_HOPS=1), chaque client a son propre budget,
// et ce qu'un client forge à gauche de la chaîne ne lui rend pas de budget.
describe('rate limit behind one trusted proxy', async () => {
  const env = requireTestDatabaseEnv()
  const dataSource: DataSource = await resetTestDatabase()

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: { ...env, NUXT_TRUST_PROXY_HOPS: '1', NUXT_RATE_LIMIT_INVITATION_TOKEN_MAX_REQUESTS: String(MAX_REQUESTS) }
  })

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  it('keys the budget on the client address appended by the proxy', async () => {
    const path = `/api/v1/auth/invitation/${'S'.repeat(43)}`
    expect((await getAs(path, CLIENT_A)).status).toBe(404)
    expect((await getAs(path, CLIENT_A)).status).toBe(404)
    expect((await getAs(path, CLIENT_A)).status).toBe(429)

    // Un autre client derrière le même proxy garde son budget.
    expect((await getAs(path, CLIENT_B)).status).toBe(404)

    // Le client A qui forge une entrée à gauche reste compté sur son adresse réelle.
    expect((await getAs(path, `198.51.100.1, ${CLIENT_A}`)).status).toBe(429)
  })
})

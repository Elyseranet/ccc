import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'
import { API_ERROR_CODE } from '../../shared/enums/api-error-code.enum'
import { requireTestDatabaseEnv } from './helpers/test-database'

const SEARCH_LIMIT = 3

describe('GET /api/v1/competiteurs?q= rate limit', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    server: true,
    env: { ...requireTestDatabaseEnv(), NUXT_RATE_LIMIT_COMPETITORS_SEARCH_MAX_REQUESTS: String(SEARCH_LIMIT) }
  })

  it('answers 429 with Retry-After beyond the configured threshold, and leaves the plain list alone', async () => {
    for (let call = 0; call < SEARCH_LIMIT; call += 1) {
      expect((await fetch('/api/v1/competiteurs?q=rem')).status).toBe(200)
    }
    const limited = await fetch('/api/v1/competiteurs?q=rem')
    expect(limited.status).toBe(429)
    expect(Number(limited.headers.get('retry-after'))).toBeGreaterThan(0)
    expect((await limited.json() as { code: API_ERROR_CODE }).code).toBe(API_ERROR_CODE.RATE_LIMITED)

    expect((await fetch('/api/v1/competiteurs')).status).toBe(200)
  })
})

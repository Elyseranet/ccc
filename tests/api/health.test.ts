import { fileURLToPath } from 'node:url'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'
import { API_ERROR_CODE } from '../../shared/enums/api-error-code.enum'
import { HEALTH_STATUS } from '../../shared/enums/health-status.enum'
import { requireTestDatabaseEnv } from './helpers/test-database'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'

describe('GET /api/v1/health (database reachable)', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: requireTestDatabaseEnv()
  })

  it('answers 200 with only a status', async () => {
    const response = await fetch('/api/v1/health')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ status: HEALTH_STATUS.OK })
  })

  it('sets an X-Request-Id header', async () => {
    const response = await fetch('/api/v1/health')
    expect(response.headers.get('x-request-id')).toMatch(/^[A-Za-z0-9-]{8,64}$/)
  })

  it('reuses a well-formed X-Request-Id sent by the client and replaces a malformed one', async () => {
    const kept = await fetch('/api/v1/health', { headers: { 'X-Request-Id': 'client-request-0001' } })
    expect(kept.headers.get('x-request-id')).toBe('client-request-0001')

    const replaced = await fetch('/api/v1/health', { headers: { 'X-Request-Id': 'bad id with spaces\t' } })
    expect(replaced.headers.get('x-request-id')).not.toBe('bad id with spaces\t')
  })

  it('returns errors under /api in the IApiError format', async () => {
    const response = await fetch('/api/v1/does-not-exist', { headers: { Accept: 'application/json' } })
    expect(response.status).toBe(404)
    const body = await response.json()
    expect(body).toEqual({
      statusCode: 404,
      code: API_ERROR_CODE.NOT_FOUND,
      message: expect.any(String)
    })
  })

  it('exposes no infrastructure detail on the health payload', async () => {
    const body = await $fetch<Record<string, unknown>>('/api/v1/health')
    expect(Object.keys(body)).toEqual(['status'])
  })
})

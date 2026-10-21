import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { API_ERROR_CODE } from '../../shared/enums/api-error-code.enum'
import { USER_ROLE } from '../../shared/enums/user.enum'
import { API_JSON_BODY_MAX_BYTES } from '../../server/consts/request.const'
import { cookieHeaderOf, login, resetTestDatabase, seedUser } from './helpers/auth-fixtures'
import { requireTestDatabaseEnv } from './helpers/test-database'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'

const PASSWORD = 'a-long-enough-password'
const JSON_HEADERS = { 'Content-Type': 'application/json' }
const STREAM_CHUNK_BYTES = 1024

/** Un objet JSON d'exactement `bytes` octets (ASCII), dont le champ `padding` absorbe le reste. */
const jsonOfSize = (bytes: number, fields: Record<string, unknown> = {}): string => {
  const base = JSON.stringify({ ...fields, padding: '' })
  return JSON.stringify({ ...fields, padding: 'x'.repeat(bytes - base.length) })
}

/** Même corps envoyé en `Transfer-Encoding: chunked` (aucun Content-Length). */
const chunkedRequest = (path: string, method: string, payload: string, headers: Record<string, string>): Promise<Response> => {
  const bytes = new TextEncoder().encode(payload)
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (let offset = 0; offset < bytes.length; offset += STREAM_CHUNK_BYTES) {
        controller.enqueue(bytes.slice(offset, offset + STREAM_CHUNK_BYTES))
      }
      controller.close()
    }
  })
  return fetch(path, { method, headers, body: stream, duplex: 'half' } as RequestInit)
}

describe('JSON body size cap (M2)', async () => {
  const env = requireTestDatabaseEnv()
  const dataSource: DataSource = await resetTestDatabase()
  const participant = await seedUser(dataSource, { email: 'player@ccc.test', password: PASSWORD, role: USER_ROLE.PARTICIPANT, withCompetitor: true })

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: { ...env, NUXT_AUTH_LOGIN_RATE_LIMIT_MAX_IP_ATTEMPTS: '1000' }
  })

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  const expectTooLarge = async (response: Response): Promise<void> => {
    expect(response.status).toBe(413)
    expect((await response.json() as { code: API_ERROR_CODE }).code).toBe(API_ERROR_CODE.PAYLOAD_TOO_LARGE)
  }

  describe('POST /auth/login', () => {
    const loginFields = { email: participant.email, password: PASSWORD }

    it('refuses cap + 1 byte with a Content-Length', async () => {
      const payload = jsonOfSize(API_JSON_BODY_MAX_BYTES + 1, loginFields)
      expect(new TextEncoder().encode(payload).length).toBe(API_JSON_BODY_MAX_BYTES + 1)
      await expectTooLarge(await fetch('/api/v1/auth/login', { method: 'POST', headers: JSON_HEADERS, body: payload }))
    })

    it('refuses cap + 1 byte sent chunked, without Content-Length', async () => {
      const payload = jsonOfSize(API_JSON_BODY_MAX_BYTES + 1, loginFields)
      await expectTooLarge(await chunkedRequest('/api/v1/auth/login', 'POST', payload, JSON_HEADERS))
    })

    it('accepts a normal body, and a body of exactly the cap reaches validation', async () => {
      const normal = await fetch('/api/v1/auth/login', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify(loginFields) })
      expect(normal.status).toBe(200)

      const atCap = await fetch('/api/v1/auth/login', { method: 'POST', headers: JSON_HEADERS, body: jsonOfSize(API_JSON_BODY_MAX_BYTES, loginFields) })
      expect(atCap.status).not.toBe(413)
      const chunkedAtCap = await chunkedRequest('/api/v1/auth/login', 'POST', jsonOfSize(API_JSON_BODY_MAX_BYTES, loginFields), JSON_HEADERS)
      expect(chunkedAtCap.status).not.toBe(413)
    })

    it('answers 400 on malformed JSON and on a non-JSON content type', async () => {
      expect((await fetch('/api/v1/auth/login', { method: 'POST', headers: JSON_HEADERS, body: '{not json' })).status).toBe(400)
      expect((await fetch('/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(loginFields) })).status).toBe(400)
    })
  })

  describe('PATCH /moi', () => {
    const patch = (cookie: string, payload: string): Promise<Response> =>
      fetch('/api/v1/moi', { method: 'PATCH', headers: { ...JSON_HEADERS, Cookie: cookie }, body: payload })

    it('refuses cap + 1 byte (with and without Content-Length) and accepts a normal body', async () => {
      const cookie = cookieHeaderOf(await login(participant.email, PASSWORD))
      const oversized = jsonOfSize(API_JSON_BODY_MAX_BYTES + 1, { phone: '+33 6 11 22 33 44' })

      await expectTooLarge(await patch(cookie, oversized))
      await expectTooLarge(await chunkedRequest('/api/v1/moi', 'PATCH', oversized, { ...JSON_HEADERS, Cookie: cookie }))
      expect((await patch(cookie, JSON.stringify({ phone: '+33 6 11 22 33 44' }))).status).toBe(200)
    })
  })
})

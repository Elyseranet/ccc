import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { USER_ROLE } from '../../src/enums/user.enum'
import { fileUpload } from '../helpers/avatar-fixtures'
import { cookieHeaderOf, login, resetTestDatabase, seedUser } from './helpers/auth-fixtures'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'
import { requireTestDatabaseEnv } from './helpers/test-database'

const UPLOAD_LIMIT = 2
const PASSWORD = 'a-long-enough-password'

describe('avatar upload rate limit', async () => {
  const dataSource: DataSource = await resetTestDatabase()
  const participant = await seedUser(dataSource, { email: 'rate@ccc.test', password: PASSWORD, role: USER_ROLE.PARTICIPANT, withCompetitor: true })

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: { ...requireTestDatabaseEnv(), NUXT_RATE_LIMIT_AVATAR_UPLOAD_MAX_REQUESTS: String(UPLOAD_LIMIT) }
  })

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  it('answers 429 with Retry-After beyond the threshold, before reading the body; other routes are unaffected', async () => {
    const cookie = cookieHeaderOf(await login(participant.email, PASSWORD))
    // Un corps qui n'est pas une image : s'il était lu, la réponse serait 415. Les envois autorisés le prouvent.
    const notAnImage = fileUpload(Buffer.from('not an image'))
    const send = (): Promise<Response> => fetch('/api/v1/moi/avatar', {
      method: 'PUT',
      headers: { 'Content-Type': notAnImage.contentType, Cookie: cookie },
      body: notAnImage.body
    })

    for (let call = 0; call < UPLOAD_LIMIT; call += 1) {
      expect((await send()).status).toBe(415)
    }
    const limited = await send()
    expect(limited.status).toBe(429)
    expect(Number(limited.headers.get('retry-after'))).toBeGreaterThan(0)
    expect((await limited.json() as { code: API_ERROR_CODE }).code).toBe(API_ERROR_CODE.RATE_LIMITED)

    // Le même budget protège la route administrateur : le limiteur passe avant l'autorisation (ici 403 sans lui).
    const adminRoute = await fetch(`/api/v1/competiteurs/${participant.competitorId}/avatar`, {
      method: 'PUT',
      headers: { 'Content-Type': notAnImage.contentType, Cookie: cookie },
      body: notAnImage.body
    })
    expect(adminRoute.status).toBe(429)

    expect((await fetch('/api/v1/moi', { headers: { Cookie: cookie } })).status).toBe(200)
    expect((await fetch('/api/v1/moi/avatar', { method: 'DELETE', headers: { Cookie: cookie } })).status).toBe(404)
  })
})

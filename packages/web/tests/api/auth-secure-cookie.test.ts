import { fileURLToPath } from 'node:url'
import { setup } from '@nuxt/test-utils/e2e'
import { afterAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { USER_ROLE } from '../../src/enums/user.enum'
import { login, resetTestDatabase, seedUser } from './helpers/auth-fixtures'
import { requireTestDatabaseEnv } from './helpers/test-database'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'

const PASSWORD = 'a-long-enough-password'

// L3 : l'attribut Secure et le préfixe __Host- suivent NUXT_AUTH_SECURE_COOKIE, pas NODE_ENV.
describe('NUXT_AUTH_SECURE_COOKIE=false (local HTTP development only)', async () => {
  const env = requireTestDatabaseEnv()
  const dataSource: DataSource = await resetTestDatabase()
  const user = await seedUser(dataSource, { email: 'plain-cookie@ccc.test', password: PASSWORD, role: USER_ROLE.PARTICIPANT })

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: { ...env, NUXT_AUTH_SECURE_COOKIE: 'false' }
  })

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  it('session and device cookies have neither Secure nor the __Host- prefix', async () => {
    const response = await login(user.email, PASSWORD)
    expect(response.status).toBe(200)
    const cookies = response.headers.getSetCookie()
    const session = cookies.find((entry) => entry.startsWith('ccc_session='))
    const device = cookies.find((entry) => entry.startsWith('ccc_device='))
    expect(session).toBeDefined()
    expect(device).toBeDefined()
    expect(cookies.some((entry) => entry.startsWith('__Host-'))).toBe(false)
    for (const cookie of [session!, device!]) {
      expect(cookie).toMatch(/HttpOnly/i)
      expect(cookie).not.toMatch(/;\s*Secure/i)
    }
  })
})

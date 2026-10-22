import { fileURLToPath } from 'node:url'
import { setup } from '@nuxt/test-utils/e2e'
import { afterAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { USER_ROLE, USER_STATUS } from '../../src/enums/user.enum'
import { InvitationEntity } from '../../src/server/db/typeorm/entities/invitation.entity'
import { UserEntity } from '../../src/server/db/typeorm/entities/user.entity'
import { cookieHeaderOf, jsonPost, login, resetTestDatabase, seedUser } from './helpers/auth-fixtures'
import { TEST_SITE_URL } from './helpers/mail-capture'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'
import { requireTestDatabaseEnv } from './helpers/test-database'

const PASSWORD = 'a-long-enough-password'
const IDENTITY = { email: 'unsent@ccc.test', firstName: 'Jeanne', lastName: 'Dupont' }

// Vrai adaptateur SMTP, pointé sur un port fermé : l'envoi échoue, comme un fournisseur injoignable.
describe('invitation email failure', async () => {
  const env = requireTestDatabaseEnv()
  const dataSource: DataSource = await resetTestDatabase()
  const admin = await seedUser(dataSource, { email: 'boss@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN })

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: {
      ...env,
      NUXT_MAIL_TRANSPORT: 'smtp',
      NUXT_MAIL_HOST: '127.0.0.1',
      NUXT_MAIL_PORT: '1',
      NUXT_PUBLIC_SITE_URL: TEST_SITE_URL
    }
  })

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  it('creates the account anyway, answers invitationSent false, and the resend stays possible', async () => {
    const cookie = cookieHeaderOf(await login(admin.email, PASSWORD))
    const created = await jsonPost('/api/v1/competiteurs', IDENTITY, { Cookie: cookie })
    expect(created.status).toBe(201)
    const body = await created.json() as { competitorId: string, invitationSent: boolean }
    expect(body.invitationSent).toBe(false)

    const user = await dataSource.getRepository(UserEntity).findOneByOrFail({ competitorId: body.competitorId })
    expect(user.status).toBe(USER_STATUS.INVITED)
    expect(await dataSource.getRepository(InvitationEntity).countBy({ userId: user.id })).toBe(1)

    // Une seule horloge (celle de JS) : `createdAt` vient du now() de Postgres, qui peut différer d'une milliseconde.
    const beforeResend = Date.now()
    const resent = await jsonPost(`/api/v1/competiteurs/${body.competitorId}/invitation`, {}, { Cookie: cookie })
    expect(resent.status).toBe(200)
    expect(await resent.json()).toMatchObject({ invitationSent: false })
    const rows = await dataSource.getRepository(InvitationEntity).find({ where: { userId: user.id }, order: { createdAt: 'ASC' } })
    expect(rows).toHaveLength(2)
    // L'ancien lien est invalidé au renvoi : son échéance est ramenée à l'instant du renvoi (horloge JS du serveur).
    expect(rows[0]!.expiresAt.getTime()).toBeGreaterThanOrEqual(beforeResend)
    expect(rows[0]!.expiresAt.getTime()).toBeLessThanOrEqual(Date.now())
    expect(rows[1]!.expiresAt.getTime()).toBeGreaterThan(Date.now())
  })
})

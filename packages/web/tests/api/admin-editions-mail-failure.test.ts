import 'reflect-metadata'
import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { USER_ROLE } from '../../src/enums/user.enum'
import type { IAddParticipantResult, IEditionSummary } from '../../src/interfaces/edition.interface'
import { ParticipationEntity } from '../../src/server/db/typeorm/entities/participation.entity'
import { cookieHeaderOf, login, resetTestDatabase, seedUser } from './helpers/auth-fixtures'
import { TEST_SITE_URL } from './helpers/mail-capture'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'
import { requireTestDatabaseEnv } from './helpers/test-database'

const PASSWORD = 'a-long-enough-password'
let dataSource: DataSource
let adminCookie: string

describe('POST /editions/{id}/participants with a failing mail transport (B-10)', async () => {
  const env = requireTestDatabaseEnv()
  dataSource = await resetTestDatabase()
  await seedUser(dataSource, { email: 'boss@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN })

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    // SMTP vers un port fermé : l'envoi échoue, le compte et l'inscription doivent rester.
    env: { ...env, NUXT_MAIL_TRANSPORT: 'smtp', NUXT_MAIL_HOST: '127.0.0.1', NUXT_MAIL_PORT: '1', NUXT_PUBLIC_SITE_URL: TEST_SITE_URL }
  })

  beforeAll(async () => {
    adminCookie = cookieHeaderOf(await login('boss@ccc.test', PASSWORD))
  })

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  it('keeps the account and the participation and answers invitationSent false', async () => {
    const headers = { 'Content-Type': 'application/json', Cookie: adminCookie }
    const edition = await (await fetch('/api/v1/editions', { method: 'POST', headers, body: JSON.stringify({ year: 2080, name: 'Mail KO' }) })).json() as IEditionSummary
    const response = await fetch(`/api/v1/editions/${edition.id}/participants`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ newCompetitor: { email: 'ko@ccc.test', firstName: 'Kim', lastName: 'Ko' } })
    })
    expect(response.status).toBe(201)
    const body = await response.json() as IAddParticipantResult
    expect(body.invitationSent).toBe(false)
    expect(await dataSource.getRepository(ParticipationEntity).countBy({ editionId: edition.id })).toBe(1)
    expect(await dataSource.query('SELECT 1 FROM users WHERE email = $1', ['ko@ccc.test'])).toHaveLength(1)
    expect(await dataSource.query('SELECT 1 FROM invitations')).toHaveLength(1)
  })
})

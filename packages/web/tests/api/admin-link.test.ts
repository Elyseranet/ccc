import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { USER_ROLE, USER_STATUS } from '../../src/enums/user.enum'
import { createAdminWithInvitation } from '../../src/utils/create-admin.util'
import { CompetitorEntity } from '../../src/server/db/typeorm/entities/competitor.entity'
import { UserEntity } from '../../src/server/db/typeorm/entities/user.entity'
import { cookieHeaderOf, getWith, jsonPost, login, resetTestDatabase, seedUser } from './helpers/auth-fixtures'
import { createMailCapture, TEST_SITE_URL, tokenFromMail } from './helpers/mail-capture'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'
import { requireTestDatabaseEnv } from './helpers/test-database'

const PASSWORD = 'a-long-enough-password'
const IDENTITY = { firstName: 'Prenom', lastName: 'Nom', nickname: 'Pseudo', phone: '+33 6 12 34 56 78' }

describe('link an admin account to a player card (B-32)', async () => {
  const env = requireTestDatabaseEnv()
  const mails = await createMailCapture()
  const dataSource: DataSource = await resetTestDatabase()
  const boss = await seedUser(dataSource, { email: 'boss@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN })
  const participant = await seedUser(dataSource, { email: 'player@ccc.test', password: PASSWORD, role: USER_ROLE.PARTICIPANT, withCompetitor: true })

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: { ...env, ...mails.env, NUXT_AUTH_LOGIN_RATE_LIMIT_MAX_IP_ATTEMPTS: '1000', NUXT_RATE_LIMIT_INVITATION_TOKEN_MAX_REQUESTS: '1000' }
  })

  afterAll(async () => {
    await mails.dispose()
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  const competitors = dataSource.getRepository(CompetitorEntity)
  const users = dataSource.getRepository(UserEntity)
  const put = (id: string, email: string, cookie?: string): Promise<Response> =>
    fetch(`/api/v1/competiteurs/${id}/compte`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
      body: JSON.stringify({ email })
    })
  const newCard = (displayName: string): Promise<CompetitorEntity> => competitors.save({ displayName })
  /** Fiche créée par `POST /competiteurs` : compte INVITED, mail d'invitation envoyé. */
  const createInvitedCard = async (email: string): Promise<{ competitorId: string, token: string }> => {
    const created = await jsonPost('/api/v1/competiteurs', { ...IDENTITY, email }, { Cookie: adminCookie })
    const { competitorId } = await created.json() as { competitorId: string }
    return { competitorId, token: tokenFromMail((await mails.read()).at(-1)!) }
  }

  let adminCookie = ''
  let participantCookie = ''

  it('logs in the actors', async () => {
    adminCookie = cookieHeaderOf(await login(boss.email, PASSWORD))
    participantCookie = cookieHeaderOf(await login(participant.email, PASSWORD))
  })

  it('links an ACTIVE admin to a card without account: 200 linked, GET /moi carries the card, no mail', async () => {
    const admin = await seedUser(dataSource, { email: 'active.admin@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN })
    const card = await newCard('Admin Actif')
    const sentBefore = (await mails.read()).length

    const response = await put(card.id, 'Active.Admin@ccc.test', adminCookie)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ accountStatus: USER_STATUS.ACTIVE, linked: true, invitationSent: false, invitationExpiresAt: null })
    expect((await users.findOneByOrFail({ id: admin.id })).competitorId).toBe(card.id)
    expect((await mails.read()).length).toBe(sentBefore)

    const me = await (await getWith('/api/v1/moi', cookieHeaderOf(await login(admin.email, PASSWORD)))).json() as { role: string, competitor: { id: string } | null }
    expect(me.role).toBe(USER_ROLE.ADMIN)
    expect(me.competitor?.id).toBe(card.id)
  })

  it('links an INVITED admin: accountStatus INVITED, its invitation stays valid', async () => {
    const link = await createAdminWithInvitation(dataSource, 'invited.admin@ccc.test', TEST_SITE_URL)
    const token = link.split('/').pop()!
    const card = await newCard('Admin Invité')

    const response = await put(card.id, 'invited.admin@ccc.test', adminCookie)
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ accountStatus: USER_STATUS.INVITED, linked: true, invitationSent: false, invitationExpiresAt: null })
    expect((await users.findOneByOrFail({ email: 'invited.admin@ccc.test' })).competitorId).toBe(card.id)
    expect((await getWith(`/api/v1/auth/invitation/${token}`)).status).toBe(200)
  })

  it('deletes the INVITED account of the card (its link becomes 404) and links the admin', async () => {
    const { competitorId, token } = await createInvitedCard('never.came@ccc.test')
    const invited = await users.findOneByOrFail({ competitorId })
    const admin = await seedUser(dataSource, { email: 'swap.admin@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN })
    const sentBefore = (await mails.read()).length

    const response = await put(competitorId, 'swap.admin@ccc.test', adminCookie)
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ linked: true, accountStatus: USER_STATUS.ACTIVE })
    expect(await users.findOneBy({ id: invited.id })).toBeNull()
    expect((await users.findOneByOrFail({ id: admin.id })).competitorId).toBe(competitorId)
    expect((await getWith(`/api/v1/auth/invitation/${token}`)).status).toBe(404)
    expect((await mails.read()).length).toBe(sentBefore)
  })

  it('refuses a card with an ACTIVE account (409 ACCOUNT_ACTIVE), writing nothing', async () => {
    const admin = await seedUser(dataSource, { email: 'refused.admin@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN })
    const response = await put(participant.competitorId!, 'refused.admin@ccc.test', adminCookie)
    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({ code: API_ERROR_CODE.ACCOUNT_ACTIVE })
    expect((await users.findOneByOrFail({ id: admin.id })).competitorId).toBeNull()
    expect(await users.findOneBy({ email: participant.email })).not.toBeNull()
  })

  it('refuses an admin already linked elsewhere (409 ACCOUNT_ALREADY_LINKED), keeping both links', async () => {
    const admin = await seedUser(dataSource, { email: 'linked.admin@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN, withCompetitor: true })
    const other = await newCard('Autre Fiche')
    const response = await put(other.id, 'linked.admin@ccc.test', adminCookie)
    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({ code: API_ERROR_CODE.ACCOUNT_ALREADY_LINKED })
    expect((await users.findOneByOrFail({ id: admin.id })).competitorId).toBe(admin.competitorId)
    expect(await users.countBy({ competitorId: other.id })).toBe(0)
  })

  it('keeps the INVITED account of the card when the admin is refused (rollback)', async () => {
    const { competitorId } = await createInvitedCard('kept@ccc.test')
    await seedUser(dataSource, { email: 'busy.admin@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN, withCompetitor: true })
    expect((await put(competitorId, 'busy.admin@ccc.test', adminCookie)).status).toBe(409)
    expect(await users.countBy({ competitorId })).toBe(1)
  })

  it('does not link a PARTICIPANT email (409 EMAIL_ALREADY_USED, unchanged)', async () => {
    const card = await newCard('Fiche Libre')
    const response = await put(card.id, participant.email, adminCookie)
    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({ code: API_ERROR_CODE.EMAIL_ALREADY_USED })
  })

  it('still creates a player account with linked: false (B-29 non-regression)', async () => {
    const card = await newCard('Joueur Archive')
    const response = await put(card.id, 'archive.player@ccc.test', adminCookie)
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ accountStatus: USER_STATUS.INVITED, linked: false, invitationSent: true })
  })

  it('lets only one of two concurrent PUTs of the same admin succeed', async () => {
    const admin = await seedUser(dataSource, { email: 'race.admin@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN })
    const [a, b] = [await newCard('Course A'), await newCard('Course B')]
    const responses = await Promise.all([put(a.id, 'race.admin@ccc.test', adminCookie), put(b.id, 'race.admin@ccc.test', adminCookie)])
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409])
    expect((await users.findOneByOrFail({ id: admin.id })).competitorId).not.toBeNull()
    expect(await users.countBy({ competitorId: a.id }) + await users.countBy({ competitorId: b.id })).toBe(1)
  })

  it('answers 401 anonymous and 403 participant', async () => {
    const card = await newCard('Garde')
    expect((await put(card.id, 'boss@ccc.test')).status).toBe(401)
    expect((await put(card.id, 'boss@ccc.test', participantCookie)).status).toBe(403)
  })
})

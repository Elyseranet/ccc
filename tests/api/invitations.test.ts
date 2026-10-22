import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { USER_ROLE, USER_STATUS } from '../../src/enums/user.enum'
import { INVITATION_TTL_MS } from '../../src/consts/invitation.const'
import { createAdminWithInvitation } from '../../src/utils/create-admin.util'
import { CompetitorEntity } from '../../src/server/db/typeorm/entities/competitor.entity'
import { InvitationEntity } from '../../src/server/db/typeorm/entities/invitation.entity'
import { UserEntity } from '../../src/server/db/typeorm/entities/user.entity'
import { cookieHeaderOf, getWith, jsonPost, login, resetTestDatabase, seedUser, setCookieOf } from './helpers/auth-fixtures'
import { createMailCapture, TEST_SITE_URL, tokenFromMail } from './helpers/mail-capture'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'
import { requireTestDatabaseEnv } from './helpers/test-database'

const PASSWORD = 'a-long-enough-password'
const NEW_PASSWORD = 'another-long-enough-password'
const IDENTITY = { email: 'Jeanne.Dupont@CCC.test', firstName: 'Jeanne', lastName: 'Dupont', nickname: 'Jeannot', phone: '+33 6 12 34 56 78' }

describe('invitations (B-09)', async () => {
  const env = requireTestDatabaseEnv()
  const mails = await createMailCapture()
  const dataSource: DataSource = await resetTestDatabase()

  // Le premier administrateur entre par le lien de `user:create-admin`, comme en production.
  const adminLink = await createAdminWithInvitation(dataSource, 'boss@ccc.test', TEST_SITE_URL)
  const participant = await seedUser(dataSource, { email: 'player@ccc.test', password: PASSWORD, role: USER_ROLE.PARTICIPANT, withCompetitor: true })

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: {
      ...env,
      ...mails.env,
      NUXT_AUTH_LOGIN_RATE_LIMIT_MAX_IP_ATTEMPTS: '1000',
      NUXT_RATE_LIMIT_INVITATION_TOKEN_MAX_REQUESTS: '1000'
    }
  })

  afterAll(async () => {
    await mails.dispose()
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  const invitationPath = (token: string): string => `/api/v1/auth/invitation/${token}`
  const post = (path: string, body: unknown, cookie?: string): Promise<Response> => jsonPost(path, body, cookie ? { Cookie: cookie } : {})
  const countRows = async (): Promise<[number, number, number]> => [
    await dataSource.getRepository(CompetitorEntity).count(),
    await dataSource.getRepository(UserEntity).count(),
    await dataSource.getRepository(InvitationEntity).count()
  ]

  let adminCookie = ''
  let participantCookie = ''

  it('the admin link from user:create-admin opens a session, once', async () => {
    const token = adminLink.split('/').pop()!
    expect(adminLink).toBe(`${TEST_SITE_URL}/invitation/${token}`)
    const preview = await getWith(invitationPath(token))
    expect(preview.status).toBe(200)
    expect(await preview.json()).toEqual({ firstName: null, nickname: null })

    const accepted = await post(invitationPath(token), { password: PASSWORD })
    expect(accepted.status).toBe(200)
    expect(await accepted.json()).toMatchObject({ email: 'boss@ccc.test', role: USER_ROLE.ADMIN, competitor: null })
    const cookie = setCookieOf(accepted)!
    expect(cookie).toMatch(/HttpOnly/i)
    expect(cookie).toMatch(/Secure/i)
    expect(cookie.startsWith('__Host-ccc_session=')).toBe(true)
    adminCookie = cookieHeaderOf(accepted)

    expect((await post(invitationPath(token), { password: PASSWORD })).status).toBe(410)
    expect((await getWith(invitationPath(token))).status).toBe(410)
    expect((await getWith('/api/v1/moi', adminCookie)).status).toBe(200)
  })

  describe('POST /competiteurs', () => {
    it('answers 401 anonymous and 403 for a participant', async () => {
      participantCookie = cookieHeaderOf(await login(participant.email, PASSWORD))
      expect((await post('/api/v1/competiteurs', IDENTITY)).status).toBe(401)
      expect((await post('/api/v1/competiteurs', IDENTITY, participantCookie)).status).toBe(403)
      expect((await post(`/api/v1/competiteurs/${participant.competitorId}/invitation`, {})).status).toBe(401)
      expect((await post(`/api/v1/competiteurs/${participant.competitorId}/invitation`, {}, participantCookie)).status).toBe(403)
    })

    it('creates competitor, INVITED account and invitation, and sends one email with a siteUrl link', async () => {
      const before = (await mails.read()).length
      const response = await fetch('/api/v1/competiteurs', {
        method: 'POST',
        // Un en-tête Host ou X-Forwarded-Host forgé ne doit jamais changer le domaine du lien.
        headers: { 'Content-Type': 'application/json', Cookie: adminCookie, 'X-Forwarded-Host': 'evil.example', Host: 'evil.example' },
        body: JSON.stringify(IDENTITY)
      })
      expect(response.status).toBe(201)
      const body = await response.json() as { competitorId: string, invitationSent: boolean, invitationExpiresAt: string }
      expect(body.invitationSent).toBe(true)
      expect(Object.keys(body).sort()).toEqual(['competitorId', 'invitationExpiresAt', 'invitationSent'])

      const sent = (await mails.read()).slice(before)
      expect(sent).toHaveLength(1)
      expect(sent[0]!.to).toBe('jeanne.dupont@ccc.test')
      expect(sent[0]!.text).toContain(`${TEST_SITE_URL}/invitation/`)
      expect(sent[0]!.text).not.toContain('evil.example')
      expect(sent[0]!.html).not.toContain('evil.example')

      const user = await dataSource.getRepository(UserEntity).findOneByOrFail({ competitorId: body.competitorId })
      expect(user).toMatchObject({ email: 'jeanne.dupont@ccc.test', role: USER_ROLE.PARTICIPANT, status: USER_STATUS.INVITED })
      const invitation = await dataSource.getRepository(InvitationEntity).findOneByOrFail({ userId: user.id })
      expect(new Date(body.invitationExpiresAt).getTime()).toBe(invitation.expiresAt.getTime())
      expect(invitation.expiresAt.getTime() - invitation.createdAt.getTime()).toBeGreaterThan(INVITATION_TTL_MS - 5000)
      expect(invitation.expiresAt.getTime() - invitation.createdAt.getTime()).toBeLessThan(INVITATION_TTL_MS + 5000)
    })

    it('never stores the clear token, and never returns it in the response', async () => {
      const response = await post('/api/v1/competiteurs', { ...IDENTITY, email: 'notoken@ccc.test' }, adminCookie)
      const raw = await response.text()
      const token = tokenFromMail((await mails.read()).at(-1)!)
      expect(raw).not.toContain(token)
      const dump = JSON.stringify(await dataSource.query(`SELECT to_jsonb(i) AS row FROM invitations i`))
        + JSON.stringify(await dataSource.query(`SELECT to_jsonb(u) AS row FROM users u`))
        + JSON.stringify(await dataSource.query(`SELECT to_jsonb(c) AS row FROM competitors c`))
      expect(dump).not.toContain(token)
    })

    it('answers 409 EMAIL_ALREADY_USED for a taken email (any case) without creating anything', async () => {
      const before = await countRows()
      const mailsBefore = (await mails.read()).length
      const response = await post('/api/v1/competiteurs', { ...IDENTITY, email: 'JEANNE.DUPONT@ccc.test', firstName: 'Autre' }, adminCookie)
      expect(response.status).toBe(409)
      expect(await response.json()).toMatchObject({ statusCode: 409, code: API_ERROR_CODE.EMAIL_ALREADY_USED })
      expect(await countRows()).toEqual(before)
      expect(await mails.read()).toHaveLength(mailsBefore)
    })

    it('validates the body: unknown fields (avatar included), bad email, missing names and oversize', async () => {
      const before = await countRows()
      for (const body of [
        { ...IDENTITY, email: 'free1@ccc.test', avatar: 'data:image/png;base64,AAAA' },
        { ...IDENTITY, email: 'free2@ccc.test', avatarUrl: 'https://x.test/a.png' },
        { ...IDENTITY, email: 'free3@ccc.test', role: 'ADMIN' },
        { ...IDENTITY, email: 'not-an-email' },
        { ...IDENTITY, email: 'free4@ccc.test', firstName: '' },
        { ...IDENTITY, email: 'free5@ccc.test', phone: 'call me' },
        { firstName: 'Seul' }
      ]) {
        const response = await post('/api/v1/competiteurs', body, adminCookie)
        expect(response.status, JSON.stringify(body)).toBe(400)
        expect((await response.json() as { code: string }).code).toBe(API_ERROR_CODE.VALIDATION_FAILED)
      }
      const oversize = await post('/api/v1/competiteurs', { ...IDENTITY, email: 'big@ccc.test', nickname: 'x'.repeat(20_000) }, adminCookie)
      expect(oversize.status).toBe(413)
      expect(await countRows()).toEqual(before)
    })
  })

  describe('first connection', () => {
    let competitorId = ''
    let token = ''

    it('prefills first name and nickname, then completes the profile and opens a session', async () => {
      const created = await post('/api/v1/competiteurs', { ...IDENTITY, email: 'first@ccc.test' }, adminCookie)
      competitorId = (await created.json() as { competitorId: string }).competitorId
      token = tokenFromMail((await mails.read()).at(-1)!)

      const preview = await getWith(invitationPath(token))
      expect(preview.status).toBe(200)
      expect(await preview.json()).toEqual({ firstName: 'Jeanne', nickname: 'Jeannot' })

      const accepted = await post(invitationPath(token), { password: NEW_PASSWORD, lastName: 'Martin', nickname: 'Jeannette', phone: '+33 6 00 00 00 01' })
      expect(accepted.status).toBe(200)
      const me = await accepted.json() as { email: string, role: string, competitor: Record<string, unknown> }
      expect(me).toMatchObject({ email: 'first@ccc.test', role: USER_ROLE.PARTICIPANT })
      expect(me.competitor).toMatchObject({ id: competitorId, firstName: 'Jeanne', lastName: 'Martin', displayName: 'Jeanne Martin', nickname: 'Jeannette', phone: '+33 6 00 00 00 01' })
      expect(JSON.stringify(me)).not.toMatch(/passwordHash|scrypt/)

      const cookie = cookieHeaderOf(accepted)
      expect((await getWith('/api/v1/moi', cookie)).status).toBe(200)
      expect((await login('first@ccc.test', NEW_PASSWORD)).status).toBe(200)
    })

    it('answers 410 on a second use, for GET and POST, and keeps the first password', async () => {
      expect((await post(invitationPath(token), { password: 'yet-another-long-password' })).status).toBe(410)
      expect((await getWith(invitationPath(token))).status).toBe(410)
      expect((await login('first@ccc.test', 'yet-another-long-password')).status).toBe(401)
      expect((await login('first@ccc.test', NEW_PASSWORD)).status).toBe(200)
    })

    it('answers 404 for an unknown or malformed token', async () => {
      expect((await getWith(invitationPath('Z'.repeat(43)))).status).toBe(404)
      expect((await post(invitationPath('Z'.repeat(43)), { password: PASSWORD })).status).toBe(404)
      expect((await getWith(invitationPath('short'))).status).toBe(404)
    })

    it('rejects a short password and unknown fields (avatar included) with 400, leaving the token usable', async () => {
      await post('/api/v1/competiteurs', { ...IDENTITY, email: 'strict@ccc.test' }, adminCookie)
      const strictToken = tokenFromMail((await mails.read()).at(-1)!)
      expect((await post(invitationPath(strictToken), { password: 'too-short' })).status).toBe(400)
      expect((await post(invitationPath(strictToken), { password: PASSWORD, avatar: 'x' })).status).toBe(400)
      expect((await post(invitationPath(strictToken), { password: PASSWORD, role: 'ADMIN' })).status).toBe(400)
      expect((await getWith(invitationPath(strictToken))).status).toBe(200)
    })

    it('answers 410 for a token older than 7 days', async () => {
      await post('/api/v1/competiteurs', { ...IDENTITY, email: 'late@ccc.test' }, adminCookie)
      const lateToken = tokenFromMail((await mails.read()).at(-1)!)
      const user = await dataSource.getRepository(UserEntity).findOneByOrFail({ email: 'late@ccc.test' })
      await dataSource.getRepository(InvitationEntity).update({ userId: user.id }, { expiresAt: new Date(Date.now() - 1000) })
      expect((await getWith(invitationPath(lateToken))).status).toBe(410)
      expect((await post(invitationPath(lateToken), { password: PASSWORD })).status).toBe(410)
      expect((await dataSource.getRepository(UserEntity).findOneByOrFail({ id: user.id })).status).toBe(USER_STATUS.INVITED)
    })
  })

  describe('POST /competiteurs/{id}/invitation (resend)', () => {
    it('invalidates the old link (410) and the new one works', async () => {
      const created = await post('/api/v1/competiteurs', { ...IDENTITY, email: 'resend@ccc.test' }, adminCookie)
      const { competitorId } = await created.json() as { competitorId: string }
      const oldToken = tokenFromMail((await mails.read()).at(-1)!)
      const sentBefore = (await mails.read()).length

      const resent = await post(`/api/v1/competiteurs/${competitorId}/invitation`, {}, adminCookie)
      expect(resent.status).toBe(200)
      expect(await resent.json()).toMatchObject({ invitationSent: true })
      const newMails = (await mails.read()).slice(sentBefore)
      expect(newMails).toHaveLength(1)
      const newToken = tokenFromMail(newMails[0]!)
      expect(newToken).not.toBe(oldToken)

      expect((await getWith(invitationPath(oldToken))).status).toBe(410)
      expect((await post(invitationPath(oldToken), { password: PASSWORD })).status).toBe(410)
      expect((await getWith(invitationPath(newToken))).status).toBe(200)
      expect((await post(invitationPath(newToken), { password: PASSWORD })).status).toBe(200)
    })

    it('answers 404 unknown competitor, 400 bad id, 422 no account, 409 active account', async () => {
      expect((await post('/api/v1/competiteurs/00000000-0000-4000-8000-000000000000/invitation', {}, adminCookie)).status).toBe(404)
      expect((await post('/api/v1/competiteurs/not-a-uuid/invitation', {}, adminCookie)).status).toBe(400)
      const historic = await dataSource.getRepository(CompetitorEntity).save({ displayName: 'Ancien Joueur' })
      expect((await post(`/api/v1/competiteurs/${historic.id}/invitation`, {}, adminCookie)).status).toBe(422)
      expect((await post(`/api/v1/competiteurs/${participant.competitorId}/invitation`, {}, adminCookie)).status).toBe(409)
    })
  })
})

import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { In } from 'typeorm'
import type { DataSource } from 'typeorm'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { USER_ROLE, USER_STATUS } from '../../src/enums/user.enum'
import type { IAdminAccount, IAdminInvited } from '../../src/interfaces/administrator.interface'
import { CompetitorEntity } from '../../src/server/db/typeorm/entities/competitor.entity'
import { InvitationEntity } from '../../src/server/db/typeorm/entities/invitation.entity'
import { SessionEntity } from '../../src/server/db/typeorm/entities/session.entity'
import { UserEntity } from '../../src/server/db/typeorm/entities/user.entity'
import { inviteAdministrator, resendAdministratorInvitation, revokeAdministrator, updateAdministratorEmail } from '../../src/services/administrator.service'
import { issueInvitation } from '../../src/utils/invitation-store.util'
import { cookieHeaderOf, getWith, jsonPost, login, resetTestDatabase, seedUser } from './helpers/auth-fixtures'
import { createMailCapture, TEST_SITE_URL, tokenFromMail } from './helpers/mail-capture'
import type { ICapturedMail } from './helpers/mail-capture'
import { API_TEST_SETUP_TIMEOUT_MS } from './helpers/nuxt-setup'
import { requireTestDatabaseEnv } from './helpers/test-database'

const PASSWORD = 'a-long-enough-password'
const ADMINS = '/api/v1/admin/administrateurs'
const UNKNOWN_ID = '00000000-0000-4000-8000-000000000000'
const ADMIN_SENTENCE = "L'organisateur de la Cotentin Caps Cup vous a donné un accès administrateur : un compte vient de vous être créé sur le site du CCC."

describe('administrators (B-31)', async () => {
  const env = requireTestDatabaseEnv()
  const mails = await createMailCapture()
  const dataSource: DataSource = await resetTestDatabase()

  const boss = await seedUser(dataSource, { email: 'boss@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN })
  const second = await seedUser(dataSource, { email: 'second@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN })
  const player = await seedUser(dataSource, { email: 'player@ccc.test', password: PASSWORD, role: USER_ROLE.PARTICIPANT, withCompetitor: true })

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    setupTimeout: API_TEST_SETUP_TIMEOUT_MS,
    server: true,
    env: { ...env, ...mails.env, NUXT_PUBLIC_LEGAL_EMAIL: 'contact@ccc.test', NUXT_AUTH_LOGIN_RATE_LIMIT_MAX_IP_ATTEMPTS: '1000', NUXT_RATE_LIMIT_INVITATION_TOKEN_MAX_REQUESTS: '1000' }
  })

  afterAll(async () => {
    await mails.dispose()
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  const call = (method: string, path: string, body?: unknown, cookie?: string): Promise<Response> =>
    fetch(path, {
      method,
      headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(cookie ? { Cookie: cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body)
    })
  const invitationPath = (token: string): string => `/api/v1/auth/invitation/${token}`
  const cookieOf = async (email: string): Promise<string> => cookieHeaderOf(await login(email, PASSWORD))
  const mailsSince = async (count: number): Promise<ICapturedMail[]> => (await mails.read()).slice(count)
  const userByEmail = (email: string): Promise<UserEntity> => dataSource.getRepository(UserEntity).findOneByOrFail({ email })

  let bossCookie = ''
  let playerCookie = ''
  beforeAll(async () => {
    bossCookie = await cookieOf(boss.email)
    playerCookie = await cookieOf(player.email)
  })

  /** Ne laisse que `keep` parmi les administrateurs ACTIFS le temps de `run`, puis les rétablit (les tests partagent une base). */
  const withOnlyActiveAdmins = async (keep: string[], run: () => Promise<void>): Promise<void> => {
    const users = dataSource.getRepository(UserEntity)
    const demoted = (await users.findBy({ role: USER_ROLE.ADMIN, status: USER_STATUS.ACTIVE })).map((user) => user.id).filter((id) => !keep.includes(id))
    await users.update({ id: In(demoted) }, { role: USER_ROLE.PARTICIPANT })
    try {
      await run()
    } finally {
      await users.update({ id: In(demoted) }, { role: USER_ROLE.ADMIN })
    }
  }

  /** Invite un email inconnu et renvoie id, jeton du mail et mail. */
  const invite = async (email: string): Promise<{ id: string, token: string, mail: ICapturedMail }> => {
    const before = (await mails.read()).length
    const response = await call('POST', ADMINS, { email }, bossCookie)
    expect(response.status).toBe(201)
    const { id } = await response.json() as IAdminInvited
    const mail = (await mailsSince(before))[0]!
    return { id, token: tokenFromMail(mail), mail }
  }

  describe('guards, on every route', () => {
    const routes: Array<[string, string, unknown?]> = [
      ['GET', ADMINS],
      ['POST', ADMINS, { email: 'guard@ccc.test' }],
      ['POST', `${ADMINS}/${UNKNOWN_ID}/invitation`, {}],
      ['PATCH', `${ADMINS}/${UNKNOWN_ID}`, { email: 'guard@ccc.test' }],
      ['DELETE', `${ADMINS}/${UNKNOWN_ID}`]
    ]
    it.each(routes)('%s %s: 401 anonymous, 403 participant (before reading the body)', async (method, path, body) => {
      const anonymous = await call(method, path, body)
      expect(anonymous.status).toBe(401)
      expect(await anonymous.json()).toMatchObject({ code: API_ERROR_CODE.UNAUTHORIZED })
      const forbidden = await call(method, path, body, playerCookie)
      expect(forbidden.status).toBe(403)
      expect(await forbidden.json()).toMatchObject({ code: API_ERROR_CODE.FORBIDDEN })
      // Corps invalide + participant : 403, jamais 400.
      expect((await call(method, path, method === 'GET' || method === 'DELETE' ? undefined : { nope: 1 }, playerCookie)).status).toBe(403)
    })
  })

  describe('GET /admin/administrateurs', () => {
    it('lists admin accounts, active first then by email, without any hash, with the INVITED expiry and isSelf', async () => {
      const { id } = await invite('aide@ccc.test')
      const response = await getWith(ADMINS, bossCookie)
      expect(response.status).toBe(200)
      expect(response.headers.get('cache-control')).toBe('no-store')
      const raw = await response.text()
      expect(raw).not.toMatch(/passwordHash|password_hash|tokenHash|token_hash|failedLoginCount|throttledUntil/)
      const list = JSON.parse(raw) as IAdminAccount[]
      expect(list.map((entry) => entry.email)).toEqual(['boss@ccc.test', 'second@ccc.test', 'aide@ccc.test'])
      expect(list[0]).toMatchObject({ id: boss.id, status: USER_STATUS.ACTIVE, invitationExpiresAt: null, invitationExpired: false, competitor: null, isSelf: true })
      expect(list[1]).toMatchObject({ id: second.id, isSelf: false })
      expect(list[2]).toMatchObject({ id, status: USER_STATUS.INVITED, invitationExpired: false, competitor: null, lastLoginAt: null, isSelf: false })
      const invitation = await dataSource.getRepository(InvitationEntity).findOneByOrFail({ userId: id })
      expect(list[2]!.invitationExpiresAt).toBe(invitation.expiresAt.toISOString())
      expect(Object.keys(list[0]!).sort()).toEqual(['competitor', 'createdAt', 'email', 'id', 'invitationExpired', 'invitationExpiresAt', 'isSelf', 'lastLoginAt', 'status'])
    })

    it('flags an expired invitation', async () => {
      const { id } = await invite('expired@ccc.test')
      await dataSource.getRepository(InvitationEntity).update({ userId: id }, { expiresAt: new Date(Date.now() - 1000) })
      const list = await (await getWith(ADMINS, bossCookie)).json() as IAdminAccount[]
      expect(list.find((entry) => entry.id === id)).toMatchObject({ invitationExpired: true })
    })
  })

  describe('POST /admin/administrateurs', () => {
    it('creates an ADMIN / INVITED account without a card, sends the admin-variant mail (Q10), and the link activates it', async () => {
      const before = (await mails.read()).length
      const response = await call('POST', ADMINS, { email: '  Nouvel.Admin@CCC.test ' }, bossCookie)
      expect(response.status).toBe(201)
      const body = await response.json() as IAdminInvited
      expect(body).toMatchObject({ accountStatus: USER_STATUS.INVITED, promoted: false, invitationSent: true })
      expect(Object.keys(body).sort()).toEqual(['accountStatus', 'id', 'invitationExpiresAt', 'invitationSent', 'promoted'])
      expect(new Date(body.invitationExpiresAt!).getTime()).toBeGreaterThan(Date.now())

      const user = await userByEmail('nouvel.admin@ccc.test')
      expect(user).toMatchObject({ id: body.id, role: USER_ROLE.ADMIN, status: USER_STATUS.INVITED, competitorId: null })
      const sent = await mailsSince(before)
      expect(sent).toHaveLength(1)
      const mail = sent[0]!
      expect(mail.to).toBe('nouvel.admin@ccc.test')
      expect(mail.subject).toBe('Votre accès administrateur à la Cotentin Caps Cup')
      expect(mail.text).toContain(ADMIN_SENTENCE)
      expect(mail.html).toContain('vous a donné un accès administrateur&nbsp;: un compte vient de vous être créé sur le site du CCC.')
      expect(`${mail.subject}${mail.text}${mail.html}`.toLowerCase()).not.toContain('participant')
      expect(mail.text).toContain(`${TEST_SITE_URL}/invitation/`)

      const accepted = await jsonPost(invitationPath(tokenFromMail(mail)), { password: PASSWORD })
      expect(accepted.status).toBe(200)
      expect(await accepted.json()).toMatchObject({ role: USER_ROLE.ADMIN })
    })

    it('answers 409 ALREADY_ADMIN for an existing admin (any case), writing nothing and sending nothing', async () => {
      const before = (await mails.read()).length
      const rows = await dataSource.getRepository(UserEntity).count()
      const response = await call('POST', ADMINS, { email: 'SECOND@ccc.test' }, bossCookie)
      expect(response.status).toBe(409)
      expect(await response.json()).toMatchObject({ code: API_ERROR_CODE.ALREADY_ADMIN })
      expect(await dataSource.getRepository(UserEntity).count()).toBe(rows)
      expect(await mailsSince(before)).toHaveLength(0)
    })

    it('promotes an INVITED player (Q4): same account and card kept, old link 410, new link, admin-variant mail', async () => {
      const card = await dataSource.getRepository(CompetitorEntity).save({ displayName: 'Invité Promu', firstName: 'Invité' })
      const invited = await dataSource.getRepository(UserEntity).save({
        email: 'promo.invited@ccc.test', role: USER_ROLE.PARTICIPANT, status: USER_STATUS.INVITED, passwordHash: null, competitorId: card.id
      })
      const { invitationToken: oldToken } = await issueInvitation(dataSource.manager, invited.id)
      const before = (await mails.read()).length

      const response = await call('POST', ADMINS, { email: 'promo.invited@ccc.test', confirmPromotion: true }, bossCookie)
      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({ id: invited.id, accountStatus: USER_STATUS.INVITED, promoted: true, invitationSent: true })
      expect(await userByEmail('promo.invited@ccc.test')).toMatchObject({ id: invited.id, role: USER_ROLE.ADMIN, status: USER_STATUS.INVITED, competitorId: card.id })

      const sent = await mailsSince(before)
      expect(sent).toHaveLength(1)
      expect(sent[0]!.subject).toBe('Votre accès administrateur à la Cotentin Caps Cup')
      expect(sent[0]!.text).toContain(ADMIN_SENTENCE)
      expect(sent[0]!.text.startsWith('Bonjour Invité,')).toBe(true)
      expect((await getWith(invitationPath(oldToken))).status).toBe(410)
      const preview = await getWith(invitationPath(tokenFromMail(sent[0]!)))
      expect(preview.status).toBe(200)
      expect(await preview.json()).toMatchObject({ firstName: 'Invité' })
    })

    it('promotes an ACTIVE player (Q4, Q5): role ADMIN, card, password and sessions kept, information mail without link', async () => {
      const promoted = await seedUser(dataSource, { email: 'promo.active@ccc.test', password: PASSWORD, role: USER_ROLE.PARTICIPANT, withCompetitor: true })
      const cookie = await cookieOf(promoted.email)
      expect((await call('GET', ADMINS, undefined, cookie)).status).toBe(403)
      const before = (await mails.read()).length

      const response = await call('POST', ADMINS, { email: 'promo.active@ccc.test', confirmPromotion: true }, bossCookie)
      expect(response.status).toBe(200)
      expect(await response.json()).toEqual({ id: promoted.id, accountStatus: USER_STATUS.ACTIVE, promoted: true, invitationSent: true, invitationExpiresAt: null })
      expect(await userByEmail('promo.active@ccc.test')).toMatchObject({ role: USER_ROLE.ADMIN, status: USER_STATUS.ACTIVE, competitorId: promoted.competitorId })
      expect(await dataSource.getRepository(InvitationEntity).countBy({ userId: promoted.id })).toBe(0)

      // La session existante, jamais révoquée, ouvre aussitôt l'administration.
      expect((await call('GET', ADMINS, undefined, cookie)).status).toBe(200)

      const sent = await mailsSince(before)
      expect(sent).toHaveLength(1)
      const mail = sent[0]!
      expect(mail.to).toBe('promo.active@ccc.test')
      expect(mail.subject).toBe('Vous êtes maintenant administrateur de la Cotentin Caps Cup')
      expect(`${mail.text}${mail.html}`).not.toContain('/invitation/')
      expect(mail.html).not.toContain('class="cta"')
      expect(mail.text).not.toContain('Ce lien')
      // Le contact vient de `public.legal.email` (NUXT_PUBLIC_LEGAL_EMAIL).
      expect(mail.text).toContain("Si vous n'attendiez pas ce message, écrivez à contact@ccc.test.")
    })

    it('answers 409 PROMOTION_CONFIRMATION_REQUIRED for a player account without confirmation: displayName in details, nothing written, no mail (B-33)', async () => {
      const card = await dataSource.getRepository(CompetitorEntity).save({ displayName: 'Camille Confirmée' })
      const withCard = await dataSource.getRepository(UserEntity).save({
        email: 'confirm.card@ccc.test', role: USER_ROLE.PARTICIPANT, status: USER_STATUS.INVITED, passwordHash: null, competitorId: card.id
      })
      await issueInvitation(dataSource.manager, withCard.id)
      const withoutCard = await seedUser(dataSource, { email: 'confirm.nocard@ccc.test', password: PASSWORD, role: USER_ROLE.PARTICIPANT })
      const invitationsBefore = await dataSource.getRepository(InvitationEntity).count()
      const before = (await mails.read()).length

      const expectations: Array<[string, unknown, string]> = [
        ['confirm.card@ccc.test', {}, 'Camille Confirmée'],
        ['CONFIRM.card@ccc.test', { confirmPromotion: false }, 'Camille Confirmée'],
        ['confirm.nocard@ccc.test', {}, 'confirm.nocard@ccc.test']
      ]
      for (const [email, extra, displayName] of expectations) {
        const response = await call('POST', ADMINS, { email, ...(extra as object) }, bossCookie)
        expect(response.status).toBe(409)
        expect(await response.json()).toEqual({
          statusCode: 409,
          code: API_ERROR_CODE.PROMOTION_CONFIRMATION_REQUIRED,
          message: 'This email belongs to a player account: confirm to make it an administrator',
          details: { displayName }
        })
      }
      expect(await userByEmail('confirm.card@ccc.test')).toMatchObject({ role: USER_ROLE.PARTICIPANT, status: USER_STATUS.INVITED })
      expect((await dataSource.getRepository(UserEntity).findOneByOrFail({ id: withoutCard.id })).role).toBe(USER_ROLE.PARTICIPANT)
      expect(await dataSource.getRepository(InvitationEntity).count()).toBe(invitationsBefore)
      expect(await mailsSince(before)).toHaveLength(0)

      // Avec la confirmation : comportement B-31.
      const confirmed = await call('POST', ADMINS, { email: 'confirm.nocard@ccc.test', confirmPromotion: true }, bossCookie)
      expect(confirmed.status).toBe(200)
      expect(await confirmed.json()).toMatchObject({ id: withoutCard.id, promoted: true, accountStatus: USER_STATUS.ACTIVE })
      expect((await dataSource.getRepository(UserEntity).findOneByOrFail({ id: withoutCard.id })).role).toBe(USER_ROLE.ADMIN)
      expect(await mailsSince(before)).toHaveLength(1)
    })

    it('needs no confirmation for an unknown email or an existing admin (ALREADY_ADMIN wins), and keeps a strict body', async () => {
      expect((await call('POST', ADMINS, { email: 'brand.new@ccc.test', confirmPromotion: true }, bossCookie)).status).toBe(201)
      const already = await call('POST', ADMINS, { email: 'second@ccc.test' }, bossCookie)
      expect(already.status).toBe(409)
      expect(await already.json()).toMatchObject({ code: API_ERROR_CODE.ALREADY_ADMIN })
      for (const body of [{ email: 'x@ccc.test', confirmPromotion: 'true' }, { email: 'x@ccc.test', confirmPromotion: 1 }, { email: 'x@ccc.test', confirm: true }]) {
        expect((await call('POST', ADMINS, body, bossCookie)).status).toBe(400)
      }
    })

    it('answers 400 for a bad email, a missing email or an extra field, writing nothing', async () => {
      const rows = await dataSource.getRepository(UserEntity).count()
      for (const body of [{ email: 'not-an-email' }, {}, { email: 'x@ccc.test', role: 'ADMIN' }, { email: `${'a'.repeat(250)}@ccc.test` }]) {
        const response = await call('POST', ADMINS, body, bossCookie)
        expect(response.status).toBe(400)
        expect(await response.json()).toMatchObject({ code: API_ERROR_CODE.VALIDATION_FAILED })
      }
      expect(await dataSource.getRepository(UserEntity).count()).toBe(rows)
    })
  })

  describe('POST /admin/administrateurs/{id}/invitation', () => {
    it('resends: old link 410, new link works, admin-variant mail to the same address', async () => {
      const { id, token: oldToken } = await invite('resend@ccc.test')
      const before = (await mails.read()).length
      const response = await call('POST', `${ADMINS}/${id}/invitation`, {}, bossCookie)
      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({ invitationSent: true })
      const sent = await mailsSince(before)
      expect(sent).toHaveLength(1)
      expect(sent[0]!.to).toBe('resend@ccc.test')
      expect(sent[0]!.subject).toBe('Votre accès administrateur à la Cotentin Caps Cup')
      expect((await getWith(invitationPath(oldToken))).status).toBe(410)
      expect((await getWith(invitationPath(tokenFromMail(sent[0]!)))).status).toBe(200)
    })

    it('answers 409 ACCOUNT_ACTIVE, 404 unknown or non-admin account, 400 bad id', async () => {
      const active = await call('POST', `${ADMINS}/${second.id}/invitation`, {}, bossCookie)
      expect(active.status).toBe(409)
      expect(await active.json()).toMatchObject({ code: API_ERROR_CODE.ACCOUNT_ACTIVE })
      expect((await call('POST', `${ADMINS}/${UNKNOWN_ID}/invitation`, {}, bossCookie)).status).toBe(404)
      expect((await call('POST', `${ADMINS}/${player.id}/invitation`, {}, bossCookie)).status).toBe(404)
      expect((await call('POST', `${ADMINS}/not-a-uuid/invitation`, {}, bossCookie)).status).toBe(400)
    })
  })

  describe('PATCH /admin/administrateurs/{id}', () => {
    it('corrects the email of a non-activated admin: old link 410, the new address receives the mail', async () => {
      const { id, token: oldToken } = await invite('typo@ccc.test')
      const before = (await mails.read()).length
      const response = await call('PATCH', `${ADMINS}/${id}`, { email: ' Fixed.Admin@ccc.test' }, bossCookie)
      expect(response.status).toBe(200)
      expect(await response.json()).toMatchObject({ invitationSent: true })
      expect((await dataSource.getRepository(UserEntity).findOneByOrFail({ id })).email).toBe('fixed.admin@ccc.test')
      const sent = await mailsSince(before)
      expect(sent).toHaveLength(1)
      expect(sent[0]!.to).toBe('fixed.admin@ccc.test')
      expect(sent[0]!.subject).toBe('Votre accès administrateur à la Cotentin Caps Cup')
      expect((await getWith(invitationPath(oldToken))).status).toBe(410)
      expect((await getWith(invitationPath(tokenFromMail(sent[0]!)))).status).toBe(200)
    })

    it('answers 409 ACCOUNT_ACTIVE for an active admin and 409 EMAIL_ALREADY_USED for an email held by another account', async () => {
      const active = await call('PATCH', `${ADMINS}/${second.id}`, { email: 'other@ccc.test' }, bossCookie)
      expect(active.status).toBe(409)
      expect(await active.json()).toMatchObject({ code: API_ERROR_CODE.ACCOUNT_ACTIVE })
      expect((await userByEmail('second@ccc.test')).id).toBe(second.id)

      const { id, token } = await invite('collide@ccc.test')
      const before = (await mails.read()).length
      const taken = await call('PATCH', `${ADMINS}/${id}`, { email: 'PLAYER@ccc.test' }, bossCookie)
      expect(taken.status).toBe(409)
      expect(await taken.json()).toMatchObject({ code: API_ERROR_CODE.EMAIL_ALREADY_USED })
      expect((await userByEmail('collide@ccc.test')).id).toBe(id)
      expect(await mailsSince(before)).toHaveLength(0)
      expect((await getWith(invitationPath(token))).status).toBe(200)
    })

    it('answers 404 unknown or non-admin account, 400 bad id / email / extra field', async () => {
      expect((await call('PATCH', `${ADMINS}/${UNKNOWN_ID}`, { email: 'x@ccc.test' }, bossCookie)).status).toBe(404)
      expect((await call('PATCH', `${ADMINS}/${player.id}`, { email: 'x@ccc.test' }, bossCookie)).status).toBe(404)
      expect((await call('PATCH', `${ADMINS}/not-a-uuid`, { email: 'x@ccc.test' }, bossCookie)).status).toBe(400)
      expect((await call('PATCH', `${ADMINS}/${UNKNOWN_ID}`, { email: 'nope' }, bossCookie)).status).toBe(400)
      expect((await call('PATCH', `${ADMINS}/${UNKNOWN_ID}`, { email: 'x@ccc.test', role: 'ADMIN' }, bossCookie)).status).toBe(400)
    })
  })

  describe('DELETE /admin/administrateurs/{id}', () => {
    it('removes an ACTIVE admin (Q1): back to PARTICIPANT, card and password kept, sessions revoked, next request 401', async () => {
      const target = await seedUser(dataSource, { email: 'leaving@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN, withCompetitor: true })
      const cookie = await cookieOf(target.email)
      const otherCookie = await cookieOf(target.email)
      expect((await call('GET', ADMINS, undefined, cookie)).status).toBe(200)

      const response = await call('DELETE', `${ADMINS}/${target.id}`, undefined, bossCookie)
      expect(response.status).toBe(204)
      expect(await response.text()).toBe('')

      const row = await dataSource.getRepository(UserEntity).findOneOrFail({ where: { id: target.id }, select: { id: true, role: true, status: true, competitorId: true, passwordHash: true } })
      expect(row).toMatchObject({ role: USER_ROLE.PARTICIPANT, status: USER_STATUS.ACTIVE, competitorId: target.competitorId })
      expect(row.passwordHash).toBeTruthy()
      const sessions = await dataSource.getRepository(SessionEntity).findBy({ userId: target.id })
      expect(sessions.length).toBeGreaterThanOrEqual(2)
      expect(sessions.every((session) => session.revokedAt !== null)).toBe(true)
      // Sessions révoquées : 401 (et non 403), pour chaque appareil.
      expect((await getWith('/api/v1/moi', cookie)).status).toBe(401)
      expect((await call('GET', ADMINS, undefined, otherCookie)).status).toBe(401)
      // Il peut se reconnecter, comme joueur : l'administration reste fermée.
      const relogin = await cookieOf(target.email)
      expect((await getWith('/api/v1/moi', relogin)).status).toBe(200)
      expect((await call('GET', ADMINS, undefined, relogin)).status).toBe(403)
      expect((await call('GET', ADMINS, undefined, bossCookie)).status).toBe(200)
    })

    it('removes a never-activated admin without a card (Q2): account deleted, invitations cascaded, link 404', async () => {
      const { id, token } = await invite('never@ccc.test')
      expect((await getWith(invitationPath(token))).status).toBe(200)
      expect((await call('DELETE', `${ADMINS}/${id}`, undefined, bossCookie)).status).toBe(204)
      expect(await dataSource.getRepository(UserEntity).countBy({ id })).toBe(0)
      expect(await dataSource.getRepository(InvitationEntity).countBy({ userId: id })).toBe(0)
      expect((await getWith(invitationPath(token))).status).toBe(404)
      expect((await call('DELETE', `${ADMINS}/${id}`, undefined, bossCookie)).status).toBe(404)
    })

    it('demotes an INVITED admin that has a card (promoted player): PARTICIPANT, account and invitations kept', async () => {
      const card = await dataSource.getRepository(CompetitorEntity).save({ displayName: 'Invité Fiche' })
      const invited = await dataSource.getRepository(UserEntity).save({
        email: 'invited.card@ccc.test', role: USER_ROLE.PARTICIPANT, status: USER_STATUS.INVITED, passwordHash: null, competitorId: card.id
      })
      await issueInvitation(dataSource.manager, invited.id)
      expect((await call('POST', ADMINS, { email: 'invited.card@ccc.test', confirmPromotion: true }, bossCookie)).status).toBe(200)
      const before = await dataSource.getRepository(InvitationEntity).countBy({ userId: invited.id })
      expect(before).toBeGreaterThan(0)

      expect((await call('DELETE', `${ADMINS}/${invited.id}`, undefined, bossCookie)).status).toBe(204)
      expect(await userByEmail('invited.card@ccc.test')).toMatchObject({ role: USER_ROLE.PARTICIPANT, status: USER_STATUS.INVITED, competitorId: card.id })
      expect(await dataSource.getRepository(InvitationEntity).countBy({ userId: invited.id })).toBe(before)
    })

    it('answers 409 CANNOT_REVOKE_SELF, 404 unknown or non-admin account, 400 bad id', async () => {
      const self = await call('DELETE', `${ADMINS}/${boss.id}`, undefined, bossCookie)
      expect(self.status).toBe(409)
      expect(await self.json()).toMatchObject({ code: API_ERROR_CODE.CANNOT_REVOKE_SELF })
      expect(await userByEmail('boss@ccc.test')).toMatchObject({ role: USER_ROLE.ADMIN })
      expect((await call('DELETE', `${ADMINS}/${UNKNOWN_ID}`, undefined, bossCookie)).status).toBe(404)
      expect((await call('DELETE', `${ADMINS}/${player.id}`, undefined, bossCookie)).status).toBe(404)
      expect((await call('DELETE', `${ADMINS}/not-a-uuid`, undefined, bossCookie)).status).toBe(400)
    })

    it('answers 409 LAST_ADMIN when no other active administrator would remain (service level: the API actor is always an active admin)', async () => {
      const solo = await seedUser(dataSource, { email: 'solo@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN })
      await withOnlyActiveAdmins([solo.id], async () => {
        // Un INVITED ne compte pas parmi les actifs : des invités en attente ne sauvent pas le dernier actif.
        expect(await dataSource.getRepository(UserEntity).countBy({ role: USER_ROLE.ADMIN, status: USER_STATUS.INVITED })).toBeGreaterThan(0)
        await expect(revokeAdministrator(dataSource, UNKNOWN_ID, solo.id)).rejects.toMatchObject({ statusCode: 409, data: { code: API_ERROR_CODE.LAST_ADMIN } })
        expect(await userByEmail('solo@ccc.test')).toMatchObject({ role: USER_ROLE.ADMIN })
      })
    })

    it('two crossed concurrent removals never leave zero active administrator', async () => {
      const a = await seedUser(dataSource, { email: 'cross.a@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN })
      const b = await seedUser(dataSource, { email: 'cross.b@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN })
      const cookieA = await cookieOf(a.email)
      const cookieB = await cookieOf(b.email)
      await withOnlyActiveAdmins([a.id, b.id], async () => {
        const [ofA, ofB] = await Promise.all([
          call('DELETE', `${ADMINS}/${b.id}`, undefined, cookieA),
          call('DELETE', `${ADMINS}/${a.id}`, undefined, cookieB)
        ])
        const statuses = [ofA.status, ofB.status]
        expect(statuses.filter((status) => status === 204)).toHaveLength(1)
        // Le perdant : 409 LAST_ADMIN (session encore valide à l'arrivée de la requête) ou 403 (rôle déjà retiré).
        expect(statuses.filter((status) => status === 409 || status === 403)).toHaveLength(1)
        expect(await dataSource.getRepository(UserEntity).countBy({ role: USER_ROLE.ADMIN, status: USER_STATUS.ACTIVE })).toBe(1)
      })
    })
  })

  describe('logs', () => {
    it('never write an email, a token or a link', async () => {
      const lines: string[] = []
      const spy = vi.spyOn(process.stdout, 'write').mockImplementation((chunk: string | Uint8Array) => {
        lines.push(String(chunk))
        return true
      })
      try {
        const created = await inviteAdministrator(dataSource, boss.id, 'log.check@ccc.test')
        await resendAdministratorInvitation(dataSource, boss.id, created.userId)
        await updateAdministratorEmail(dataSource, boss.id, created.userId, 'log.check2@ccc.test')
        const promotable = await seedUser(dataSource, { email: 'log.promo@ccc.test', password: PASSWORD, role: USER_ROLE.PARTICIPANT })
        await inviteAdministrator(dataSource, boss.id, 'log.promo@ccc.test', true)
        await revokeAdministrator(dataSource, boss.id, created.userId)
        await revokeAdministrator(dataSource, boss.id, promotable.id)
      } finally {
        spy.mockRestore()
      }
      // Vitest écrit aussi sur stdout : seules les lignes de log structurées (JSON avec un champ `event`) comptent.
      const output = lines.filter((line) => line.includes('"event":"')).join('')
      expect(output).toContain('admin_invited')
      expect(output).toContain('admin_promoted')
      expect(output).toContain('admin_invitation_resent')
      expect(output).toContain('admin_email_updated')
      expect(output).toContain('admin_revoked')
      expect(output).not.toMatch(/@|invitation\/|log\.check|log\.promo/)
    })
  })
})

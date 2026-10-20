import { fileURLToPath } from 'node:url'
import { fetch, setup } from '@nuxt/test-utils/e2e'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { API_ERROR_CODE } from '../../shared/enums/api-error-code.enum'
import { USER_ROLE, USER_STATUS } from '../../shared/enums/user.enum'
import { SessionEntity } from '../../server/database/entities/session.entity'
import { UserEntity } from '../../server/database/entities/user.entity'
import {
  cookieHeaderOf, getWith, jsonPatch, jsonPost, login, resetTestDatabase, seedUser, setCookieOf
} from './helpers/auth-fixtures'
import type { ISeededUser } from './helpers/auth-fixtures'
import { requireTestDatabaseEnv } from './helpers/test-database'

const PASSWORD = 'a-long-enough-password'
const EMAIL_LIMIT = 5

let dataSource: DataSource
let participant: ISeededUser
let admin: ISeededUser
let uniqueEmail = 0
const nextEmail = (): string => `user${uniqueEmail += 1}@ccc.test`

/** Les corps de réponse capturés : aucun ne doit contenir le hash. */
const seenBodies: string[] = []
const readBody = async (response: Response): Promise<string> => {
  const text = await response.text()
  seenBodies.push(text)
  return text
}

describe('auth (login, logout, /moi, roles)', async () => {
  const env = requireTestDatabaseEnv()
  dataSource = await resetTestDatabase()
  participant = await seedUser(dataSource, { email: 'player@ccc.test', password: PASSWORD, role: USER_ROLE.PARTICIPANT, withCompetitor: true })
  admin = await seedUser(dataSource, { email: 'boss@ccc.test', password: PASSWORD, role: USER_ROLE.ADMIN })

  await setup({
    rootDir: fileURLToPath(new URL('../..', import.meta.url)),
    server: true,
    env: {
      ...env,
      NODE_ENV: 'production',
      NUXT_AUTH_LOGIN_RATE_LIMIT_MAX_EMAIL_ATTEMPTS: String(EMAIL_LIMIT),
      NUXT_AUTH_LOGIN_RATE_LIMIT_MAX_IP_ATTEMPTS: '1000'
    }
  })

  beforeAll(() => {
    seenBodies.length = 0
  })

  afterAll(async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy()
    }
  })

  describe('POST /auth/login', () => {
    it('answers 200 with IMe, sets a hardened cookie and exposes no hash', async () => {
      const response = await login(participant.email, PASSWORD)
      expect(response.status).toBe(200)
      const body = JSON.parse(await readBody(response))
      expect(body).toMatchObject({ id: participant.id, email: participant.email, role: USER_ROLE.PARTICIPANT })
      expect(body.competitor).toMatchObject({ id: participant.competitorId, phone: '+33 6 00 00 00 00' })

      const cookie = setCookieOf(response)!
      expect(cookie).toMatch(/HttpOnly/i)
      expect(cookie).toMatch(/SameSite=Lax/i)
      expect(cookie).toMatch(/Path=\//)
      expect(cookie).toMatch(/Secure/i)
      expect(cookie).toMatch(/Max-Age=\d+/)
    })

    it('stores only the SHA-256 of the token, never the token', async () => {
      const response = await login(participant.email, PASSWORD)
      const token = cookieHeaderOf(response).split('=')[1]!
      const sessions = await dataSource.getRepository(SessionEntity).find({ where: { userId: participant.id } })
      expect(sessions.length).toBeGreaterThan(0)
      expect(sessions.every((session) => session.tokenHash !== token && /^[0-9a-f]{64}$/.test(session.tokenHash))).toBe(true)
    })

    it('returns the same 401, same body, for a wrong password and an unknown email', async () => {
      const wrongPassword = await login(participant.email, 'definitely-wrong-password')
      const unknownEmail = await login('nobody@ccc.test', 'definitely-wrong-password')
      expect(wrongPassword.status).toBe(401)
      expect(unknownEmail.status).toBe(401)
      const first = await readBody(wrongPassword)
      expect(first).toBe(await readBody(unknownEmail))
      expect(JSON.parse(first)).toMatchObject({ statusCode: 401, code: API_ERROR_CODE.INVALID_CREDENTIALS })
      expect(setCookieOf(wrongPassword)).toBeUndefined()
    })

    it('refuses an invited account without password (same 401)', async () => {
      const invited = await seedUser(dataSource, { email: nextEmail(), password: PASSWORD, role: USER_ROLE.PARTICIPANT, status: USER_STATUS.INVITED })
      const response = await login(invited.email, PASSWORD)
      expect(response.status).toBe(401)
    })

    it('accepts an email typed with another case', async () => {
      const response = await login('  PLAYER@CCC.test ', PASSWORD)
      expect(response.status).toBe(200)
    })

    it('rejects a malformed body with 400 VALIDATION_FAILED', async () => {
      const response = await jsonPost('/api/v1/auth/login', { email: 'a@b.c' })
      expect(response.status).toBe(400)
      expect((await response.json()).code).toBe(API_ERROR_CODE.VALIDATION_FAILED)
    })

    it('rotates: the previous session is revoked when a new login carries it', async () => {
      const first = cookieHeaderOf(await login(participant.email, PASSWORD))
      const second = await login(participant.email, PASSWORD, first)
      const secondCookie = cookieHeaderOf(second)
      expect(secondCookie).not.toBe(first)
      expect((await getWith('/api/v1/moi', first)).status).toBe(401)
      expect((await getWith('/api/v1/moi', secondCookie)).status).toBe(200)
    })

    it('answers 429 with Retry-After after the per-email threshold', async () => {
      const email = 'bruteforce@ccc.test'
      const statuses: number[] = []
      for (let attempt = 0; attempt < EMAIL_LIMIT + 1; attempt += 1) {
        const response = await login(email, 'wrong-password-wrong')
        statuses.push(response.status)
        if (response.status === 429) {
          expect(response.headers.get('retry-after')).toMatch(/^\d+$/)
          expect((await response.json()).code).toBe(API_ERROR_CODE.RATE_LIMITED)
        }
      }
      expect(statuses).toEqual([...Array(EMAIL_LIMIT).fill(401), 429])
    })
  })

  describe('GET /moi', () => {
    it('is 401 without cookie', async () => {
      const response = await getWith('/api/v1/moi')
      expect(response.status).toBe(401)
      expect((await response.json()).code).toBe(API_ERROR_CODE.UNAUTHORIZED)
    })

    it('is 401 with a forged or malformed cookie', async () => {
      expect((await getWith('/api/v1/moi', `ccc_session=${'a'.repeat(43)}`)).status).toBe(401)
      expect((await getWith('/api/v1/moi', 'ccc_session=nope')).status).toBe(401)
    })

    it('returns IMe including the phone, to its owner only', async () => {
      const cookie = cookieHeaderOf(await login(participant.email, PASSWORD))
      const response = await getWith('/api/v1/moi', cookie)
      expect(response.status).toBe(200)
      const body = JSON.parse(await readBody(response))
      expect(body.competitor.phone).toBe('+33 6 00 00 00 00')
      expect(Object.keys(body).sort()).toEqual(['competitor', 'email', 'id', 'role'])
    })

    it('returns competitor null for an admin without profile', async () => {
      const cookie = cookieHeaderOf(await login(admin.email, PASSWORD))
      const body = await (await getWith('/api/v1/moi', cookie)).json()
      expect(body).toMatchObject({ role: USER_ROLE.ADMIN, competitor: null })
    })

    it('is 401 once the session has expired', async () => {
      const cookie = cookieHeaderOf(await login(participant.email, PASSWORD))
      await dataSource.getRepository(SessionEntity).update({ userId: participant.id }, { expiresAt: new Date(Date.now() - 1000) })
      expect((await getWith('/api/v1/moi', cookie)).status).toBe(401)
    })
  })

  describe('POST /auth/logout', () => {
    it('revokes the session, clears the cookie and is idempotent (204 replayed)', async () => {
      const cookie = cookieHeaderOf(await login(participant.email, PASSWORD))
      const headers = { Cookie: cookie }

      const first = await fetch('/api/v1/auth/logout', { method: 'POST', headers })
      expect(first.status).toBe(204)
      expect(setCookieOf(first)).toMatch(/Max-Age=0|Expires=/i)
      expect((await getWith('/api/v1/moi', cookie)).status).toBe(401)

      const replay = await fetch('/api/v1/auth/logout', { method: 'POST', headers })
      expect(replay.status).toBe(204)
      expect((await fetch('/api/v1/auth/logout', { method: 'POST' })).status).toBe(204)
    })
  })

  describe('roles', () => {
    it('admin ping: 401 anonymous, 403 participant, 200 admin', async () => {
      expect((await getWith('/api/v1/admin/ping')).status).toBe(401)
      const participantCookie = cookieHeaderOf(await login(participant.email, PASSWORD))
      const forbiddenResponse = await getWith('/api/v1/admin/ping', participantCookie)
      expect(forbiddenResponse.status).toBe(403)
      expect((await forbiddenResponse.json()).code).toBe(API_ERROR_CODE.FORBIDDEN)
      const adminCookie = cookieHeaderOf(await login(admin.email, PASSWORD))
      expect((await getWith('/api/v1/admin/ping', adminCookie)).status).toBe(200)
    })

    it('leaves public routes public', async () => {
      expect((await getWith('/api/v1/health')).status).toBe(200)
    })
  })

  describe('PATCH /moi', () => {
    it.each(['role', 'email', 'nickname', 'displayName', 'firstName'])('refuses %s with 400 (A4 whitelist)', async (field) => {
      const cookie = cookieHeaderOf(await login(participant.email, PASSWORD))
      const response = await jsonPatch('/api/v1/moi', { phone: '+33 6 11 11 11 11', [field]: 'ADMIN' }, cookie)
      expect(response.status).toBe(400)
      expect((await response.json()).code).toBe(API_ERROR_CODE.VALIDATION_FAILED)
      const stored = await dataSource.getRepository(UserEntity).findOneByOrFail({ id: participant.id })
      expect(stored.role).toBe(USER_ROLE.PARTICIPANT)
    })

    it('updates avatar and phone, and nothing else', async () => {
      const cookie = cookieHeaderOf(await login(participant.email, PASSWORD))
      const response = await jsonPatch('/api/v1/moi', { avatarUrl: 'https://img.test/me.png', phone: '+33 6 22 22 22 22' }, cookie)
      expect(response.status).toBe(200)
      const body = JSON.parse(await readBody(response))
      expect(body.competitor).toMatchObject({ avatarUrl: 'https://img.test/me.png', phone: '+33 6 22 22 22 22' })
    })

    it('requires an identity', async () => {
      expect((await jsonPatch('/api/v1/moi', { phone: '+33 6 22 22 22 22' })).status).toBe(401)
    })

    it('refuses a contact update for an account without competitor (422)', async () => {
      const cookie = cookieHeaderOf(await login(admin.email, PASSWORD))
      expect((await jsonPatch('/api/v1/moi', { phone: '+33 6 22 22 22 22' }, cookie)).status).toBe(422)
    })

    it('password change: wrong current password gives 401 and keeps the old one', async () => {
      const user = await seedUser(dataSource, { email: nextEmail(), password: PASSWORD, role: USER_ROLE.PARTICIPANT, withCompetitor: true })
      const cookie = cookieHeaderOf(await login(user.email, PASSWORD))
      const response = await jsonPatch('/api/v1/moi', { currentPassword: 'not-my-password', newPassword: 'brand-new-password-1' }, cookie)
      expect(response.status).toBe(401)
      expect((await response.json()).code).toBe(API_ERROR_CODE.INVALID_CURRENT_PASSWORD)
      expect((await login(user.email, PASSWORD)).status).toBe(200)
    })

    it('password change: succeeds, revokes the other sessions, keeps the current one', async () => {
      const user = await seedUser(dataSource, { email: nextEmail(), password: PASSWORD, role: USER_ROLE.PARTICIPANT, withCompetitor: true })
      const current = cookieHeaderOf(await login(user.email, PASSWORD))
      const other = cookieHeaderOf(await login(user.email, PASSWORD))

      const response = await jsonPatch('/api/v1/moi', { currentPassword: PASSWORD, newPassword: 'brand-new-password-1' }, current)
      expect(response.status).toBe(200)
      expect(await readBody(response)).not.toMatch(/password/i)

      expect((await getWith('/api/v1/moi', other)).status).toBe(401)
      expect((await getWith('/api/v1/moi', current)).status).toBe(200)
      expect((await login(user.email, PASSWORD)).status).toBe(401)
      expect((await login(user.email, 'brand-new-password-1')).status).toBe(200)
    })

    it('password change: refuses a new password under the minimum length', async () => {
      const cookie = cookieHeaderOf(await login(participant.email, PASSWORD))
      const response = await jsonPatch('/api/v1/moi', { currentPassword: PASSWORD, newPassword: 'short' }, cookie)
      expect(response.status).toBe(400)
    })
  })

  describe('CSRF', () => {
    it('refuses a write from a foreign Origin even with a valid cookie', async () => {
      const cookie = cookieHeaderOf(await login(participant.email, PASSWORD))
      const response = await jsonPost('/api/v1/auth/logout', {}, { Cookie: cookie, Origin: 'https://evil.test' })
      expect(response.status).toBe(403)
      expect((await response.json()).code).toBe(API_ERROR_CODE.FORBIDDEN_ORIGIN)
      expect((await getWith('/api/v1/moi', cookie)).status).toBe(200)
    })

    it('refuses a cross-site login attempt announced by Sec-Fetch-Site', async () => {
      const response = await jsonPost('/api/v1/auth/login', { email: participant.email, password: PASSWORD }, { 'Sec-Fetch-Site': 'cross-site' })
      expect(response.status).toBe(403)
    })
  })

  describe('serialization', () => {
    it('never leaks a password hash in any B-08 response', () => {
      expect(seenBodies.length).toBeGreaterThan(0)
      for (const body of seenBodies) {
        expect(body).not.toMatch(/scrypt\$|passwordHash|password_hash/)
      }
    })
  })
})

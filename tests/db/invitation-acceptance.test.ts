import 'reflect-metadata'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { USER_ROLE, USER_STATUS } from '../../src/enums/user.enum'
import { INVITATION_TTL_MS } from '../../src/consts/invitation.const'
import { createAdminWithInvitation } from '../../src/utils/create-admin.util'
import { CompetitorEntity } from '../../src/server/db/typeorm/entities/competitor.entity'
import { InvitationEntity } from '../../src/server/db/typeorm/entities/invitation.entity'
import { SessionEntity } from '../../src/server/db/typeorm/entities/session.entity'
import { UserEntity } from '../../src/server/db/typeorm/entities/user.entity'
import { createCompetitorWithAccount } from '../../src/services/competitor.service'
import { acceptInvitation, previewInvitation, resendInvitation } from '../../src/services/invitation.service'
import { verifyPassword } from '../../src/utils/password.util'
import { hashSessionToken } from '../../src/utils/session-token.util'
import { cleanup, resetSchema } from './helpers/test-database'

const PASSWORD = 'a-long-enough-password'
const NOW = new Date('2026-10-21T10:00:00.000Z')
const DAY_MS = 24 * 3600 * 1000

let dataSource: DataSource
let counter = 0

const invite = (overrides: Partial<{ firstName: string, nickname: string | null }> = {}) => {
  counter += 1
  return dataSource.transaction((manager) => createCompetitorWithAccount(manager, {
    email: `invitee${counter}@ccc.test`, firstName: overrides.firstName ?? 'Jeanne', lastName: 'Dupont', nickname: overrides.nickname ?? 'Jeannot'
  }, NOW))
}

const expectGone = (promise: Promise<unknown>) => expect(promise).rejects.toMatchObject({ statusCode: 410, data: { code: API_ERROR_CODE.GONE } })

beforeAll(async () => {
  dataSource = await resetSchema()
})

afterAll(async () => {
  await cleanup()
})

describe('previewInvitation', () => {
  it('returns only the first name and nickname to pre-fill', async () => {
    const { invitationToken } = await invite()
    expect(await previewInvitation(dataSource, invitationToken, NOW)).toEqual({ firstName: 'Jeanne', nickname: 'Jeannot' })
  })

  it('answers 404 for an unknown token', async () => {
    await expect(previewInvitation(dataSource, 'B'.repeat(43), NOW)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('answers 410 once the 7 days are over, and still valid one second before', async () => {
    const { invitationToken } = await invite()
    expect(await previewInvitation(dataSource, invitationToken, new Date(NOW.getTime() + INVITATION_TTL_MS - 1000))).toBeTruthy()
    await expectGone(previewInvitation(dataSource, invitationToken, new Date(NOW.getTime() + INVITATION_TTL_MS)))
  })
})

describe('acceptInvitation', () => {
  it('sets the password, activates the account, completes the profile and opens a session, in one go', async () => {
    const { invitationToken, userId, competitorId } = await invite()
    const result = await acceptInvitation(dataSource, invitationToken, {
      password: PASSWORD, lastName: 'Martin', nickname: 'Jeannette', phone: '+33 6 00 00 00 00'
    }, new Date(NOW.getTime() + DAY_MS))

    expect(result.userId).toBe(userId)
    const user = await dataSource.getRepository(UserEntity).findOneOrFail({ where: { id: userId }, select: { id: true, status: true, passwordHash: true, role: true } })
    expect(user.status).toBe(USER_STATUS.ACTIVE)
    expect(user.role).toBe(USER_ROLE.PARTICIPANT)
    expect(await verifyPassword(PASSWORD, user.passwordHash)).toBe(true)
    expect(user.passwordHash).not.toContain(PASSWORD)

    expect(await dataSource.getRepository(CompetitorEntity).findOneByOrFail({ id: competitorId })).toMatchObject({
      firstName: 'Jeanne', lastName: 'Martin', displayName: 'Jeanne Martin', nickname: 'Jeannette', phone: '+33 6 00 00 00 00', avatarUrl: null
    })
    const session = await dataSource.getRepository(SessionEntity).findOneByOrFail({ tokenHash: hashSessionToken(result.sessionToken) })
    expect(session.userId).toBe(userId)
  })

  it('keeps the identity typed by the administrator when a field is omitted', async () => {
    const { invitationToken, competitorId } = await invite({ firstName: 'Paul' })
    await acceptInvitation(dataSource, invitationToken, { password: PASSWORD }, NOW)
    expect(await dataSource.getRepository(CompetitorEntity).findOneByOrFail({ id: competitorId })).toMatchObject({
      firstName: 'Paul', lastName: 'Dupont', displayName: 'Paul Dupont', nickname: 'Jeannot'
    })
  })

  it('consumes the token once: a second use answers 410 and changes nothing', async () => {
    const { invitationToken, userId } = await invite()
    await acceptInvitation(dataSource, invitationToken, { password: PASSWORD }, NOW)
    const sessionsBefore = await dataSource.getRepository(SessionEntity).countBy({ userId })
    await expectGone(acceptInvitation(dataSource, invitationToken, { password: 'another-long-password-1' }, NOW))
    await expectGone(previewInvitation(dataSource, invitationToken, NOW))
    expect(await dataSource.getRepository(SessionEntity).countBy({ userId })).toBe(sessionsBefore)
    const user = await dataSource.getRepository(UserEntity).findOneOrFail({ where: { id: userId }, select: { id: true, passwordHash: true } })
    expect(await verifyPassword(PASSWORD, user.passwordHash)).toBe(true)
  })

  it('lets exactly one of two concurrent requests win', async () => {
    const { invitationToken, userId } = await invite()
    const outcomes = await Promise.allSettled([
      acceptInvitation(dataSource, invitationToken, { password: PASSWORD }, NOW),
      acceptInvitation(dataSource, invitationToken, { password: PASSWORD }, NOW)
    ])
    expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1)
    const failure = outcomes.find((outcome) => outcome.status === 'rejected') as PromiseRejectedResult
    expect(failure.reason).toMatchObject({ statusCode: 410 })
    expect(await dataSource.getRepository(SessionEntity).countBy({ userId })).toBe(1)
  })

  it('answers 410 for a token older than 7 days and leaves the account INVITED', async () => {
    const { invitationToken, userId } = await invite()
    await expectGone(acceptInvitation(dataSource, invitationToken, { password: PASSWORD }, new Date(NOW.getTime() + 8 * DAY_MS)))
    expect((await dataSource.getRepository(UserEntity).findOneByOrFail({ id: userId })).status).toBe(USER_STATUS.INVITED)
  })

  it('answers 404 for an unknown token', async () => {
    await expect(acceptInvitation(dataSource, 'C'.repeat(43), { password: PASSWORD }, NOW)).rejects.toMatchObject({ statusCode: 404 })
  })
})

describe('resendInvitation', () => {
  it('invalidates the old link (410) and the new one works', async () => {
    const first = await invite()
    const later = new Date(NOW.getTime() + 60_000)
    const resent = await resendInvitation(dataSource, first.competitorId, later)

    expect(resent.invitationToken).not.toBe(first.invitationToken)
    expect(resent.email).toMatch(/@ccc.test$/)
    expect(resent.expiresAt.getTime()).toBe(later.getTime() + INVITATION_TTL_MS)
    await expectGone(previewInvitation(dataSource, first.invitationToken, later))
    await expectGone(acceptInvitation(dataSource, first.invitationToken, { password: PASSWORD }, later))
    expect(await previewInvitation(dataSource, resent.invitationToken, later)).toMatchObject({ firstName: 'Jeanne' })
    await acceptInvitation(dataSource, resent.invitationToken, { password: PASSWORD }, later)
  })

  it('answers 404 for an unknown competitor, 422 without account, 409 for an active account', async () => {
    await expect(resendInvitation(dataSource, '00000000-0000-4000-8000-000000000000', NOW)).rejects.toMatchObject({ statusCode: 404, data: { code: API_ERROR_CODE.COMPETITOR_NOT_FOUND } })

    const historic = await dataSource.getRepository(CompetitorEntity).save({ displayName: 'Ancien Joueur' })
    await expect(resendInvitation(dataSource, historic.id, NOW)).rejects.toMatchObject({ statusCode: 422 })

    const active = await invite()
    await acceptInvitation(dataSource, active.invitationToken, { password: PASSWORD }, NOW)
    await expect(resendInvitation(dataSource, active.competitorId, NOW)).rejects.toMatchObject({ statusCode: 409 })
  })
})

describe('createAdminWithInvitation (user:create-admin)', () => {
  it('creates an ADMIN without password and returns a one-time link from siteUrl', async () => {
    const link = await createAdminWithInvitation(dataSource, 'admin@ccc.test', 'https://ccc.example.org/ignored', NOW)
    expect(link).toMatch(/^https:\/\/ccc\.example\.org\/invitation\/[A-Za-z0-9_-]{43}$/)
    const token = link.split('/').pop()!

    const admin = await dataSource.getRepository(UserEntity).findOneOrFail({ where: { email: 'admin@ccc.test' }, select: { id: true, role: true, status: true, passwordHash: true } })
    expect(admin).toMatchObject({ role: USER_ROLE.ADMIN, status: USER_STATUS.INVITED, passwordHash: null })
    const stored = await dataSource.getRepository(InvitationEntity).findOneByOrFail({ userId: admin.id })
    expect(stored.tokenHash).not.toContain(token)
    expect(stored.expiresAt.getTime()).toBe(NOW.getTime() + INVITATION_TTL_MS)

    expect(await previewInvitation(dataSource, token, NOW)).toEqual({ firstName: null, nickname: null })
    await acceptInvitation(dataSource, token, { password: PASSWORD }, NOW)
    await expectGone(acceptInvitation(dataSource, token, { password: PASSWORD }, NOW))
    const active = await dataSource.getRepository(UserEntity).findOneByOrFail({ id: admin.id })
    expect(active).toMatchObject({ role: USER_ROLE.ADMIN, status: USER_STATUS.ACTIVE })
  })

  it('writes nothing when siteUrl is invalid', async () => {
    const before = await dataSource.getRepository(UserEntity).count()
    await expect(createAdminWithInvitation(dataSource, 'nolink@ccc.test', 'not a url', NOW)).rejects.toThrow(/siteUrl/)
    expect(await dataSource.getRepository(UserEntity).count()).toBe(before)
  })
})

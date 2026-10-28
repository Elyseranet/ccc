import 'reflect-metadata'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { API_ERROR_CODE } from '../../src/enums/api-error-code.enum'
import { USER_ROLE, USER_STATUS } from '../../src/enums/user.enum'
import { INVITATION_TTL_MS } from '../../src/consts/invitation.const'
import { CompetitorEntity } from '../../src/server/db/typeorm/entities/competitor.entity'
import { InvitationEntity } from '../../src/server/db/typeorm/entities/invitation.entity'
import { UserEntity } from '../../src/server/db/typeorm/entities/user.entity'
import { createCompetitorWithAccount } from '../../src/services/competitor.service'
import { issueInvitation } from '../../src/utils/invitation-store.util'
import { hashInvitationToken } from '../../src/utils/invitation-token.util'
import { cleanup, resetSchema, revertMigrationsUntil } from './helpers/test-database'

let dataSource: DataSource

const NEW_COMPETITOR = { email: 'Jeanne.Dupont@CCC.test', firstName: ' Jeanne ', lastName: 'Dupont', nickname: 'Jeannot', phone: '+33 6 12 34 56 78' }
const NOW = new Date('2026-10-21T10:00:00.000Z')

const counts = async (): Promise<{ competitors: number, users: number, invitations: number }> => ({
  competitors: await dataSource.getRepository(CompetitorEntity).count(),
  users: await dataSource.getRepository(UserEntity).count(),
  invitations: await dataSource.getRepository(InvitationEntity).count()
})

beforeAll(async () => {
  dataSource = await resetSchema()
})

afterAll(async () => {
  await cleanup()
})

describe('migration invitations', () => {
  it('reverts cleanly then re-applies', async () => {
    const exists = async (): Promise<boolean> => (await dataSource.query(
      `SELECT 1 FROM information_schema.tables WHERE table_name = 'invitations'`
    )).length === 1
    expect(await exists()).toBe(true)
    await revertMigrationsUntil(dataSource, 'CreateLoginDevices')
    expect(await exists()).toBe(false)
    await dataSource.runMigrations()
    expect(await exists()).toBe(true)
  })
})

describe('createCompetitorWithAccount', () => {
  it('creates competitor, INVITED participant account and a 7-day invitation in the caller transaction', async () => {
    const result = await dataSource.transaction((manager) => createCompetitorWithAccount(manager, NEW_COMPETITOR, NOW))

    const user = await dataSource.getRepository(UserEntity).findOneByOrFail({ id: result.userId })
    expect(user).toMatchObject({
      email: 'jeanne.dupont@ccc.test',
      role: USER_ROLE.PARTICIPANT,
      status: USER_STATUS.INVITED,
      competitorId: result.competitorId
    })
    const competitor = await dataSource.getRepository(CompetitorEntity).findOneByOrFail({ id: result.competitorId })
    expect(competitor).toMatchObject({
      displayName: 'Jeanne Dupont',
      firstName: 'Jeanne',
      lastName: 'Dupont',
      nickname: 'Jeannot',
      phone: '+33 6 12 34 56 78',
      avatarVersion: null
    })
    const invitation = await dataSource.getRepository(InvitationEntity).findOneByOrFail({ userId: result.userId })
    expect(invitation.expiresAt.getTime()).toBe(NOW.getTime() + INVITATION_TTL_MS)
    expect(invitation.consumedAt).toBeNull()
    expect(result.expiresAt).toEqual(invitation.expiresAt)
  })

  it('stores only the SHA-256 of the token, never the token itself', async () => {
    const result = await dataSource.transaction((manager) =>
      createCompetitorWithAccount(manager, { ...NEW_COMPETITOR, email: 'hash@ccc.test' }, NOW))
    expect(result.invitationToken).toMatch(/^[A-Za-z0-9_-]{43}$/)
    const rows: Array<{ token_hash: string }> = await dataSource.query(
      `SELECT token_hash FROM invitations WHERE user_id = $1`, [result.userId]
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]?.token_hash).toBe(hashInvitationToken(result.invitationToken))
    expect(rows[0]?.token_hash).not.toContain(result.invitationToken)
  })

  it('answers EMAIL_ALREADY_USED (409) for an existing email, whatever its case, without partial creation', async () => {
    const before = await counts()
    await expect(
      dataSource.transaction((manager) => createCompetitorWithAccount(manager, { ...NEW_COMPETITOR, email: 'JEANNE.DUPONT@ccc.test' }, NOW))
    ).rejects.toMatchObject({ statusCode: 409, data: { code: API_ERROR_CODE.EMAIL_ALREADY_USED } })
    expect(await counts()).toEqual(before)
  })

  it('rolls back every write when the caller transaction fails after the service', async () => {
    const before = await counts()
    await expect(dataSource.transaction(async (manager) => {
      await createCompetitorWithAccount(manager, { ...NEW_COMPETITOR, email: 'rollback@ccc.test' }, NOW)
      throw new Error('caller failure')
    })).rejects.toThrow('caller failure')
    expect(await counts()).toEqual(before)
  })

  it('turns a concurrent email collision into EMAIL_ALREADY_USED and leaves one account', async () => {
    const input = { ...NEW_COMPETITOR, email: 'race@ccc.test' }
    const outcomes = await Promise.allSettled([
      dataSource.transaction((manager) => createCompetitorWithAccount(manager, input, NOW)),
      dataSource.transaction((manager) => createCompetitorWithAccount(manager, input, NOW))
    ])
    expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1)
    const failure = outcomes.find((outcome) => outcome.status === 'rejected') as PromiseRejectedResult
    expect(failure.reason).toMatchObject({ statusCode: 409, data: { code: API_ERROR_CODE.EMAIL_ALREADY_USED } })
    expect(await dataSource.getRepository(UserEntity).countBy({ email: 'race@ccc.test' })).toBe(1)
  })

  it('stores blank optional fields as null', async () => {
    const result = await dataSource.transaction((manager) =>
      createCompetitorWithAccount(manager, { email: 'min@ccc.test', firstName: 'A', lastName: 'B', nickname: '  ', phone: null }, NOW))
    const competitor = await dataSource.getRepository(CompetitorEntity).findOneByOrFail({ id: result.competitorId })
    expect(competitor.nickname).toBeNull()
    expect(competitor.phone).toBeNull()
  })
})

describe('issueInvitation', () => {
  it('invalidates previous pending invitations (expiry set to the resend instant) and leaves a new valid one', async () => {
    const created = await dataSource.transaction((manager) =>
      createCompetitorWithAccount(manager, { ...NEW_COMPETITOR, email: 'resend@ccc.test' }, NOW))
    const later = new Date(NOW.getTime() + 60_000)
    const reissued = await dataSource.transaction((manager) => issueInvitation(manager, created.userId, later))

    expect(reissued.invitationToken).not.toBe(created.invitationToken)
    const repo = dataSource.getRepository(InvitationEntity)
    const old = await repo.findOneByOrFail({ tokenHash: hashInvitationToken(created.invitationToken) })
    const fresh = await repo.findOneByOrFail({ tokenHash: hashInvitationToken(reissued.invitationToken) })
    expect(old.expiresAt.getTime()).toBe(later.getTime())
    expect(fresh.expiresAt.getTime()).toBe(later.getTime() + INVITATION_TTL_MS)
  })
})

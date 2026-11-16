import 'reflect-metadata'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { USER_ROLE, USER_STATUS } from '../../src/enums/user.enum'
import { CompetitorEntity } from '../../src/server/db/typeorm/entities/competitor.entity'
import { LoginDeviceEntity } from '../../src/server/db/typeorm/entities/login-device.entity'
import { SessionEntity } from '../../src/server/db/typeorm/entities/session.entity'
import { UserEntity } from '../../src/server/db/typeorm/entities/user.entity'
import { cleanup, resetSchema, revertMigrationsUntil } from './helpers/test-database'

let dataSource: DataSource

const IDENTITY_TABLES = ['sessions', 'users']
const USER_FKS = ['fk_draws_created_by_user', 'fk_draws_validated_by_user', 'fk_matches_validated_by_user']

const tables = async (): Promise<string[]> => {
  const rows: Array<{ table_name: string }> = await dataSource.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1)`,
    [IDENTITY_TABLES]
  )
  return rows.map((row) => row.table_name).sort()
}

const userForeignKeys = async (): Promise<string[]> => {
  const rows: Array<{ conname: string }> = await dataSource.query(
    `SELECT conname FROM pg_constraint WHERE conname = ANY($1)`,
    [USER_FKS]
  )
  return rows.map((row) => row.conname).sort()
}

const saveUser = (email: string, competitorId: string | null = null): Promise<UserEntity> =>
  dataSource.getRepository(UserEntity).save({ email, role: USER_ROLE.PARTICIPANT, status: USER_STATUS.ACTIVE, competitorId })

beforeAll(async () => {
  dataSource = await resetSchema()
})

afterAll(async () => {
  await cleanup()
})

describe('migration M2', () => {
  it('creates users, sessions and the three FK to users', async () => {
    expect(await tables()).toEqual(['sessions', 'users'])
    expect(await userForeignKeys()).toEqual([...USER_FKS].sort())
  })

  it('reverts cleanly (tables, FK and enum types) then re-applies', async () => {
    await revertMigrationsUntil(dataSource, 'CreateDomainSchema') // M2 et ses dépendantes (M3, M4, M5…)
    expect(await tables()).toEqual([])
    expect(await userForeignKeys()).toEqual([])
    const types: Array<{ typname: string }> = await dataSource.query(
      `SELECT typname FROM pg_type WHERE typname IN ('user_role', 'user_status')`
    )
    expect(types).toEqual([])

    await dataSource.runMigrations()
    expect(await tables()).toEqual(['sessions', 'users'])
    expect(await userForeignKeys()).toEqual([...USER_FKS].sort())
  })
})

describe('migration M3', () => {
  const throttleColumns = async (): Promise<string[]> => {
    const rows: Array<{ column_name: string }> = await dataSource.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name IN ('failed_login_count', 'throttled_until')`
    )
    return rows.map((row) => row.column_name).sort()
  }

  it('adds failed_login_count (default 0) and throttled_until', async () => {
    expect(await throttleColumns()).toEqual(['failed_login_count', 'throttled_until'])
    const user = await saveUser('m3@ccc.test')
    const stored = await dataSource.getRepository(UserEntity).findOneByOrFail({ id: user.id })
    expect(stored.failedLoginCount).toBe(0)
    expect(stored.throttledUntil).toBeNull()
  })

  it('reverts then re-applies without touching users', async () => {
    await revertMigrationsUntil(dataSource, 'CreateIdentitySchema') // M3 et ses dépendantes
    expect(await throttleColumns()).toEqual([])
    expect(await tables()).toEqual(['sessions', 'users'])
    await dataSource.runMigrations()
    expect(await throttleColumns()).toEqual(['failed_login_count', 'throttled_until'])
  })
})

describe('migration M4', () => {
  const deviceTables = async (): Promise<string[]> => {
    const rows: Array<{ table_name: string }> = await dataSource.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'login_devices'`
    )
    return rows.map((row) => row.table_name)
  }

  it('creates login_devices with a unique nonce and a cascade FK to users', async () => {
    expect(await deviceTables()).toEqual(['login_devices'])
    const user = await saveUser('m4@ccc.test')
    const repository = dataSource.getRepository(LoginDeviceEntity)
    const expiresAt = new Date(Date.now() + 1000)
    await repository.insert({ userId: user.id, nonce: 'a'.repeat(32), expiresAt })
    await expect(repository.insert({ userId: user.id, nonce: 'a'.repeat(32), expiresAt })).rejects.toThrow(/uq_login_devices_nonce/)
    await dataSource.getRepository(UserEntity).delete({ id: user.id })
    expect(await repository.countBy({ userId: user.id })).toBe(0)
  })

  it('reverts then re-applies', async () => {
    await revertMigrationsUntil(dataSource, 'AddLoginThrottle') // M4 et ses dépendantes
    expect(await deviceTables()).toEqual([])
    expect(await tables()).toEqual(['sessions', 'users'])
    await dataSource.runMigrations()
    expect(await deviceTables()).toEqual(['login_devices'])
  })
})

describe('identity constraints', () => {
  it('rejects a mixed-case email (stored normalized)', async () => {
    await expect(saveUser('Mixed@Case.test')).rejects.toThrow(/ck_users_email_lowercase/)
  })

  it('rejects a duplicate email', async () => {
    await saveUser('dup@ccc.test')
    await expect(saveUser('dup@ccc.test')).rejects.toThrow(/uq_users_email/)
  })

  it('links at most one user to a competitor', async () => {
    const competitor = await dataSource.getRepository(CompetitorEntity).save({ displayName: 'Lié' })
    await saveUser('one@ccc.test', competitor.id)
    await expect(saveUser('two@ccc.test', competitor.id)).rejects.toThrow(/uq_users_competitor_id/)
  })

  it('does not select the password hash by default', async () => {
    await dataSource.getRepository(UserEntity).save({
      email: 'hash@ccc.test', role: USER_ROLE.ADMIN, status: USER_STATUS.ACTIVE, passwordHash: 'secret'
    })
    const user = await dataSource.getRepository(UserEntity).findOneByOrFail({ email: 'hash@ccc.test' })
    expect(user.passwordHash).toBeUndefined()
  })

  it('deletes sessions with their user', async () => {
    const user = await saveUser('cascade@ccc.test')
    await dataSource.getRepository(SessionEntity).insert({
      userId: user.id, tokenHash: 'a'.repeat(64), expiresAt: new Date(Date.now() + 1000), lastSeenAt: new Date()
    })
    await dataSource.getRepository(UserEntity).delete({ id: user.id })
    expect(await dataSource.getRepository(SessionEntity).countBy({ userId: user.id })).toBe(0)
  })
})

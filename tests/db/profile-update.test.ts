import 'reflect-metadata'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { USER_ROLE, USER_STATUS } from '../../shared/enums/user.enum'
import { LoginDeviceEntity } from '../../server/database/entities/login-device.entity'
import { SessionEntity } from '../../server/database/entities/session.entity'
import { UserEntity } from '../../server/database/entities/user.entity'
import { applyProfileChanges } from '../../server/utils/auth/profile-update.util'
import { createSession } from '../../server/utils/auth/session-store.util'

let dataSource: DataSource
let counter = 0

interface IFixture {
  userId: string
  currentSessionId: string
  otherSessionId: string
}

const hashOf = async (id: string): Promise<string | null> =>
  (await dataSource.getRepository(UserEntity).findOneOrFail({ where: { id }, select: { id: true, passwordHash: true } })).passwordHash

const seed = async (): Promise<IFixture> => {
  counter += 1
  const user = await dataSource.getRepository(UserEntity).save({
    email: `profile${counter}@ccc.test`, role: USER_ROLE.PARTICIPANT, status: USER_STATUS.ACTIVE, passwordHash: 'old-hash'
  })
  const expiresAt = new Date(Date.now() + 3_600_000)
  await dataSource.getRepository(LoginDeviceEntity).insert([
    { userId: user.id, nonce: `${counter}`.padStart(32, 'a'), expiresAt },
    { userId: user.id, nonce: `${counter}`.padStart(32, 'b'), expiresAt }
  ])
  await createSession(dataSource, user.id)
  await createSession(dataSource, user.id)
  const [current, other] = await dataSource.getRepository(SessionEntity).find({ where: { userId: user.id }, order: { createdAt: 'ASC' } })
  return { userId: user.id, currentSessionId: current!.id, otherSessionId: other!.id }
}

beforeAll(async () => {
  if (!(process.env.NUXT_DATABASE_DATABASE ?? '').endsWith('_test')) {
    throw new Error('NUXT_DATABASE_DATABASE must name a dedicated test database (suffix _test)')
  }
  dataSource = (await import('../../server/database/data-source')).default
  await dataSource.initialize()
  await dataSource.dropDatabase()
  await dataSource.runMigrations()
})

afterAll(async () => {
  if (dataSource?.isInitialized) {
    await dataSource.destroy()
  }
})

describe('applyProfileChanges (password change)', () => {
  it('updates the hash, deletes every trusted device and revokes the other sessions, keeping the current one', async () => {
    const fixture = await seed()
    await applyProfileChanges(dataSource, {
      userId: fixture.userId, currentSessionId: fixture.currentSessionId, competitorId: null, newPasswordHash: 'new-hash'
    })

    expect(await hashOf(fixture.userId)).toBe('new-hash')
    expect(await dataSource.getRepository(LoginDeviceEntity).countBy({ userId: fixture.userId })).toBe(0)
    const current = await dataSource.getRepository(SessionEntity).findOneByOrFail({ id: fixture.currentSessionId })
    const other = await dataSource.getRepository(SessionEntity).findOneByOrFail({ id: fixture.otherSessionId })
    expect(current.revokedAt).toBeNull()
    expect(other.revokedAt).not.toBeNull()
  })

  it('is all-or-nothing: if the last step fails, neither the hash, nor the devices, nor the sessions change', async () => {
    const fixture = await seed()
    // Un identifiant de session invalide fait échouer la révocation, après la mise à jour du hash
    // et la suppression des appareils : la transaction doit tout annuler.
    await expect(applyProfileChanges(dataSource, {
      userId: fixture.userId, currentSessionId: 'not-a-uuid', competitorId: null, newPasswordHash: 'new-hash'
    })).rejects.toThrow()

    expect(await hashOf(fixture.userId)).toBe('old-hash')
    expect(await dataSource.getRepository(LoginDeviceEntity).countBy({ userId: fixture.userId })).toBe(2)
    const sessions = await dataSource.getRepository(SessionEntity).find({ where: { userId: fixture.userId } })
    expect(sessions.every((session) => session.revokedAt === null)).toBe(true)
  })

  it('leaves the devices alone when only the contact details change', async () => {
    const fixture = await seed()
    await applyProfileChanges(dataSource, { userId: fixture.userId, currentSessionId: fixture.currentSessionId, competitorId: null })
    expect(await dataSource.getRepository(LoginDeviceEntity).countBy({ userId: fixture.userId })).toBe(2)
    expect(await hashOf(fixture.userId)).toBe('old-hash')
  })
})

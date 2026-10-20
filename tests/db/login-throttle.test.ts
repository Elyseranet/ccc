import 'reflect-metadata'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { USER_ROLE, USER_STATUS } from '../../shared/enums/user.enum'
import { LOGIN_DELAY_MAX_SECONDS } from '../../server/consts/auth.const'
import { UserEntity } from '../../server/database/entities/user.entity'
import { recordLoginFailure } from '../../server/utils/auth/login-throttle.util'

let dataSource: DataSource
let counter = 0

const T0 = new Date('2026-10-20T08:00:00Z')

const newUser = async (): Promise<string> => {
  counter += 1
  const user = await dataSource.getRepository(UserEntity).save({
    email: `throttle${counter}@ccc.test`, role: USER_ROLE.PARTICIPANT, status: USER_STATUS.ACTIVE
  })
  return user.id
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

describe('recordLoginFailure', () => {
  it('counts every failure, with no delay up to 5 and 2 s on the 6th (injected clock)', async () => {
    const id = await newUser()
    for (let failure = 1; failure <= 5; failure += 1) {
      expect(await recordLoginFailure(dataSource, id, T0)).toBe(failure)
    }
    expect((await dataSource.getRepository(UserEntity).findOneByOrFail({ id })).throttledUntil).toBeNull()

    expect(await recordLoginFailure(dataSource, id, T0)).toBe(6)
    const stored = await dataSource.getRepository(UserEntity).findOneByOrFail({ id })
    expect(stored.throttledUntil!.getTime() - T0.getTime()).toBe(2000)
  })

  it('is atomic: 20 simultaneous failures are all counted', async () => {
    const id = await newUser()
    const results = await Promise.all(Array.from({ length: 20 }, () => recordLoginFailure(dataSource, id, T0)))
    expect([...results].sort((a, b) => a - b)).toEqual(Array.from({ length: 20 }, (_, index) => index + 1))
    expect((await dataSource.getRepository(UserEntity).findOneByOrFail({ id })).failedLoginCount).toBe(20)
  })

  it('caps the delay at 300 s', async () => {
    const id = await newUser()
    await dataSource.getRepository(UserEntity).update({ id }, { failedLoginCount: 100 })
    await recordLoginFailure(dataSource, id, T0)
    const stored = await dataSource.getRepository(UserEntity).findOneByOrFail({ id })
    expect(stored.throttledUntil!.getTime() - T0.getTime()).toBe(LOGIN_DELAY_MAX_SECONDS * 1000)
  })
})

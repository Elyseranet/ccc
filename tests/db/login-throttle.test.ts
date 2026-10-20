import 'reflect-metadata'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { USER_ROLE, USER_STATUS } from '../../shared/enums/user.enum'
import { LOGIN_DELAY_MAX_SECONDS } from '../../server/consts/auth.const'
import { UserEntity } from '../../server/database/entities/user.entity'
import { reserveLoginAttempt } from '../../server/utils/auth/login-throttle.util'
import { cleanup, resetSchema } from './helpers/test-database'

let dataSource: DataSource
let counter = 0

const T0 = new Date('2026-10-20T08:00:00Z')
const PARALLEL = 20

const newUser = async (state: Partial<Pick<UserEntity, 'failedLoginCount' | 'throttledUntil'>> = {}): Promise<string> => {
  counter += 1
  const user = await dataSource.getRepository(UserEntity).save({
    email: `throttle${counter}@ccc.test`, role: USER_ROLE.PARTICIPANT, status: USER_STATUS.ACTIVE, ...state
  })
  return user.id
}

const stored = (id: string): Promise<UserEntity> => dataSource.getRepository(UserEntity).findOneByOrFail({ id })

beforeAll(async () => {
  dataSource = await resetSchema()
})

afterAll(async () => {
  await cleanup()
})

describe('reserveLoginAttempt (injected clock)', () => {
  it('reserves attempts 1 to 5 with no delay, then 2 s on the 6th', async () => {
    const id = await newUser()
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      expect(await reserveLoginAttempt(dataSource, id, T0)).toEqual({ reserved: true, failedCount: attempt })
    }
    expect((await stored(id)).throttledUntil).toBeNull()

    expect(await reserveLoginAttempt(dataSource, id, T0)).toEqual({ reserved: true, failedCount: 6 })
    expect((await stored(id)).throttledUntil!.getTime() - T0.getTime()).toBe(2000)
  })

  it('refuses while the delay lasts, with the remaining seconds, and reserves again once it is over', async () => {
    const id = await newUser({ failedLoginCount: 6, throttledUntil: new Date(T0.getTime() + 2000) })
    expect(await reserveLoginAttempt(dataSource, id, T0)).toEqual({ reserved: false, retryAfterSeconds: 2 })
    expect((await stored(id)).failedLoginCount).toBe(6)

    const later = new Date(T0.getTime() + 2000)
    expect(await reserveLoginAttempt(dataSource, id, later)).toEqual({ reserved: true, failedCount: 7 })
    expect((await stored(id)).throttledUntil!.getTime() - later.getTime()).toBe(4000)
  })

  it('caps the delay at 300 s', async () => {
    const id = await newUser({ failedLoginCount: 100 })
    await reserveLoginAttempt(dataSource, id, T0)
    expect((await stored(id)).throttledUntil!.getTime() - T0.getTime()).toBe(LOGIN_DELAY_MAX_SECONDS * 1000)
  })

  it('concurrency: on an account already in delay, none of 20 simultaneous attempts is reserved', async () => {
    const id = await newUser({ failedLoginCount: 8, throttledUntil: new Date(T0.getTime() + 8000) })
    const results = await Promise.all(Array.from({ length: PARALLEL }, () => reserveLoginAttempt(dataSource, id, T0)))
    expect(results.every((result) => !result.reserved)).toBe(true)
    expect((await stored(id)).failedLoginCount).toBe(8)
  })

  it('concurrency: on an account at 5 failures and out of delay, exactly one of 20 simultaneous attempts is reserved', async () => {
    const id = await newUser({ failedLoginCount: 5 })
    const results = await Promise.all(Array.from({ length: PARALLEL }, () => reserveLoginAttempt(dataSource, id, T0)))
    expect(results.filter((result) => result.reserved)).toHaveLength(1)
    expect(results.filter((result) => !result.reserved)).toHaveLength(PARALLEL - 1)
    expect((await stored(id)).failedLoginCount).toBe(6)
  })

  it('concurrency: before the free threshold every simultaneous attempt is counted', async () => {
    const id = await newUser()
    const results = await Promise.all(Array.from({ length: 4 }, () => reserveLoginAttempt(dataSource, id, T0)))
    expect(results.every((result) => result.reserved)).toBe(true)
    expect((await stored(id)).failedLoginCount).toBe(4)
  })
})

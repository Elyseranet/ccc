import 'reflect-metadata'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { DataSource } from 'typeorm'
import { USER_ROLE, USER_STATUS } from '../../shared/enums/user.enum'
import { SESSION_ABSOLUTE_TIMEOUT_SECONDS, SESSION_IDLE_TIMEOUT_SECONDS } from '../../server/consts/auth.const'
import { SessionEntity } from '../../server/database/entities/session.entity'
import { UserEntity } from '../../server/database/entities/user.entity'
import { createSession, resolveSession } from '../../server/utils/auth/session-store.util'
import { cleanup, resetSchema } from './helpers/test-database'

let dataSource: DataSource
let counter = 0

const HOUR = 3600 * 1000
const T0 = new Date('2026-10-20T08:00:00Z')
const at = (offsetMs: number): Date => new Date(T0.getTime() + offsetMs)

const newSession = async (): Promise<string> => {
  counter += 1
  const user = await dataSource.getRepository(UserEntity).save({
    email: `expiry${counter}@ccc.test`, role: USER_ROLE.PARTICIPANT, status: USER_STATUS.ACTIVE
  })
  return createSession(dataSource, user.id, T0)
}

beforeAll(async () => {
  dataSource = await resetSchema()
})

afterAll(async () => {
  await cleanup()
})

describe('session expiry (SEC-A1, injected clock)', () => {
  it('uses 2 h idle and 12 h absolute', () => {
    expect(SESSION_IDLE_TIMEOUT_SECONDS).toBe(2 * 3600)
    expect(SESSION_ABSOLUTE_TIMEOUT_SECONDS).toBe(12 * 3600)
  })

  it('sets expires_at to created_at + 12 h', async () => {
    const token = await newSession()
    expect(await resolveSession(dataSource, token, at(0))).not.toBeNull()
    const session = await dataSource.getRepository(SessionEntity).findOneByOrFail({ lastSeenAt: T0 })
    expect(session.expiresAt.getTime() - T0.getTime()).toBe(12 * HOUR)
  })

  it('accepts a session idle for just under 2 h', async () => {
    const token = await newSession()
    expect(await resolveSession(dataSource, token, at(2 * HOUR - 1000))).not.toBeNull()
  })

  it('refuses and revokes a session idle for more than 2 h', async () => {
    const token = await newSession()
    expect(await resolveSession(dataSource, token, at(2 * HOUR + 1000))).toBeNull()
    // révoquée : même "revenue" dans la fenêtre, elle ne revit pas
    expect(await resolveSession(dataSource, token, at(2 * HOUR + 2000))).toBeNull()
  })

  it('keeps a session alive while it is used (activity resets the idle clock)', async () => {
    const token = await newSession()
    for (const hours of [1.5, 3, 4.5, 6, 7.5, 9, 10.5]) {
      expect(await resolveSession(dataSource, token, at(hours * HOUR))).not.toBeNull()
    }
  })

  it('expires absolutely at 12 h whatever the activity', async () => {
    const token = await newSession()
    for (const hours of [1.5, 3, 4.5, 6, 7.5, 9, 10.5, 11.9]) {
      expect(await resolveSession(dataSource, token, at(hours * HOUR))).not.toBeNull()
    }
    expect(await resolveSession(dataSource, token, at(12 * HOUR + 1000))).toBeNull()
  })
})

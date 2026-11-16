import { QueryFailedError } from 'typeorm'
import { describe, expect, it } from 'vitest'
import { isEmailCollision } from '../../src/utils/email-collision.util'

const queryError = (driverError: Record<string, unknown>): QueryFailedError =>
  new QueryFailedError('INSERT', [], Object.assign(new Error('duplicate key'), driverError))

describe('isEmailCollision (T-SEC-12, L8)', () => {
  it('recognizes the unique violation of users.email only', () => {
    expect(isEmailCollision(queryError({ code: '23505', constraint: 'uq_users_email' }))).toBe(true)
    expect(isEmailCollision(queryError({ code: '23505', constraint: 'uq_users_competitor_id' }))).toBe(false)
    expect(isEmailCollision(queryError({ code: '23503', constraint: 'uq_users_email' }))).toBe(false)
  })

  it('ignores anything that is not a query error', () => {
    expect(isEmailCollision(new Error('x'))).toBe(false)
    expect(isEmailCollision(undefined)).toBe(false)
  })
})

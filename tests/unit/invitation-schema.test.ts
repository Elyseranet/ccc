import { describe, expect, it } from 'vitest'
import { newCompetitorSchema } from '../../src/server/schemas/competitor.schema'
import { acceptInvitationSchema } from '../../src/server/schemas/invitation.schema'
import { isWellFormedInvitationToken } from '../../src/utils/invitation-token.util'

const VALID = { email: 'Jeanne@CCC.test', firstName: 'Jeanne', lastName: 'Dupont', nickname: 'Jeannot', phone: '+33 6 12 34 56 78' }

describe('newCompetitorSchema', () => {
  it('accepts a complete identity and trims text', () => {
    expect(newCompetitorSchema.parse(VALID)).toMatchObject({ email: 'Jeanne@CCC.test', firstName: 'Jeanne' })
  })

  it('accepts a minimal identity (nickname and phone optional or null)', () => {
    expect(newCompetitorSchema.safeParse({ email: 'a@ccc.test', firstName: 'A', lastName: 'B' }).success).toBe(true)
    expect(newCompetitorSchema.safeParse({ email: 'a@ccc.test', firstName: 'A', lastName: 'B', nickname: null, phone: null }).success).toBe(true)
  })

  it.each([
    ['avatar (B-16)', { ...VALID, avatar: 'x' }],
    ['avatarUrl', { ...VALID, avatarUrl: 'https://x.test/a.png' }],
    ['role', { ...VALID, role: 'ADMIN' }],
    ['displayName', { ...VALID, displayName: 'x' }],
    ['bad email', { ...VALID, email: 'nope' }],
    ['email over 254', { ...VALID, email: `${'a'.repeat(250)}@b.co` }],
    ['empty first name', { ...VALID, firstName: '  ' }],
    ['first name over 80', { ...VALID, firstName: 'a'.repeat(81) }],
    ['bad phone', { ...VALID, phone: 'abc' }],
    ['missing email', { firstName: 'A', lastName: 'B' }]
  ])('rejects %s', (_label, body) => {
    expect(newCompetitorSchema.safeParse(body).success).toBe(false)
  })
})

describe('acceptInvitationSchema', () => {
  it('requires a 15 to 128 character password and nothing else', () => {
    expect(acceptInvitationSchema.safeParse({ password: 'a'.repeat(15) }).success).toBe(true)
    expect(acceptInvitationSchema.safeParse({ password: 'a'.repeat(14) }).success).toBe(false)
    expect(acceptInvitationSchema.safeParse({ password: 'a'.repeat(129) }).success).toBe(false)
    expect(acceptInvitationSchema.safeParse({}).success).toBe(false)
  })

  it('refuses unknown fields, avatar included', () => {
    expect(acceptInvitationSchema.safeParse({ password: 'a'.repeat(15), avatar: 'x' }).success).toBe(false)
    expect(acceptInvitationSchema.safeParse({ password: 'a'.repeat(15), email: 'x@y.test' }).success).toBe(false)
  })
})

describe('isWellFormedInvitationToken', () => {
  it('accepts 43 base64url characters only', () => {
    expect(isWellFormedInvitationToken('A'.repeat(43))).toBe(true)
    expect(isWellFormedInvitationToken('A'.repeat(42))).toBe(false)
    expect(isWellFormedInvitationToken(`${'A'.repeat(42)}+`)).toBe(false)
    expect(isWellFormedInvitationToken(undefined)).toBe(false)
  })
})

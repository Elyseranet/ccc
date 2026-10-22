import { describe, expect, it } from 'vitest'
import { newCompetitorSchema, updateCompetitorSchema } from '../../src/server/schemas/competitor.schema'
import { addParticipantSchema, createEditionSchema, updateEditionSchema } from '../../src/server/schemas/edition.schema'

describe('createEditionSchema', () => {
  it('accepts a minimal body and trims text', () => {
    expect(createEditionSchema.parse({ year: 2027, name: '  CCC 2027  ' })).toEqual({ year: 2027, name: 'CCC 2027' })
  })

  it.each([
    ['unknown field', { year: 2027, name: 'x', code: '2027z' }],
    ['status', { year: 2027, name: 'x', status: 'CLOSED' }],
    ['non-integer year', { year: 2027.5, name: 'x' }],
    ['year out of range', { year: 1999, name: 'x' }],
    ['empty name', { year: 2027, name: '   ' }],
    ['impossible date', { year: 2027, name: 'x', heldOn: '2027-02-30' }],
    ['wrong date format', { year: 2027, name: 'x', heldOn: '27/02/2027' }]
  ])('rejects %s', (_label, body) => {
    expect(createEditionSchema.safeParse(body).success).toBe(false)
  })
})

describe('updateEditionSchema (R-9)', () => {
  it.each(['code', 'year', 'chronologicalRank', 'status'])('rejects %s', (field) => {
    expect(updateEditionSchema.safeParse({ name: 'x', [field]: 1 }).success).toBe(false)
  })

  it('rejects an empty body and accepts a null location', () => {
    expect(updateEditionSchema.safeParse({}).success).toBe(false)
    expect(updateEditionSchema.parse({ location: null })).toEqual({ location: null })
  })
})

describe('updateCompetitorSchema', () => {
  it('accepts the identity fields', () => {
    expect(updateCompetitorSchema.parse({ displayName: ' Rémi ', nickname: null })).toEqual({ displayName: 'Rémi', nickname: null })
  })

  it.each(['avatarUrl', 'phone', 'email', 'id'])('rejects %s', (field) => {
    expect(updateCompetitorSchema.safeParse({ displayName: 'x', [field]: 'y' }).success).toBe(false)
  })

  it('rejects an empty body', () => {
    expect(updateCompetitorSchema.safeParse({}).success).toBe(false)
  })
})

describe('addParticipantSchema', () => {
  it('requires a uuid and nothing else', () => {
    expect(addParticipantSchema.safeParse({ competitorId: 'nope' }).success).toBe(false)
    expect(addParticipantSchema.safeParse({ competitorId: crypto.randomUUID(), extra: 1 }).success).toBe(false)
    expect(addParticipantSchema.safeParse({ competitorId: crypto.randomUUID() }).success).toBe(true)
  })
})

describe('newCompetitorSchema (shared with POST /competiteurs)', () => {
  const valid = { email: 'nina@ccc.test', firstName: 'Nina', lastName: 'Neuve' }

  it('accepts the required identity and optional nickname and phone', () => {
    expect(newCompetitorSchema.safeParse(valid).success).toBe(true)
    expect(newCompetitorSchema.safeParse({ ...valid, nickname: 'Ni', phone: '+33 6 12 34 56 78' }).success).toBe(true)
  })

  it.each([
    ['an avatar', { ...valid, avatarUrl: 'https://example.com/a.png' }],
    ['a bad email', { ...valid, email: 'nope' }],
    ['a missing last name', { email: valid.email, firstName: 'Nina' }],
    ['a bad phone', { ...valid, phone: 'abc' }]
  ])('rejects %s', (_label, body) => {
    expect(newCompetitorSchema.safeParse(body).success).toBe(false)
  })
})

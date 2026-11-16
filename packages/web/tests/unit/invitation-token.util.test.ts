import { describe, expect, it } from 'vitest'
import { INVITATION_TTL_DAYS, INVITATION_TTL_MS } from '../../src/consts/invitation.const'
import { generateInvitationToken, hashInvitationToken } from '../../src/utils/invitation-token.util'

describe('invitation token', () => {
  it('is 32 random bytes in base64url (43 characters) and unique', () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateInvitationToken().token))
    expect(tokens.size).toBe(50)
    for (const token of tokens) {
      expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/)
    }
  })

  it('hashes to a 64-character SHA-256 hex digest that differs from the token', () => {
    const { token, tokenHash } = generateInvitationToken()
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/)
    expect(hashInvitationToken(token)).toBe(tokenHash)
    expect(tokenHash).not.toBe(token)
  })

  it('has a 7-day validity (A14)', () => {
    expect(INVITATION_TTL_DAYS).toBe(7)
    expect(INVITATION_TTL_MS).toBe(7 * 24 * 3600 * 1000)
  })
})

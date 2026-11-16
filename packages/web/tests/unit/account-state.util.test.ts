import { describe, expect, it } from 'vitest'
import { ACCOUNT_STATE, USER_STATUS } from '../../src/enums/user.enum'
import { toAdminParticipantAccount } from '../../src/utils/account-state.util'

const NOW = new Date('2026-10-21T10:00:00.000Z')
const inDays = (days: number): Date => new Date(NOW.getTime() + days * 86_400_000)

describe('toAdminParticipantAccount', () => {
  it('is INVITED while the latest invitation is pending', () => {
    expect(toAdminParticipantAccount({ status: USER_STATUS.INVITED, latestInvitation: { expiresAt: inDays(3), consumedAt: null } }, NOW))
      .toEqual({ state: ACCOUNT_STATE.INVITED, invitationExpiresAt: inDays(3).toISOString() })
  })

  it('is INVITATION_EXPIRED when the latest invitation is expired, consumed or missing', () => {
    expect(toAdminParticipantAccount({ status: USER_STATUS.INVITED, latestInvitation: { expiresAt: inDays(-1), consumedAt: null } }, NOW).state)
      .toBe(ACCOUNT_STATE.INVITATION_EXPIRED)
    expect(toAdminParticipantAccount({ status: USER_STATUS.INVITED, latestInvitation: { expiresAt: NOW, consumedAt: null } }, NOW).state)
      .toBe(ACCOUNT_STATE.INVITATION_EXPIRED)
    expect(toAdminParticipantAccount({ status: USER_STATUS.INVITED, latestInvitation: null }, NOW))
      .toEqual({ state: ACCOUNT_STATE.INVITATION_EXPIRED, invitationExpiresAt: null })
  })

  it('is ACTIVE without an expiry once the account is active', () => {
    expect(toAdminParticipantAccount({ status: USER_STATUS.ACTIVE, latestInvitation: { expiresAt: inDays(-9), consumedAt: inDays(-10) } }, NOW))
      .toEqual({ state: ACCOUNT_STATE.ACTIVE, invitationExpiresAt: null })
  })
})

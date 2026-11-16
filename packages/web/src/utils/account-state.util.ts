import { ACCOUNT_STATE, USER_STATUS } from '../enums/user.enum.js'
import type { IAccountStateInput, IAdminParticipantAccount } from '../interfaces/edition.interface.js'

/**
 * ACTIVE si le compte l'est. Sinon INVITED tant que l'invitation la plus récente n'est ni consommée ni expirée,
 * INVITATION_EXPIRED dans tous les autres cas (expirée, remplacée par un renvoi, ou absente).
 */
export const toAdminParticipantAccount = (input: IAccountStateInput, now: Date): IAdminParticipantAccount => {
  if (input.status === USER_STATUS.ACTIVE) {
    return { state: ACCOUNT_STATE.ACTIVE, invitationExpiresAt: null }
  }
  const invitation = input.latestInvitation
  const pending = invitation !== null && invitation.consumedAt === null && invitation.expiresAt > now
  return {
    state: pending ? ACCOUNT_STATE.INVITED : ACCOUNT_STATE.INVITATION_EXPIRED,
    invitationExpiresAt: invitation ? invitation.expiresAt.toISOString() : null
  }
}

import { ADMINISTRATOR_EMAIL_WORD_SEPARATOR, ADMINISTRATOR_FAILURE_MESSAGES } from '../consts/admin-administrators.const.js'
import { ADMIN_REVOKE_CASE } from '../enums/administrator.enum.js'
import { FEEDBACK_STATUS } from '../enums/feedback.enum.js'
import { ACCOUNT_STATE, USER_STATUS } from '../enums/user.enum.js'
import type { IAdminFailure } from '../interfaces/admin-failure.interface.js'
import type { IParticipantFeedback } from '../interfaces/admin-participants.interface.js'
import type { IAdminAccount, IAdminInvited, IAdministratorRow } from '../interfaces/administrator.interface.js'
import type { ITranslatableText } from '../interfaces/common-components.interface.js'
import { API_ERROR_CODE } from '../enums/api-error-code.enum.js'
import { ApiRequestError } from './api-request-error.util.js'
import { toAdminFailure } from './admin-failure.util.js'
import { formatInvitationExpiry, toAccountFeedback } from './admin-competitors.util.js'

/*********************************************************
 * Administrateurs de l'admin (F-68, B-31)
 *
 * @description
 * Fonctions pures : lignes de la table, cas de retrait, retours et refus. Le compte n'a pas de nom (`users` ne le stocke pas) : seul
 * l'email est sûr, le nom vient de la fiche reliée quand il y en a une.
 ********************************************************/

export const toAdministratorState = (account: IAdminAccount): ACCOUNT_STATE => {
  if (account.status === USER_STATUS.ACTIVE) {
    return ACCOUNT_STATE.ACTIVE
  }
  return account.invitationExpired ? ACCOUNT_STATE.INVITATION_EXPIRED : ACCOUNT_STATE.INVITED
}

/** Nom dont l'avatar tire ses initiales : celui de la fiche, sinon les mots de la partie locale de l'email (« maya.bonnet@… » donne « MB »). */
export const toAdministratorAvatarName = (account: Pick<IAdminAccount, 'email' | 'competitor'>): string =>
  account.competitor?.displayName ?? (account.email.split('@')[0] ?? '').split(ADMINISTRATOR_EMAIL_WORD_SEPARATOR).join(' ')

/** Phrase sous l'email : la validité de l'invitation tant que le compte n'est pas activé, sinon la fiche reliée. */
export const toAdministratorDetail = (account: IAdminAccount, state: ACCOUNT_STATE): ITranslatableText => {
  if (state !== ACCOUNT_STATE.ACTIVE && account.invitationExpiresAt) {
    const date = formatInvitationExpiry(account.invitationExpiresAt)
    return state === ACCOUNT_STATE.INVITATION_EXPIRED
      ? { key: 'admin.administrators.detail_expired', fallback: 'Expirée le {date}', params: { date } }
      : { key: 'admin.administrators.detail_valid_until', fallback: 'Valable jusqu’au {date}', params: { date } }
  }
  return account.competitor
    ? { key: 'admin.administrators.detail_competitor', fallback: 'Fiche joueur : {name}', params: { name: account.competitor.displayName } }
    : { key: 'admin.administrators.detail_no_competitor', fallback: 'Aucune fiche joueur reliée' }
}

export const toAdministratorRows = (accounts: IAdminAccount[]): IAdministratorRow[] => {
  const activeCount = accounts.filter(account => account.status === USER_STATUS.ACTIVE).length
  return accounts.map((account) => {
    const state = toAdministratorState(account)
    return {
      id: account.id,
      email: account.email,
      avatarName: toAdministratorAvatarName(account),
      state,
      isSelf: account.isSelf,
      detail: toAdministratorDetail(account, state),
      canResend: state !== ACCOUNT_STATE.ACTIVE,
      canFix: state !== ACCOUNT_STATE.ACTIVE,
      lastActive: state === ACCOUNT_STATE.ACTIVE && activeCount <= 1
    }
  })
}

export const toRevokeCase = (account: IAdminAccount): ADMIN_REVOKE_CASE => {
  const active = account.status === USER_STATUS.ACTIVE
  if (account.competitor) {
    return active ? ADMIN_REVOKE_CASE.ACTIVE_WITH_COMPETITOR : ADMIN_REVOKE_CASE.INVITED_WITH_COMPETITOR
  }
  return active ? ADMIN_REVOKE_CASE.ACTIVE_WITHOUT_COMPETITOR : ADMIN_REVOKE_CASE.INVITED_WITHOUT_COMPETITOR
}

/** Nom du joueur d'un 409 `PROMOTION_CONFIRMATION_REQUIRED` (B-33, `details.displayName`) ; `null` pour toute autre erreur. */
export const toPromotionDisplayName = (cause: unknown): string | null => {
  if (!(cause instanceof ApiRequestError) || cause.error.code !== API_ERROR_CODE.PROMOTION_CONFIRMATION_REQUIRED) {
    return null
  }
  const details = cause.error.details
  const name = details && !Array.isArray(details) ? details.displayName : undefined
  return typeof name === 'string' ? name : ''
}

export const toAdministratorFailure = (cause: unknown): IAdminFailure => toAdminFailure(cause, ADMINISTRATOR_FAILURE_MESSAGES)

/** Retour d'une invitation : un compte joueur promu se nomme (`name` : sa fiche, sinon son email), un compte créé reprend le retour de F-62. */
export const toInviteFeedback = (result: IAdminInvited, email: string, name: string): IParticipantFeedback => result.promoted
  ? { status: FEEDBACK_STATUS.SUCCESS, message: { key: 'admin.administrators.feedback_promoted', fallback: '{name} est maintenant administrateur', params: { name } } }
  : toAccountFeedback(result, email)

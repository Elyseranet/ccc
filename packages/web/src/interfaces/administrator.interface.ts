import type { INVITATION_EMAIL_KIND } from '../enums/invitation-email.enum.js'
import type { ACCOUNT_STATE, USER_STATUS } from '../enums/user.enum.js'
import type { IAdminFailure } from './admin-failure.interface.js'
import type { ITranslatableText } from './common-components.interface.js'
import type { IIssuedInvitation } from './invitation.interface.js'

/** Fiche joueur liée à un compte administrateur (absente d'un administrateur créé par invitation). */
export interface IAdminAccountCompetitor {
  id: string
  displayName: string
}

/** `GET /admin/administrateurs` : un compte `role = ADMIN`. Aucun hash (mot de passe, jeton) n'est sérialisé. */
export interface IAdminAccount {
  id: string
  email: string
  status: USER_STATUS
  /** ISO 8601 : échéance de la dernière invitation non consommée ; `null` pour un compte actif. */
  invitationExpiresAt: string | null
  invitationExpired: boolean
  competitor: IAdminAccountCompetitor | null
  lastLoginAt: string | null
  createdAt: string
  isSelf: boolean
}

/** `POST /admin/administrateurs` : 201 à la création, 200 à la promotion d'un compte joueur existant (Q4). */
export interface IAdminInvited {
  id: string
  accountStatus: USER_STATUS
  promoted: boolean
  invitationSent: boolean
  /** ISO 8601 ; `null` pour un joueur actif promu (aucune invitation). */
  invitationExpiresAt: string | null
}

/** Résultat d'une écriture sur un compte administrateur, avant l'envoi du mail (qui part après le commit). */
export interface IAdminMailPayload {
  userId: string
  email: string
  firstName: string
  kind: INVITATION_EMAIL_KIND
  /** `null` : aucune invitation émise (joueur actif promu). */
  invitation: IIssuedInvitation | null
}

export interface IAdminInviteResult extends IAdminMailPayload {
  promoted: boolean
  accountStatus: USER_STATUS
}

/** Une ligne de la table, prête à afficher. */
export interface IAdministratorRow {
  id: string
  email: string
  /** Nom dont l'avatar tire ses initiales. */
  avatarName: string
  state: ACCOUNT_STATE
  isSelf: boolean
  /** Phrase sous l'email : fiche reliée, ou validité de l'invitation. */
  detail: ITranslatableText
  canResend: boolean
  canFix: boolean
  /** Retrait refusé d'avance : dernier administrateur actif. */
  lastActive: boolean
}

export interface IAdministratorListProps {
  administrators: IAdminAccount[]
  pending: boolean
  busy: boolean
}

export interface IAdministratorListEmits {
  (event: 'resend', id: string): void
  (event: 'fix', id: string): void
  (event: 'revoke', id: string): void
}

export interface IAdministratorInviteCardProps {
  modelValue: string
  pending: boolean
  failure: IAdminFailure | null
}

export interface IAdministratorInviteCardEmits {
  (event: 'update:modelValue', value: string): void
  (event: 'submit'): void
}

export interface IAdministratorFixDialogProps {
  open: boolean
  /** Le compte corrigé ; `null` quand la boîte est fermée. */
  account: IAdminAccount | null
  pending: boolean
  failure: IAdminFailure | null
}

export interface IAdministratorFixDialogEmits {
  (event: 'submit', email: string): void
  (event: 'cancel'): void
}

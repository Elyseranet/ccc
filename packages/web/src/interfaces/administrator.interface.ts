import type { ACCOUNT_STATE, USER_STATUS } from '../enums/user.enum.js'
import type { IAdminFailure } from './admin-failure.interface.js'
import type { ITranslatableText } from './common-components.interface.js'

/** `GET /admin/administrateurs` (B-31) : un compte `ADMIN`. Aucun hash n'est sérialisé. */
export interface IAdminAccount {
  id: string
  email: string
  status: USER_STATUS
  /** ISO 8601 : échéance de la dernière invitation non consommée, `null` pour un compte actif. */
  invitationExpiresAt: string | null
  invitationExpired: boolean
  /** Fiche reliée : un administrateur créé par la CLI n'en a pas. */
  competitor: { id: string, displayName: string } | null
  lastLoginAt: string | null
  createdAt: string
  isSelf: boolean
}

/** `POST /admin/administrateurs` : 201 pour un compte créé, 200 (`promoted: true`) pour un compte joueur promu. */
export interface IAdminInvited {
  id: string
  accountStatus: USER_STATUS
  promoted: boolean
  invitationSent: boolean
  /** ISO 8601 ; `null` quand le compte promu est déjà actif (aucun lien envoyé). */
  invitationExpiresAt: string | null
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

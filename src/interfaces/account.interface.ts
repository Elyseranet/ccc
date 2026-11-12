import type { ACCOUNT_ERROR, ACCOUNT_STATE_TONE, INVITATION_STATE } from '../enums/account.enum.js'
import type { IAccountMessage } from './account-message.interface.js'
import type { ITranslatableText } from './common-components.interface.js'
import type { IInvitationPreview } from './invitation.interface.js'
import type { IMe } from './me.interface.js'

export type { IAccountMessage }

export interface IAccountFormProps {
  /** Une action est en cours : le formulaire se désactive. */
  pending?: boolean
  /** La dernière erreur de l'action, ou `null`. */
  error?: ACCOUNT_ERROR | null
}

export interface IFormFieldProps {
  /** `id` du champ étiqueté : le libellé visible est lié par `for`. */
  fieldId: string
  label: ITranslatableText
}

export interface ILoginFormProps extends IAccountFormProps {}

export interface ILoginFormEmits {
  (event: 'submit', credentials: { email: string, password: string }): void
}

export interface IAvatarFieldProps {
  fieldId: string
  label: ITranslatableText
  /** Initiales affichées tant qu'il n'y a pas d'image. */
  initials: string
  /** Avatar courant (`avatarUrl` de l'API), ou `null`. */
  avatarUrl?: string | null
  /** Erreur à afficher sous le champ. */
  error?: ACCOUNT_ERROR | null
  /** Un téléversement est en cours. */
  pending?: boolean
  /** Propose de retirer l'avatar courant (profil uniquement). */
  removable?: boolean
}

export interface IAvatarFieldEmits {
  (event: 'select', file: File): void
  (event: 'invalid', reason: ACCOUNT_ERROR): void
  (event: 'remove'): void
}

export interface IInvitationFormProps extends IAccountFormProps {
  /** Initiales affichées dans l'avatar avant tout envoi. */
  initials: string
}

export interface IInvitationFormEmits {
  (event: 'submit', values: { password: string, phone: string | null, avatar: File | null }): void
}

export interface IInvitationStateProps {
  state: INVITATION_STATE
  /** Le compte est activé mais l'avatar a échoué. */
  activated?: boolean
  avatarError?: ACCOUNT_ERROR | null
}

export interface IInvitationStateEmits {
  (event: 'retry'): void
}

export interface IProfileFormProps extends IAccountFormProps {
  me: IMe
  avatarError?: ACCOUNT_ERROR | null
  avatarPending?: boolean
  logoutPending?: boolean
  logoutFailed?: boolean
}

export interface IProfileFormEmits {
  (event: 'submit', values: { phone: string | null, currentPassword: string, newPassword: string }): void
  (event: 'avatar', file: File): void
  (event: 'avatar-invalid', reason: ACCOUNT_ERROR): void
  (event: 'remove-avatar'): void
  (event: 'logout'): void
}

export interface IProfileReadonlyProps {
  me: IMe
}

export interface IProfileReadonlyItem {
  key: string
  value: string
  note: string
}

export interface IInvitationLoaderState {
  state: INVITATION_STATE
  preview: IInvitationPreview | null
}

export interface IAccountCardProps {
  /** `id` du titre qui nomme la carte (`aria-labelledby`). */
  labelledby: string
}

export interface IAccountStateProps {
  tone: ACCOUNT_STATE_TONE
  title: string
  text: string
  /** `id` du titre, pour nommer la région. */
  titleId: string
}

/** Évènement `submit` d'`origam-form` : un évènement natif qui est aussi une promesse du résultat de la validation. */
export interface IFormSubmitEvent extends Event, PromiseLike<{ valid: boolean }> {}

export interface IAccountAvatarProps {
  /** Initiales affichées tant qu'il n'y a pas d'image. */
  initials: string
  avatarUrl?: string | null
}

export interface IAccountCardSlots {
  default?: () => unknown
}

export interface IAccountStateSlots {
  default?: () => unknown
}

export interface IAccountLayoutSlots {
  main?: () => unknown
  side?: () => unknown
}

export interface IFormFieldSlots {
  default?: () => unknown
}

/** Une exigence de mot de passe affichée en liste sous le champ : `test` dit si la saisie la satisfait. */
export interface IPasswordRequirementRule {
  id: string
  label: string
  test: (value: string) => boolean
}

export interface IAccountLayoutProps {
  /** La carte principale est une carte d'état : elle a la largeur de la colonne d'accompagnement. */
  narrow?: boolean
}

import type { ACCOUNT_STATE } from '../enums/user.enum.js'
import type { PARTICIPANT_FEEDBACK_STATUS } from '../enums/participant-feedback.enum.js'
import type { IAdminParticipant } from './edition.interface.js'
import type { ITranslatableText } from './common-components.interface.js'

/** Retour d'une action sur les inscrits : un texte traduisible, jamais une chaîne finale. */
export interface IParticipantFeedback {
  status: PARTICIPANT_FEEDBACK_STATUS
  message: ITranslatableText
}

/** Valeurs du formulaire « Nouveau participant ». L'email et le téléphone restent privés (jamais affichés ailleurs). */
export interface IParticipantFormValues {
  lastName: string
  firstName: string
  nickname: string
  email: string
  phone: string
  avatar: File | null
}

/** Une suggestion du menu de recherche : un profil existant, ou l'entrée « Créer un nouveau participant ». */
export interface IParticipantSuggestion {
  value: string
  title: string
  subtitle: ITranslatableText
  initials: string
  avatarUrl: string | null
  isCreate: boolean
}

/** Une ligne de la table des inscrits, prête à afficher. */
export interface IParticipantRow {
  participationId: string
  competitorId: string
  displayName: string
  initials: string
  avatarUrl: string | null
  nickname: string
  editionsPlayed: number
  accountState: ACCOUNT_STATE | null
}

/** Photo à renvoyer après un échec du second appel (le compétiteur existe déjà, sans photo). */
export interface IPendingAvatar {
  competitorId: string
  displayName: string
  file: File
}

export interface IParticipantSearchProps {
  query: string
  suggestions: IParticipantSuggestion[]
  loading: boolean
  disabled: boolean
}

export interface IParticipantSearchEmits {
  (event: 'update:query', value: string): void
  (event: 'attach', competitorId: string): void
  (event: 'create', query: string): void
}

export interface IParticipantCreateFormProps {
  initialLastName: string
  pending: boolean
  emailTaken: boolean
}

export interface IParticipantCreateFormEmits {
  (event: 'submit', values: IParticipantFormValues): void
  (event: 'cancel'): void
  (event: 'update:email'): void
}

export interface IParticipantListProps {
  participants: IAdminParticipant[]
  editable: boolean
  pending: boolean
  busyParticipationId: string | null
}

export interface IParticipantListEmits {
  (event: 'remove', participationId: string): void
  (event: 'resend', competitorId: string): void
}

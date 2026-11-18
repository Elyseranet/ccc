import type { ALIGN } from 'origam/enums'
import type { ACCOUNT_ERROR } from '../enums/account.enum.js'
import type { IAdminFailure } from './admin-failure.interface.js'
import type { ITranslatableText } from './common-components.interface.js'
import type { IParticipantFeedback } from './admin-participants.interface.js'
import type { IAdminAccount } from './administrator.interface.js'
import type { ICompetitorAccount, ICompetitorDetail, ICompetitorListItem } from './competitor.interface.js'

/** Valeurs saisies de la correction d'identité ; un champ vide (hors nom affiché) efface la valeur. */
export interface ICompetitorFormValues {
  displayName: string
  firstName: string
  lastName: string
  nickname: string
}

export interface IAdminCompetitorColumn {
  /** Propriété affichée (clé de colonne d'origam-data-table). */
  field: string
  title: ITranslatableText
  align?: ALIGN.START | ALIGN.END
  /** Largeur et largeur minimale : celles de la maquette (la table défile dans son conteneur). */
  width: string
  minWidth: string
}

export interface ICompetitorsToolbarProps {
  query: string
  total: number
}

export interface ICompetitorsToolbarEmits {
  (event: 'update:query', value: string): void
}

export interface ICompetitorsTableProps {
  competitors: ICompetitorListItem[]
  /** Compétiteur dont l'identité est en cours de correction : sa ligne est marquée. */
  selectedId: string | null
  page: number
  pageSize: number
  total: number
}

export interface ICompetitorsTableEmits {
  (event: 'update:page', value: number): void
}

export interface ICompetitorIdentityFormProps {
  competitor: ICompetitorDetail
  values: ICompetitorFormValues
  pending?: boolean
  failure?: IAdminFailure | null
  saved?: boolean
}

export interface ICompetitorIdentityFormEmits {
  (event: 'submit', values: ICompetitorFormValues): void
}

export interface ICompetitorPhotoProps {
  displayName: string
  /** Photo courante (`avatarUrl` de l'API), ou `null` : les initiales s'affichent alors. */
  avatarUrl?: string | null
  /** Cause d'échec à afficher (refus local ou erreur 413, 415, 422 du serveur). */
  error?: ACCOUNT_ERROR | null
  /** Un envoi ou un retrait est en cours. */
  pending?: boolean
}

export interface ICompetitorPhotoEmits {
  (event: 'select', file: File): void
  (event: 'invalid', reason: ACCOUNT_ERROR): void
  (event: 'remove'): void
}

export interface IReferenceHeadProps {
  title: string
}

export interface ICompetitorsScreenProps {
  /** Compétiteur dont l'identité se corrige (identifiant de l'URL), ou `null` sur l'annuaire seul. */
  competitorId?: string | null
}

/** Champ de saisie de l'email d'un compte (F-62), partagé par le bloc « Compte » de la fiche et la boîte « Inviter » de la liste. */
export interface IAccountEmailFieldProps {
  modelValue: string
  /** Email refusé par le serveur (déjà pris) : le champ passe en erreur. */
  taken?: boolean
  /** Focus initial sur le champ : dans une boîte de dialogue, pas sur la fiche. */
  autofocus?: boolean
  /** Préfixe des `data-cy`. */
  cyPrefix: string
}

export interface IAccountEmailFieldEmits {
  (event: 'update:modelValue', value: string): void
}

export interface ICompetitorAccountBlockProps {
  account: ICompetitorAccount | null
  competitorId: string
  /** Nom affiché de la fiche (titre de la boîte « Relier »). */
  name: string
  /** Comptes administrateurs (B-31) ; `null` quand la liste n'a pas pu être lue : l'action « Relier » disparaît. */
  administrators?: IAdminAccount[] | null
  /** La liste est en cours de lecture. */
  administratorsPending?: boolean
  pending?: boolean
  failure?: IAdminFailure | null
  feedback?: IParticipantFeedback | null
}

export interface ICompetitorAccountBlockEmits {
  (event: 'submit', email: string): void
  /** Relie la fiche au compte administrateur d'email `email` (`PUT /competiteurs/{id}/compte`, B-32). */
  (event: 'link', email: string): void
  /** La boîte « Relier » s'ouvre : l'écran relit la liste des administrateurs. */
  (event: 'prepare'): void
  (event: 'dismiss'): void
}

export interface IParticipantInviteDialogProps {
  open: boolean
  /** Nom affiché du joueur invité. */
  name: string
  pending?: boolean
  failure?: IAdminFailure | null
}

export interface IParticipantInviteDialogEmits {
  (event: 'submit', email: string): void
  (event: 'cancel'): void
}

export interface IAdminLinkDialogProps {
  open: boolean
  /** Nom affiché de la fiche à relier. */
  name: string
  /** Administrateurs sans fiche reliée, parmi lesquels choisir. */
  candidates: IAdminAccount[]
  /** La liste n'a pas pu être lue : la boîte le dit, au lieu d'un choix vide. */
  unavailable?: boolean
  loading?: boolean
  /** Email du compte joueur invité jamais activé de la fiche (il sera supprimé), ou `null`. */
  invitedPlayerEmail?: string | null
  pending?: boolean
  failure?: IAdminFailure | null
}

export interface IAdminLinkDialogEmits {
  (event: 'submit', email: string): void
  (event: 'cancel'): void
}

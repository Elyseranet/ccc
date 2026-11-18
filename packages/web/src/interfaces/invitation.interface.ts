import type { USER_STATUS } from '../enums/user.enum.js'

/** Invitation émise côté serveur : le jeton en clair n'est renvoyé qu'une fois, jamais stocké ni journalisé. */
export interface IIssuedInvitation {
  invitationToken: string
  expiresAt: Date
}

export interface ICompetitorWithAccount extends IIssuedInvitation {
  competitorId: string
  userId: string
}

export interface IAcceptedInvitation {
  userId: string
  /** Jeton de session en clair, à poser en cookie. */
  sessionToken: string
}

export interface IResentInvitation extends IIssuedInvitation {
  userId: string
  email: string
  firstName: string
}

/** `POST /competiteurs` (201) : le compte est créé même si l'envoi échoue (`invitationSent: false`, renvoi possible). */
export interface ICompetitorCreated {
  competitorId: string
  invitationSent: boolean
  /** ISO 8601. */
  invitationExpiresAt: string
}

/** `POST /competiteurs/{id}/invitation` (200) : l'ancien lien est invalidé. */
export interface IInvitationResent {
  invitationSent: boolean
  /** ISO 8601. */
  invitationExpiresAt: string
}

/** `PUT /competiteurs/{id}/compte` : l'email est normalisé (espaces, casse) côté serveur. */
export interface ISetAccountEmailRequest {
  email: string
}

/**
 * `PUT /competiteurs/{id}/compte` (200). `linked: false` (B-29) : le compte est INVITED, l'ancien lien est invalidé ; l'envoi peut échouer sans rien annuler.
 * `linked: true` (B-32) : la fiche est reliée au compte d'un administrateur, `accountStatus` est son statut, aucun mail ne part et `invitationExpiresAt` est nul.
 */
export interface IAccountEmailSet extends Omit<IInvitationResent, 'invitationExpiresAt'> {
  accountStatus: USER_STATUS
  linked: boolean
  /** ISO 8601 ; `null` quand la fiche est reliée à un administrateur. */
  invitationExpiresAt: string | null
}

/** `GET /auth/invitation/{jeton}` (200) : seulement de quoi pré-remplir le formulaire de première connexion. */
export interface IInvitationPreview {
  firstName: string | null
  nickname: string | null
}

/**
 * `POST /auth/invitation/{jeton}` : le mot de passe est obligatoire ; un champ de profil omis garde la valeur
 * saisie par l'administrateur. Pas d'avatar : il se téléverse ensuite par `PUT /moi/avatar` (B-16).
 */
export interface IAcceptInvitationRequest {
  password: string
  firstName?: string
  lastName?: string
  nickname?: string | null
  phone?: string | null
}

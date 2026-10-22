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

import type { USER_STATUS } from '../enums/user.enum.js'

/** Fiche joueur reliée à un compte administrateur (`GET /admin/administrateurs`, B-31). */
export interface IAdminAccountCompetitor {
  id: string
  displayName: string
}

/** Compte administrateur (`GET /admin/administrateurs`, B-31). */
export interface IAdminAccount {
  id: string
  email: string
  status: USER_STATUS
  /** ISO 8601, échéance de la dernière invitation non consommée ; `null` pour un compte actif. */
  invitationExpiresAt: string | null
  invitationExpired: boolean
  /** Fiche reliée ; `null` tant que l'administrateur n'en a pas. */
  competitor: IAdminAccountCompetitor | null
  lastLoginAt: string | null
  createdAt: string
  /** Le compte de l'appelant. */
  isSelf: boolean
}

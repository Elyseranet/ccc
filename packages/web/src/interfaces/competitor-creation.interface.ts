/**
 * Identité saisie par l'administrateur pour créer un compétiteur avec son compte (P1, cas 2).
 * Pas d'avatar : il se téléverse ensuite (AV-1, B-16).
 */
export interface INewCompetitor {
  email: string
  firstName: string
  lastName: string
  nickname?: string | null
  phone?: string | null
}

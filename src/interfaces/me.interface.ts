import type { USER_ROLE } from '../enums/user.enum'
import type { ICompetitorPublic } from './competitor.interface'

/** Seule structure de l'API qui porte des données de contact, et uniquement pour leur titulaire. */
export interface IMeCompetitor extends ICompetitorPublic {
  phone: string | null
}

export interface IMe {
  id: string
  email: string
  role: USER_ROLE
  /** `null` pour un compte (administrateur) qui n'est lié à aucun compétiteur. */
  competitor: IMeCompetitor | null
}

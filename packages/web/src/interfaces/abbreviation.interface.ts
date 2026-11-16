import type { ABBREVIATION_KIND } from '../enums/abbreviation.enum.js'

export interface IAbbreviationSegment {
  text: string
  kind: ABBREVIATION_KIND | null
  /** Numéro d'un code de règle (« RG19 » donne 19) ; nul pour le reste. */
  number: number | null
}

export interface IAbbrTextProps {
  text: string
}

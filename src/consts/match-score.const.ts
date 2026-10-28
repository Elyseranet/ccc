import { EDITION_STATUS } from '../enums/edition.enum.js'
import { ROUND_STATUS } from '../enums/round.enum.js'

/** Un score ne s'enregistre ni ne se valide que dans un tour tiré ou en cours. */
export const OPEN_ROUND_STATUSES: readonly ROUND_STATUS[] = [ROUND_STATUS.DRAWN, ROUND_STATUS.PLAYING]

/**
 * R-3 : pour un match de poule, la qualification est « arrêtée » dès que l'édition a dépassé POOLS_PLAYING.
 * Le statut d'édition est posé par B-13 ; B-12 ne fait que le lire.
 */
export const QUALIFICATION_STOPPED_EDITION_STATUSES: readonly EDITION_STATUS[] = [
  EDITION_STATUS.QUALIFIED,
  EDITION_STATUS.PLAYOFFS,
  EDITION_STATUS.CLOSED
]

export const IF_MATCH_HEADER = 'if-match'

/** Version d'un match dans `If-Match` : entier, avec ou sans guillemets ni préfixe `W/`. */
export const IF_MATCH_VERSION_PATTERN = /^(?:W\/)?"?(\d{1,9})"?$/

/** Plafond défensif d'un score saisi ; les cibles valent 3, 5 ou 10. */
export const SCORE_INPUT_MAX = 99

/** Un match n'a jamais plus de côtés que le départage le plus large raisonnable. */
export const SCORE_SIDES_MAX = 16

export const ADMIN_MATCH_RELATIONS = {
  round: true,
  pool: true,
  sides: { participation: { competitor: true } },
  validatedBy: { competitor: true }
} as const

import { FINAL_STAGE } from '../../shared/enums/participation.enum'

/** RG1 : barème de référence pour une édition de 50 participants. */
export const POINTS_BASE_SCALE: Readonly<Record<FINAL_STAGE, number>> = {
  [FINAL_STAGE.CHAMPION]: 18,
  [FINAL_STAGE.FINALIST]: 13,
  [FINAL_STAGE.SEMI]: 9,
  [FINAL_STAGE.QUARTER]: 6,
  [FINAL_STAGE.ROUND_OF_16]: 3,
  [FINAL_STAGE.PLAYOFF]: 1,
  [FINAL_STAGE.POOL_ELIMINATED]: 0,
}

/** RG2 : effectif de référence du barème. */
export const POINTS_REFERENCE_PARTICIPANTS = 50

/** Les points sont calculés en centièmes (entiers) pour éviter les flottants. */
export const CENTS_PER_POINT = 100

/** RG4 : nombre d'éditions clôturées que somme l'ACP. */
export const ACP_WINDOW = 5

/** RG22 : score du vainqueur d'un match de poule (une bière) et d'un départage 1v1. */
export const SCORE_TARGET_POOL = 5

/** RG22 : score du vainqueur d'une rencontre de phase finale (deux bières). */
export const SCORE_TARGET_KNOCKOUT = 10

/** A11 : cible d'un départage à trois côtés. */
export const SCORE_TARGET_TIEBREAK_THREE_SIDES = 3

export const SIDES_DUEL = 2
export const SIDES_TRIPLE = 3

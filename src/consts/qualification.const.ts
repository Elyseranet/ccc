import { FINAL_STAGE } from '../enums/participation.enum.js'
import { ROUND_KIND } from '../enums/round.enum.js'

/** Les tours de phase finale dans l'ordre où ils se jouent (barrages, A9, puis huitièmes jusqu'à la finale). */
export const KNOCKOUT_ROUND_ORDER: readonly ROUND_KIND[] = [
  ROUND_KIND.PLAYOFF,
  ROUND_KIND.ROUND_OF_16,
  ROUND_KIND.QUARTER,
  ROUND_KIND.SEMI,
  ROUND_KIND.FINAL
]

/** Tour déduit de la taille du vivier : 2 joueurs la finale, 4 les demies, 8 les quarts, 16 les huitièmes (RG13). */
export const ROUND_KIND_BY_POOL_SIZE: Readonly<Record<number, ROUND_KIND>> = {
  2: ROUND_KIND.FINAL,
  4: ROUND_KIND.SEMI,
  8: ROUND_KIND.QUARTER,
  16: ROUND_KIND.ROUND_OF_16
}

/** Stade final d'un joueur éliminé dans un tour (RG1 : il rapporte les points de ce stade) ; le perdant de la finale est finaliste. */
export const ELIMINATED_FINAL_STAGE: Readonly<Record<string, FINAL_STAGE>> = {
  [ROUND_KIND.PLAYOFF]: FINAL_STAGE.PLAYOFF,
  [ROUND_KIND.ROUND_OF_16]: FINAL_STAGE.ROUND_OF_16,
  [ROUND_KIND.QUARTER]: FINAL_STAGE.QUARTER,
  [ROUND_KIND.SEMI]: FINAL_STAGE.SEMI,
  [ROUND_KIND.FINAL]: FINAL_STAGE.FINALIST
}

/** Bornes de la configuration de qualification : plafond absolu du schéma ; les bornes liées à l'édition sont vérifiées par le service. */
export const QUALIFICATION_TOP_PER_POOL_MAX = 20
export const QUALIFICATION_BEST_NEXT_MAX = 20

/** Un départage compte au plus ce nombre de joueurs (une poule en compte jusqu'à 8). */
export const TIEBREAK_PLAYERS_MAX = 16

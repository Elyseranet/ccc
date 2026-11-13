import { FINAL_STAGE } from '../enums/participation.enum.js'
import { ROUND_KIND } from '../enums/round.enum.js'

/** Stade que prend le perdant d'un match de phase finale, selon son tour. */
export const CLOSING_STAGE_BY_ROUND_KIND: Readonly<Partial<Record<ROUND_KIND, FINAL_STAGE>>> = {
  [ROUND_KIND.PLAYOFF]: FINAL_STAGE.PLAYOFF,
  [ROUND_KIND.ROUND_OF_16]: FINAL_STAGE.ROUND_OF_16,
  [ROUND_KIND.QUARTER]: FINAL_STAGE.QUARTER,
  [ROUND_KIND.SEMI]: FINAL_STAGE.SEMI,
  [ROUND_KIND.FINAL]: FINAL_STAGE.FINALIST
}

/** Du plus bas au plus haut : un joueur garde le meilleur stade qu'il a atteint. */
export const FINAL_STAGE_ORDER: readonly FINAL_STAGE[] = [
  FINAL_STAGE.POOL_ELIMINATED,
  FINAL_STAGE.PLAYOFF,
  FINAL_STAGE.ROUND_OF_16,
  FINAL_STAGE.QUARTER,
  FINAL_STAGE.SEMI,
  FINAL_STAGE.FINALIST,
  FINAL_STAGE.CHAMPION
]

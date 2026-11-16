import type { ADMIN_MATCH_ALL_ROUNDS_VALUE } from '../consts/admin-match-filters.const.js'
import type { ROUND_KIND } from '../enums/round.enum.js'

/** Tour choisi dans la file : un tour de l'édition, ou tous. */
export type TAdminMatchRound = ROUND_KIND | typeof ADMIN_MATCH_ALL_ROUNDS_VALUE

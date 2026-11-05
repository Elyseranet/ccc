import { ADMIN_MATCH_FILTER } from '../enums/admin-match-filter.enum.js'
import { MATCH_STATUS } from '../enums/match.enum.js'

/** Paramètre d'URL du filtre de la file (`/admin/matchs?f=saisis`). */
export const ADMIN_MATCH_FILTER_QUERY_PARAM = 'f'

/** Paramètre d'URL de la poule (`/admin/matchs?poule=2`). */
export const ADMIN_MATCH_POOL_QUERY_PARAM = 'poule'

export const ADMIN_MATCH_DEFAULT_FILTER = ADMIN_MATCH_FILTER.TO_PROCESS

/** Correspondance filtre -> statuts (F-08). `RESULT_UNKNOWN` (archives, lecture seule) n'est dans aucun filtre. */
export const ADMIN_MATCH_FILTER_STATUSES: Record<ADMIN_MATCH_FILTER, readonly MATCH_STATUS[]> = {
  [ADMIN_MATCH_FILTER.TO_PROCESS]: [MATCH_STATUS.RECORDED, MATCH_STATUS.SCHEDULED],
  [ADMIN_MATCH_FILTER.RECORDED]: [MATCH_STATUS.RECORDED],
  [ADMIN_MATCH_FILTER.UNSCORED]: [MATCH_STATUS.SCHEDULED],
  [ADMIN_MATCH_FILTER.VALIDATED]: [MATCH_STATUS.VALIDATED]
}

/** Ordre d'affichage et libellés des quatre filtres (A1). */
export const ADMIN_MATCH_FILTERS: ReadonlyArray<{ value: ADMIN_MATCH_FILTER, key: string, label: string }> = [
  { value: ADMIN_MATCH_FILTER.TO_PROCESS, key: 'admin.matches.filter_to_process', label: 'À traiter' },
  { value: ADMIN_MATCH_FILTER.RECORDED, key: 'admin.matches.filter_recorded', label: 'Saisis' },
  { value: ADMIN_MATCH_FILTER.UNSCORED, key: 'admin.matches.filter_unscored', label: 'Sans score' },
  { value: ADMIN_MATCH_FILTER.VALIDATED, key: 'admin.matches.filter_validated', label: 'Validés' }
]

/** Valeur de texte de « Toutes les poules » dans le sélecteur (Origam ne distingue pas `null` d'une absence de sélection). */
export const ADMIN_MATCH_ALL_POOLS_VALUE = 'all'

/** Clé `useAsyncData` de la file admin (fixe : le changement d'édition relance la requête par `watch`). */
export const ADMIN_MATCHES_ASYNC_KEY = 'admin-matches'

/** Paramètre d'URL du tour (`/admin/matchs?tour=QUARTER`). Absent : le tour en cours de l'édition. */
export const ADMIN_MATCH_ROUND_QUERY_PARAM = 'tour'

/** Valeur de « Tous les tours » dans l'URL et dans le sélecteur. */
export const ADMIN_MATCH_ALL_ROUNDS_VALUE = 'all'

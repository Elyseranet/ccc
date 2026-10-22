import { COMPETITOR_SORT, SORT_ORDER } from '../enums/competitor-sort.enum'
import { MATCH_STATUS } from '../enums/match.enum'

export const COMPETITOR_SEARCH_MIN_LENGTH = 2
export const COMPETITOR_SEARCH_MAX_LENGTH = 50

/** Lettres accentuées repliées côté SQL par `translate()` ; le motif reçu est replié côté JS (NFD). */
export const SEARCH_ACCENTED_CHARACTERS = 'àáâãäåçèéêëìíîïñòóôõöùúûüýÿāăąćčďēėęěīįńňōőūůűųžźżšś'
export const SEARCH_FOLDED_CHARACTERS = [...SEARCH_ACCENTED_CHARACTERS]
  .map((character) => character.normalize('NFD')[0]!)
  .join('')

export const COMPETITOR_DEFAULT_SORT = COMPETITOR_SORT.DISPLAY_NAME

/** Sens par défaut : alphabétique pour le nom, décroissant pour une statistique (les plus forts d'abord). */
export const COMPETITOR_DEFAULT_ORDER: Record<COMPETITOR_SORT, SORT_ORDER> = {
  [COMPETITOR_SORT.DISPLAY_NAME]: SORT_ORDER.ASC,
  [COMPETITOR_SORT.EDITIONS_PLAYED]: SORT_ORDER.DESC,
  [COMPETITOR_SORT.MATCHES_PLAYED]: SORT_ORDER.DESC,
  [COMPETITOR_SORT.WINS]: SORT_ORDER.DESC,
  [COMPETITOR_SORT.LOSSES]: SORT_ORDER.DESC,
  [COMPETITOR_SORT.TITLES]: SORT_ORDER.DESC,
  [COMPETITOR_SORT.FIRST_EDITION]: SORT_ORDER.ASC
}

export const LIKE_SPECIAL_CHARACTERS = /[\\%_]/g
export const COMBINING_MARKS = /\p{M}/gu

/** Colonnes publiques uniquement : le téléphone n'est même pas lu depuis la base. */
export const COMPETITOR_PUBLIC_COLUMNS = ['c.id', 'c.displayName', 'c.firstName', 'c.lastName', 'c.nickname', 'c.avatarUrl']

/** Statuts de match qui entrent dans les bilans : avec score, ou résultat inconnu (R-5). */
export const STATS_MATCH_STATUSES = [MATCH_STATUS.VALIDATED, MATCH_STATUS.RESULT_UNKNOWN]

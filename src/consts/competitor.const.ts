import { COMPETITOR_SORT, SORT_ORDER } from '../enums/competitor-sort.enum.js'
import { MATCH_STATUS } from '../enums/match.enum.js'
import type { TCompetitorSortKeyReader } from '../types/competitor-sort-key.type.js'

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

/** Clé de tri lue sur chaque ligne de l'annuaire, par critère. */
export const COMPETITOR_SORT_KEY: Record<COMPETITOR_SORT, TCompetitorSortKeyReader> = {
  [COMPETITOR_SORT.DISPLAY_NAME]: (item) => item.displayName.toLowerCase(),
  [COMPETITOR_SORT.EDITIONS_PLAYED]: (item) => item.editionsPlayed,
  [COMPETITOR_SORT.MATCHES_PLAYED]: (item) => item.matchesPlayed,
  [COMPETITOR_SORT.WINS]: (item) => item.wins,
  [COMPETITOR_SORT.LOSSES]: (item) => item.losses,
  [COMPETITOR_SORT.TITLES]: (item) => item.titles,
  [COMPETITOR_SORT.FIRST_EDITION]: (_item, career) => career?.firstEditionRank ?? null
}

/** Longueur maximale d'un nom, d'un prénom ou d'un pseudo (colonnes `varchar(80)`). */
export const COMPETITOR_NAME_PART_MAX_LENGTH = 80

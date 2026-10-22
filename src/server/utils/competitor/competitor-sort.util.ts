import { COMPETITOR_SORT, SORT_ORDER } from '../../../enums/competitor-sort.enum'
import type { TCompetitorSortKeyReader } from '../../../types/competitor-sort-key.type'
import type { ICompetitorCareer } from '../../interfaces/competitor.interface'
import type { ICompetitorListItem } from '../../../interfaces/competitor.interface'

const SORT_KEY: Record<COMPETITOR_SORT, TCompetitorSortKeyReader> = {
  [COMPETITOR_SORT.DISPLAY_NAME]: (item) => item.displayName.toLowerCase(),
  [COMPETITOR_SORT.EDITIONS_PLAYED]: (item) => item.editionsPlayed,
  [COMPETITOR_SORT.MATCHES_PLAYED]: (item) => item.matchesPlayed,
  [COMPETITOR_SORT.WINS]: (item) => item.wins,
  [COMPETITOR_SORT.LOSSES]: (item) => item.losses,
  [COMPETITOR_SORT.TITLES]: (item) => item.titles,
  [COMPETITOR_SORT.FIRST_EDITION]: (_item, career) => career?.firstEditionRank ?? null
}

const compareKeys = (a: number | string | null, b: number | string | null): number => {
  if (a === b) {
    return 0
  }
  // Une valeur absente (aucune édition) passe toujours en dernier.
  if (a === null) {
    return 1
  }
  if (b === null) {
    return -1
  }
  if (typeof a === 'string' && typeof b === 'string') {
    return a.localeCompare(b)
  }
  return a < b ? -1 : 1
}

/** Tri stable : à clé égale, ordre alphabétique puis identifiant. */
export const sortCompetitors = (
  items: ICompetitorListItem[],
  careers: Map<string, ICompetitorCareer>,
  sort: COMPETITOR_SORT,
  order: SORT_ORDER
): ICompetitorListItem[] => {
  const direction = order === SORT_ORDER.ASC ? 1 : -1
  const read = SORT_KEY[sort]
  return [...items].sort((a, b) => {
    const keyA = read(a, careers.get(a.id))
    const keyB = read(b, careers.get(b.id))
    const primary = compareKeys(keyA, keyB)
    // Les valeurs absentes restent en dernier quel que soit le sens.
    const ordered = keyA === null || keyB === null ? primary : primary * direction
    return ordered
      || a.displayName.localeCompare(b.displayName)
      || a.id.localeCompare(b.id)
  })
}

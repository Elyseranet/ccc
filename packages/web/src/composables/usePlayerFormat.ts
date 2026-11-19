import { COMPETITOR_SORT } from '~/enums/competitor-sort.enum'
import type { ICompetitorListItem } from '~/interfaces/competitor.interface'
import { PERCENT, PLAYERS_AVERAGE_DECIMALS, PLAYERS_EDITION_SUFFIX_LABELS, PLAYERS_SCORED_COLUMNS } from '~/consts/players.const'
import { useT } from '~/composables/useT'
import { splitEditionCode } from '~/utils/player.util'

/*********************************************************
 * usePlayerFormat
 *
 * @description
 * Formatage partagé de la liste et de la fiche : une édition 2012 compte deux éditions (2012a, 2012b),
 * affichées « 2012 · 1re » et « 2012 · 2e » comme dans les maquettes.
 ********************************************************/
export const usePlayerFormat = () => {
  const { t } = useT()

  const editionLabel = (code: string): string => {
    const { year, suffix } = splitEditionCode(code)
    const rank = suffix ? PLAYERS_EDITION_SUFFIX_LABELS[suffix] : undefined
    return rank ? `${year} · ${t(rank.key, rank.fallback)}` : year
  }

  /** F-73 : texte d'une colonne de bilan, ou null quand le joueur n'a aucun match avec score (l'appelant affiche « — »). */
  const scoredStat = (item: ICompetitorListItem, key: (typeof PLAYERS_SCORED_COLUMNS)[number]): string | null => {
    if (item.matchesPlayed === 0) {
      return null
    }
    switch (key) {
      case COMPETITOR_SORT.WIN_RATE:
        return t('players.percent', '{percent} %', { percent: Math.round((item.winRate ?? 0) * PERCENT) })
      case COMPETITOR_SORT.CAPS_FOR:
        return String(item.capsFor ?? 0)
      case COMPETITOR_SORT.CAPS_AGAINST:
        return String(item.capsAgainst ?? 0)
      case COMPETITOR_SORT.CAPS_DIFF:
        return `${(item.capsDiff ?? 0) > 0 ? '+' : ''}${item.capsDiff ?? 0}`
      default:
        return String(item.wins)
    }
  }

  const averageText = (item: ICompetitorListItem): string | null =>
    item.averagePoints === null ? null : item.averagePoints.toFixed(PLAYERS_AVERAGE_DECIMALS)

  return { editionLabel, scoredStat, averageText }
}

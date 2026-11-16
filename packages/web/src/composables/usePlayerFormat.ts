import { PLAYERS_EDITION_SUFFIX_LABELS } from '~/consts/players.const'
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

  return { editionLabel }
}

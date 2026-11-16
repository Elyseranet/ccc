import { computed } from 'vue'
import type { Ref } from 'vue'
import { useT } from '~/composables/useT'
import type { IHeadToHead } from '~/interfaces/head-to-head.interface'
import { winsTextOf } from '~/utils/head-to-head.util'

/*********************************************************
 * useHeadToHeadAnnouncement
 *
 * @description
 * Phrase que la région `role=status` de la page annonce quand le résultat du face-à-face apparaît (S2, WCAG 4.1.3) : « Face-à-face : 2 victoires de Clément Fossati,
 * 2 victoires de Nicolas Deseine. », ou la phrase « jamais affrontés » quand aucune rencontre n'a de score. Vide tant qu'il n'y a pas de résultat : la région
 * existe toujours, c'est le changement de son texte qui est annoncé.
 ********************************************************/
export const useHeadToHeadAnnouncement = (comparison: Ref<IHeadToHead | null>) => {
  const { t } = useT()
  const text = (entry: ReturnType<typeof winsTextOf>): string => t(entry.key, entry.fallback, entry.params)
  const announcement = computed(() => {
    const current = comparison.value
    if (!current) {
      return ''
    }
    if (current.winRatio === null) {
      return t('head_to_head.announce.never_met', 'Face-à-face : ces deux joueurs ne se sont jamais affrontés avec un score connu.')
    }
    const first = `${current.wins} ${text(winsTextOf(current.wins, current.competitor.displayName))}`
    const second = `${current.losses} ${text(winsTextOf(current.losses, current.opponent.displayName))}`
    return t('head_to_head.announce.result', 'Face-à-face : {first}, {second}.', { first, second })
  })
  return { announcement }
}

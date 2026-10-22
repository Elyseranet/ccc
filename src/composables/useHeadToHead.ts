import type { MaybeRefOrGetter } from 'vue'
import type { IHeadToHead } from '~/interfaces/head-to-head.interface'
import { CompetitorService } from '~/services/competitor.service'
import { toAsyncDataError } from '~/utils/async-data-error.util'

/*********************************************************
 * useHeadToHead
 *
 * @description
 * Face-à-face de deux joueurs (RG36, RG37), clé de cache stable par paire.
 * Tant qu'un des deux identifiants manque, aucune requête n'est émise et la donnée vaut `null`. Le statut réel
 * d'une erreur (400, 404…) est conservé pour l'écran.
 ********************************************************/
export const useHeadToHead = (id: MaybeRefOrGetter<string | null>, opponentId: MaybeRefOrGetter<string | null>) => {
  const service = new CompetitorService({ fetcher: useRequestFetch() })
  return useAsyncData<IHeadToHead | null>(
    `head-to-head:${toValue(id)}:${toValue(opponentId)}`,
    async () => {
      const first = toValue(id)
      const second = toValue(opponentId)
      if (!first || !second) {
        return null
      }
      try {
        return await service.headToHead(first, second)
      } catch (cause) {
        throw toAsyncDataError(cause)
      }
    },
    { watch: [() => toValue(id), () => toValue(opponentId)] }
  )
}

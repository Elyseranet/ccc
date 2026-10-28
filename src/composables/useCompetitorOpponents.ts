import type { MaybeRefOrGetter } from 'vue'
import type { IHeadToHeadSummary } from '~/interfaces/head-to-head.interface'
import { CompetitorService } from '~/services/competitor.service'
import { toAsyncDataError } from '~/utils/async-data-error.util'

/*********************************************************
 * useCompetitorOpponents
 *
 * @description
 * Adversaires déjà rencontrés (`GET /competiteurs/{id}/face-a-face` sans `adversaire`, RG36), dans l'ordre du serveur
 * (aucun tri côté navigateur). Sans identifiant (`null`), aucune requête n'est émise. Le statut réel d'une erreur est conservé.
 ********************************************************/
export const useCompetitorOpponents = (id: MaybeRefOrGetter<string | null>) => {
  const service = new CompetitorService({ fetcher: useRequestFetch() })
  return useAsyncData<IHeadToHeadSummary[]>(
    `competitor-opponents:${toValue(id)}`,
    async () => {
      const identifier = toValue(id)
      if (!identifier) {
        return []
      }
      try {
        return await service.opponents(identifier)
      } catch (cause) {
        throw toAsyncDataError(cause)
      }
    },
    { watch: [() => toValue(id)] }
  )
}

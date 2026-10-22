import type { MaybeRefOrGetter } from 'vue'
import type { ICompetitorDetail } from '~/interfaces/competitor.interface'
import { CompetitorService } from '~/services/competitor.service'
import { toAsyncDataError } from '~/utils/async-data-error.util'

/*********************************************************
 * useCompetitor
 *
 * @description
 * Fiche d'un compétiteur (`GET /competiteurs/{id}`), clé de cache stable par identifiant.
 * Sans identifiant (`null`), aucune requête n'est émise et la donnée vaut `null`. Le statut réel d'une erreur (404…)
 * est conservé pour l'écran.
 ********************************************************/
export const useCompetitor = (id: MaybeRefOrGetter<string | null>) => {
  const service = new CompetitorService({ fetcher: useRequestFetch() })
  return useAsyncData<ICompetitorDetail | null>(
    `competitor:${toValue(id)}`,
    async () => {
      const identifier = toValue(id)
      if (!identifier) {
        return null
      }
      try {
        return await service.detail(identifier)
      } catch (cause) {
        throw toAsyncDataError(cause)
      }
    },
    { watch: [() => toValue(id)] }
  )
}

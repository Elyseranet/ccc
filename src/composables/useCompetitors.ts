import type { MaybeRefOrGetter } from 'vue'
import type { ICompetitorsQuery } from '~/interfaces/api-client.interface'
import { CompetitorService } from '~/services/competitor.service'

/*********************************************************
 * useCompetitors
 *
 * @description
 * Annuaire des compétiteurs (`GET /competiteurs`), recherche publique comprise (E-e).
 ********************************************************/
export const useCompetitors = (query: MaybeRefOrGetter<ICompetitorsQuery> = {}) => {
  const service = new CompetitorService({ fetcher: useRequestFetch() })
  return useAsyncData(`competitors`, () => service.list(toValue(query)), { watch: [() => toValue(query)] })
}

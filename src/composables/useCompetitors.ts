import type { MaybeRefOrGetter } from 'vue'
import type { ICompetitorsQuery } from '~/interfaces/api-client.interface'
import { CompetitorService } from '~/services/competitor.service'

/*********************************************************
 * useCompetitors
 *
 * @description
 * Annuaire des compétiteurs (`GET /competiteurs`), recherche publique comprise (E-e).
 * `scope` distingue deux usages simultanés sur une même page (clé de cache propre à chacun).
 ********************************************************/
export const useCompetitors = (query: MaybeRefOrGetter<ICompetitorsQuery> = {}, scope = '') => {
  const service = new CompetitorService({ fetcher: useRequestFetch() })
  return useAsyncData(`competitors:${scope}`, () => service.list(toValue(query)), { watch: [() => toValue(query)] })
}

import type { MaybeRefOrGetter } from 'vue'
import { CompetitorService } from '~/services/competitor.service'

/*********************************************************
 * useCompetitor
 *
 * @description
 * Fiche d'un compétiteur (`GET /competiteurs/{id}`), clé de cache stable par identifiant.
 ********************************************************/
export const useCompetitor = (id: MaybeRefOrGetter<string>) => {
  const service = new CompetitorService({ fetcher: useRequestFetch() })
  return useAsyncData(`competitor:${toValue(id)}`, () => service.detail(toValue(id)), { watch: [() => toValue(id)] })
}

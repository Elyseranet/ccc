import type { MaybeRefOrGetter } from 'vue'
import { useFixtureVariant } from '~/composables/useFixtureVariant'
import type { ICompetitorsQuery } from '~/interfaces/api-client.interface'
import { CompetitorService } from '~/services/competitor.service'

/*********************************************************
 * useCompetitors
 *
 * @description
 * Annuaire des compétiteurs (`GET /competiteurs`), recherche publique comprise (E-e).
 ********************************************************/
export const useCompetitors = (query: MaybeRefOrGetter<ICompetitorsQuery> = {}) => {
  const variant = useFixtureVariant()
  const service = new CompetitorService({ variant })
  return useAsyncData(`competitors:${variant}`, () => service.list(toValue(query)), { watch: [() => toValue(query)] })
}

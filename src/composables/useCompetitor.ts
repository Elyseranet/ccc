import type { MaybeRefOrGetter } from 'vue'
import { useFixtureVariant } from '~/composables/useFixtureVariant'
import { CompetitorService } from '~/services/competitor.service'

/*********************************************************
 * useCompetitor
 *
 * @description
 * Fiche d'un compétiteur (`GET /competiteurs/{id}`), clé de cache stable par identifiant.
 ********************************************************/
export const useCompetitor = (id: MaybeRefOrGetter<string>) => {
  const variant = useFixtureVariant()
  const service = new CompetitorService({ variant })
  return useAsyncData(`competitor:${variant}:${toValue(id)}`, () => service.detail(toValue(id)), { watch: [() => toValue(id)] })
}

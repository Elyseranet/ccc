import type { MaybeRefOrGetter } from 'vue'
import { CompetitorService } from '~/services/competitor.service'

/*********************************************************
 * useCompetitorOpponents
 *
 * @description
 * Adversaires déjà rencontrés (`GET /competiteurs/{id}/face-a-face` sans `adversaire`, RG36), dans l'ordre du serveur
 * (aucun tri côté navigateur).
 ********************************************************/
export const useCompetitorOpponents = (id: MaybeRefOrGetter<string>) => {
  const service = new CompetitorService({ fetcher: useRequestFetch() })
  return useAsyncData(`competitor-opponents:${toValue(id)}`, () => service.opponents(toValue(id)), { watch: [() => toValue(id)] })
}

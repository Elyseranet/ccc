import type { MaybeRefOrGetter } from 'vue'
import { useFixtureVariant } from '~/composables/useFixtureVariant'
import type { RANKING_KIND } from '~/enums/ranking-kind.enum'
import { RankingService } from '~/services/ranking.service'

/*********************************************************
 * useRankings
 *
 * @description
 * Classement ACP ou All Time (RG4), clé de cache stable par type.
 ********************************************************/
export const useRankings = (kind: MaybeRefOrGetter<RANKING_KIND>) => {
  const variant = useFixtureVariant()
  const service = new RankingService({ variant })
  return useAsyncData(`ranking:${variant}:${toValue(kind)}`, () => service.ranking(toValue(kind)), { watch: [() => toValue(kind)] })
}

/*********************************************************
 * useRankingEvolution
 *
 * @description
 * Évolution annuelle de tous les joueurs en un seul appel (RG8, C5).
 ********************************************************/
export const useRankingEvolution = (kind: MaybeRefOrGetter<RANKING_KIND>) => {
  const variant = useFixtureVariant()
  const service = new RankingService({ variant })
  return useAsyncData(`ranking-evolution:${variant}:${toValue(kind)}`, () => service.evolution(toValue(kind)), { watch: [() => toValue(kind)] })
}

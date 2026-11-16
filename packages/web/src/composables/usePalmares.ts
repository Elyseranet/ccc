import { computed } from 'vue'
import { useEditions } from '~/composables/useEditions'
import { useRankingEvolution, useRankings } from '~/composables/useRankings'
import { RANKING_KIND } from '~/enums/ranking-kind.enum'
import { fromAsyncDataError } from '~/utils/async-data-error.util'
import { buildMostTitled, buildPalmaresEvolution, buildPalmaresScope, buildPalmaresTitles, buildRankingRows } from '~/utils/palmares.util'

/*********************************************************
 * usePalmares
 *
 * @description
 * Données du palmarès mises en forme pour la page : chronologie des titres (`GET /editions`), classements ACP et All Time,
 * évolution des premiers du classement ACP (RG4, RG8). Toute la mise en forme est dans `palmares.util` (testée en unitaire).
 * Les requêtes sont attendues : le HTML rendu côté serveur contient déjà les données (pas de décalage d'hydratation).
 ********************************************************/
export const usePalmares = async () => {
  const editionsRequest = useEditions()
  const acpRequest = useRankings(RANKING_KIND.ACP)
  const allTimeRequest = useRankings(RANKING_KIND.ALL_TIME)
  const evolutionRequest = useRankingEvolution(RANKING_KIND.ACP)
  await Promise.all([editionsRequest, acpRequest, allTimeRequest, evolutionRequest])
  const requests = [editionsRequest, acpRequest, allTimeRequest, evolutionRequest]
  const pending = computed(() => requests.some(request => request.pending.value))
  const failure = computed(() => requests.map(request => request.error.value).find(error => error !== null && error !== undefined))
  const pageError = computed(() => (failure.value ? fromAsyncDataError(failure.value) : null))
  const refresh = async () => {
    await Promise.all(requests.map(request => request.refresh()))
  }
  const titles = computed(() => buildPalmaresTitles(editionsRequest.data.value ?? []))
  const acp = computed(() => buildRankingRows(acpRequest.data.value ?? [], allTimeRequest.data.value ?? []))
  const allTime = computed(() => buildRankingRows(allTimeRequest.data.value ?? [], acpRequest.data.value ?? []))
  const scope = computed(() => buildPalmaresScope(editionsRequest.data.value ?? []))
  const mostTitled = computed(() => buildMostTitled(allTimeRequest.data.value ?? []))
  const evolution = computed(() => buildPalmaresEvolution(acp.value, evolutionRequest.data.value ?? []))
  return { pending, pageError, refresh, titles, acp, allTime, mostTitled, evolution, scope }
}

import { computed } from 'vue'
import { HOME_MATCHES_QUERY } from '~/consts/home.const'
import { RANKING_KIND } from '~/enums/ranking-kind.enum'
import type { IHomeOverview } from '~/interfaces/home.interface'
import { EditionService } from '~/services/edition.service'
import { RankingService } from '~/services/ranking.service'
import { fromAsyncDataError, toAsyncDataError } from '~/utils/async-data-error.util'
import { buildHomeOverview, selectCurrentEdition } from '~/utils/home.util'

/*********************************************************
 * useHomeOverview
 *
 * @description
 * Données de l'accueil en une seule requête asynchrone : un seul état de chargement et d'erreur pour la page (nouvelle tentative = `refresh`).
 * Les éditions et les compteurs d'archive (`GET /stats`, jamais une somme des `matchCount`) sont lus d'abord ; le détail de l'édition en cours,
 * ses derniers scores validés et le classement ACP le sont ensuite, en parallèle. Le statut réel d'une erreur (429, 5xx, hors ligne) est conservé.
 ********************************************************/
export const useHomeOverview = () => {
  const fetcher = useRequestFetch()
  const editionService = new EditionService({ fetcher })
  const rankingService = new RankingService({ fetcher })
  const result = useAsyncData<IHomeOverview>('home-overview', async () => {
    try {
      const [editions, stats] = await Promise.all([editionService.list(), editionService.stats()])
      const current = selectCurrentEdition(editions)
      const [detail, page, ranking] = await Promise.all([
        current ? editionService.detail(current.id) : null,
        current ? editionService.matches(current.id, HOME_MATCHES_QUERY) : null,
        rankingService.ranking(RANKING_KIND.ACP)
      ])
      return buildHomeOverview({ editions, stats, detail, matches: page?.items ?? [], ranking })
    } catch (cause) {
      throw toAsyncDataError(cause)
    }
  })
  const apiError = computed(() => result.error.value ? fromAsyncDataError(result.error.value) : null)
  return { ...result, apiError }
}

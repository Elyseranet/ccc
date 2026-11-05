import { computed } from 'vue'
import { useAdminEdition } from '~/composables/useAdminEdition'
import { useAdminEditionStore } from '~/composables/useAdminEditionStore'
import { useEditions } from '~/composables/useEditions'
import { useT } from '~/composables/useT'
import { ADMIN_MATCH_DEFAULT_FILTER, ADMIN_MATCH_FILTER_QUERY_PARAM, ADMIN_MATCH_FILTERS, ADMIN_MATCH_POOL_QUERY_PARAM, ADMIN_MATCHES_ASYNC_KEY } from '~/consts/admin-match-filters.const'
import { EDITION_STATUS } from '~/enums/edition.enum'
import type { ADMIN_MATCH_FILTER } from '~/enums/admin-match-filter.enum'
import type { IAdminMatch } from '~/interfaces/admin-match.interface'
import type { IMatchFilterView } from '~/interfaces/admin-match-queue.interface'
import { MatchService } from '~/services/match.service'
import { countByFilter, matchesFilter, parseAdminMatchFilter, parseAdminMatchPool, poolsOf, sortForQueue, toMatchCard } from '~/utils/admin-match.util'
import { fromAsyncDataError, toAsyncDataError } from '~/utils/async-data-error.util'

/*********************************************************
 * useMatchQueue
 *
 * @description
 * File admin des scores de l'édition active (`GET /admin/editions/{id}/matchs`, C6). La liste complète est chargée une fois :
 * les compteurs des quatre filtres en découlent sans autre appel, et le filtre (`?f=`) et la poule (`?poule=`) sont portés
 * par l'URL (changer de filtre ne recharge rien). Une édition archivée est en lecture seule : aucune action sur les cartes.
 * Clé de cache fixe : l'édition active (cookie) n'est connue qu'après le chargement des éditions, une clé calculée à partir d'elle
 * serait `null` au rendu serveur et autre chose à l'hydratation (liste vide affichée). Le changement d'édition relance la requête (`watch`).
 * Contexte Nuxt : `useRequestFetch`, `useAsyncData` et `useRoute` ne marchent qu'avant le premier `await` d'un composable. Toutes les
 * requêtes démarrent donc d'abord, puis une seule attente les rassemble (même recette que `useEditionView`).
 * Après une écriture, `replaceMatch` remplace la ligne par la réponse du serveur (sa nouvelle version comprise) sans relire la liste.
 ********************************************************/
export const useMatchQueue = async () => {
  const route = useRoute()
  const router = useRouter()
  const { t } = useT()
  const service = new MatchService({ fetcher: useRequestFetch() })
  const store = useAdminEditionStore()
  const adminEdition = useAdminEdition()
  const editionsRequest = useEditions()
  const editionId = computed(() => store.editionId)

  const request = useAsyncData(
    ADMIN_MATCHES_ASYNC_KEY,
    async (): Promise<IAdminMatch[]> => {
      await adminEdition
      if (!editionId.value) {
        return []
      }
      try {
        return await service.adminList(editionId.value)
      } catch (cause) {
        throw toAsyncDataError(cause)
      }
    },
    { watch: [editionId], default: () => [] }
  )
  await Promise.all([adminEdition, editionsRequest, request])
  const { data: editions } = editionsRequest

  const replaceQuery = (name: string, value: string | null) => {
    const { [name]: _previous, ...rest } = route.query
    return router.replace({ query: value === null ? rest : { ...rest, [name]: value } })
  }

  const filter = computed<ADMIN_MATCH_FILTER>({
    get: () => parseAdminMatchFilter(route.query[ADMIN_MATCH_FILTER_QUERY_PARAM]),
    set: value => { replaceQuery(ADMIN_MATCH_FILTER_QUERY_PARAM, value === ADMIN_MATCH_DEFAULT_FILTER ? null : value) }
  })

  const pool = computed<number | null>({
    get: () => parseAdminMatchPool(route.query[ADMIN_MATCH_POOL_QUERY_PARAM]),
    set: value => { replaceQuery(ADMIN_MATCH_POOL_QUERY_PARAM, value === null ? null : String(value)) }
  })

  const edition = computed(() => (editions.value ?? []).find(entry => entry.id === editionId.value) ?? null)
  const isReadonly = computed(() => edition.value?.status === EDITION_STATUS.CLOSED)
  const matches = computed(() => request.data.value ?? [])
  const pools = computed(() => poolsOf(matches.value))
  const inPool = computed(() => matches.value.filter(match => pool.value === null || match.poolRank === pool.value))
  const counts = computed(() => countByFilter(inPool.value))
  const filterViews = computed<IMatchFilterView[]>(() => ADMIN_MATCH_FILTERS.map(entry => ({
    value: entry.value,
    label: t(entry.key, entry.label),
    count: counts.value[entry.value]
  })))
  const cards = computed(() => sortForQueue(inPool.value)
    .filter(match => matchesFilter(match, filter.value))
    .map(match => toMatchCard(match, edition.value?.code ?? '', isReadonly.value)))
  const isEmpty = computed(() => matches.value.length === 0)
  const pageError = computed(() => request.error.value ? fromAsyncDataError(request.error.value) : null)

  const findMatch = (id: string): IAdminMatch | null => matches.value.find(match => match.id === id) ?? null

  const replaceMatch = (updated: IAdminMatch) => {
    request.data.value = matches.value.map(match => match.id === updated.id ? updated : match)
  }

  const reload = async () => {
    await request.refresh()
  }

  return { filter, pool, pools, filterViews, cards, isEmpty, isReadonly, edition, pageError, pending: request.pending, findMatch, replaceMatch, reload }
}

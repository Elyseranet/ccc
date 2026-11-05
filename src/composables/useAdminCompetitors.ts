import { computed, ref, watch } from 'vue'
import { useCompetitors } from '~/composables/useCompetitors'
import { useDebouncedValue } from '~/composables/useDebouncedValue'
import { ADMIN_COMPETITORS_CACHE_SCOPE, ADMIN_COMPETITORS_SEARCH_DEBOUNCE_MS } from '~/consts/admin-competitors.const'
import { fromAsyncDataError } from '~/utils/async-data-error.util'
import { buildAdminCompetitorsLocationQuery, toAdminCompetitorsQuery, toAdminPage, toAdminSearch } from '~/utils/admin-competitors.util'

/*********************************************************
 * useAdminCompetitors
 *
 * @description
 * Annuaire des compétiteurs de l'admin (`GET /competiteurs`) : la recherche et la page vivent dans l'URL (`?q=&page=`), pour
 * que la liste survive au passage de la liste à la fiche d'un compétiteur. La frappe est regroupée par un délai (la recherche
 * est limitée en débit), la page repart à 1 quand la recherche change. Une recherche de moins de deux caractères n'est pas
 * envoyée (le serveur la refuse en 400) : la liste reste complète.
 ********************************************************/
export const useAdminCompetitors = () => {
  const route = useRoute()
  const router = useRouter()
  const search = computed(() => toAdminSearch(route.query.q))
  const page = computed(() => toAdminPage(route.query.page))
  const draft = ref(search.value)
  const debounced = useDebouncedValue(draft, ADMIN_COMPETITORS_SEARCH_DEBOUNCE_MS)
  const apiQuery = computed(() => toAdminCompetitorsQuery(search.value, page.value))
  const { data, pending, error, refresh } = useCompetitors(apiQuery, ADMIN_COMPETITORS_CACHE_SCOPE)

  watch(debounced, (value) => {
    if (value !== search.value) {
      void router.replace({ query: buildAdminCompetitorsLocationQuery(route.query, { q: value, page: 1 }) })
    }
  })

  const setPage = (value: number) => {
    void router.replace({ query: buildAdminCompetitorsLocationQuery(route.query, { page: value }) })
  }

  const competitors = computed(() => data.value?.items ?? [])
  const total = computed(() => data.value?.total ?? 0)
  const failure = computed(() => error.value ? fromAsyncDataError(error.value) : null)
  const isEmpty = computed(() => !pending.value && !failure.value && competitors.value.length === 0)

  return { draft, competitors, total, page, pending, failure, isEmpty, setPage, refresh }
}

import { computed, ref } from 'vue'
import { ADMIN_EDITIONS_LIST_CACHE_KEY } from '~/consts/admin-editions.const'
import { EditionService } from '~/services/edition.service'
import { fromAsyncDataError } from '~/utils/async-data-error.util'
import { filterEditions } from '~/utils/admin-editions.util'

/*********************************************************
 * useAdminEditions
 *
 * @description
 * Liste des éditions de l'écran admin (`GET /admin/editions`, B-20 : chaque édition avec `registeredCount`, le nombre d'inscrits
 * en direct) sous sa propre clé de cache (le sélecteur d'édition de la coque garde `editions`, forme publique) et
 * recherche par code ou par année. L'erreur est rendue sous forme d'`ApiRequestError`, que `AsyncState` sait afficher.
 ********************************************************/
export const useAdminEditions = () => {
  const service = new EditionService({ fetcher: useRequestFetch() })
  const { data, pending, error, refresh } = useAsyncData(ADMIN_EDITIONS_LIST_CACHE_KEY, () => service.adminList())
  const query = ref('')
  const all = computed(() => data.value ?? [])
  const editions = computed(() => filterEditions(all.value, query.value))
  const failure = computed(() => error.value ? fromAsyncDataError(error.value) : null)
  const isEmpty = computed(() => !pending.value && !failure.value && all.value.length === 0)
  const hasNoMatch = computed(() => all.value.length > 0 && editions.value.length === 0)
  return { editions, total: computed(() => all.value.length), query, pending, failure, isEmpty, hasNoMatch, refresh }
}

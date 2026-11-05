import { computed, ref } from 'vue'
import { useEditions } from '~/composables/useEditions'
import { fromAsyncDataError } from '~/utils/async-data-error.util'
import { filterEditions } from '~/utils/admin-editions.util'

/*********************************************************
 * useAdminEditions
 *
 * @description
 * Liste des éditions de l'écran admin (`GET /editions`, même clé de cache que le sélecteur d'édition de la coque) et
 * recherche par code ou par année. L'erreur est rendue sous forme d'`ApiRequestError`, que `AsyncState` sait afficher.
 ********************************************************/
export const useAdminEditions = () => {
  const { data, pending, error, refresh } = useEditions()
  const query = ref('')
  const all = computed(() => data.value ?? [])
  const editions = computed(() => filterEditions(all.value, query.value))
  const failure = computed(() => error.value ? fromAsyncDataError(error.value) : null)
  const isEmpty = computed(() => !pending.value && !failure.value && all.value.length === 0)
  const hasNoMatch = computed(() => all.value.length > 0 && editions.value.length === 0)
  return { editions, total: computed(() => all.value.length), query, pending, failure, isEmpty, hasNoMatch, refresh }
}

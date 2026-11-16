import { computed } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { useT } from '~/composables/useT'
import { ADMIN_DASHBOARD_ACTIVITY_LIMIT } from '~/consts/admin-dashboard.const'
import { EditionService } from '~/services/edition.service'
import { buildActivityRows } from '~/utils/admin-dashboard.util'
import { fromAsyncDataError, toAsyncDataError } from '~/utils/async-data-error.util'

/*********************************************************
 * useAdminActivity
 *
 * @description
 * Flux « Activité récente » (A17 : validations de match et de tirage), `GET /admin/editions/{id}/activite?limit=` (B-15).
 * Requête séparée du reste du tableau de bord : son erreur ne masque ni le centre de contrôle ni les cartes « À traiter ».
 * Tant que la route n'existe pas, l'appel échoue et le bloc affiche l'état d'erreur d'AsyncState : aucune donnée simulée (ARCH-8).
 ********************************************************/
export const useAdminActivity = (editionId: MaybeRefOrGetter<string | null>) => {
  const { t } = useT()
  const service = new EditionService({ fetcher: useRequestFetch() })

  const { data, pending, error: rawError, refresh } = useAsyncData(
    () => `admin-activity:${toValue(editionId) ?? 'none'}`,
    async () => {
      const id = toValue(editionId)
      if (!id) {
        return []
      }
      try {
        return await service.adminActivity(id, ADMIN_DASHBOARD_ACTIVITY_LIMIT)
      } catch (cause) {
        throw toAsyncDataError(cause)
      }
    },
    { watch: [() => toValue(editionId)], default: () => [] }
  )

  const rows = computed(() => buildActivityRows(data.value ?? [], ADMIN_DASHBOARD_ACTIVITY_LIMIT, t))
  const error = computed(() => rawError.value ? fromAsyncDataError(rawError.value) : null)

  return { rows, pending, error, refresh }
}

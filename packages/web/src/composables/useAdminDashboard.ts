import { computed } from 'vue'
import { useAdminEditionStore } from '~/composables/useAdminEditionStore'
import { useT } from '~/composables/useT'
import { EditionService } from '~/services/edition.service'
import { DrawService } from '~/services/draw.service'
import { MatchService } from '~/services/match.service'
import type { IAdminDashboardData } from '~/interfaces/admin-dashboard.interface'
import { buildDashboardView, classifyError } from '~/utils/admin-dashboard.util'
import { fromAsyncDataError, toAsyncDataError } from '~/utils/async-data-error.util'

/*********************************************************
 * useAdminDashboard
 *
 * @description
 * Répond à « que dois-je faire maintenant ? » pour l'édition active de l'admin : étape active du centre de contrôle
 * (déduite de `EDITION_STATUS` et des tours), compteurs à traiter et état de l'écran.
 * Sources : `GET /editions/{id}`, `GET /admin/editions/{id}/matchs` (liste complète : les compteurs en sont dérivés)
 * et `GET /admin/editions/{id}/tirages`. Le statut réel d'une erreur (401, 403, 404, hors ligne) est conservé pour l'écran.
 ********************************************************/
export const useAdminDashboard = async () => {
  const { t } = useT()
  const store = useAdminEditionStore()
  const fetcher = useRequestFetch()
  const editions = new EditionService({ fetcher })
  const matches = new MatchService({ fetcher })
  const draws = new DrawService({ fetcher })
  const editionId = computed(() => store.editionId)

  const { data, pending, error: rawError, refresh } = await useAsyncData<IAdminDashboardData | null>(
    () => `admin-dashboard:${editionId.value ?? 'none'}`,
    async () => {
      const id = editionId.value
      if (!id) {
        return null
      }
      try {
        const [edition, adminMatches, adminDraws] = await Promise.all([
          editions.detail(id),
          matches.adminList(id),
          draws.adminList(id)
        ])
        return { edition, adminMatches, draws: adminDraws }
      } catch (cause) {
        throw toAsyncDataError(cause)
      }
    },
    { watch: [editionId] }
  )

  /*********************************************************
   * Erreur
   *
   * @description
   * Reconstruit l'`ApiRequestError` pour `AsyncState` et classe le cas (401, 403, 404, autre).
   ********************************************************/
  const error = computed(() => rawError.value ? fromAsyncDataError(rawError.value) : null)
  const errorKind = computed(() => classifyError(error.value?.error ?? null))

  /*********************************************************
   * Vue
   *
   * @description
   * `null` tant qu'il n'y a pas d'édition à afficher (aucune édition, erreur, chargement).
   ********************************************************/
  const view = computed(() => data.value ? buildDashboardView(data.value, t) : null)
  const isEmpty = computed(() => !pending.value && error.value === null && view.value === null)

  return { view, pending, error, errorKind, isEmpty, refresh, editionId }
}

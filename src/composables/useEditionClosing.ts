import { computed, ref } from 'vue'
import { useAdminEdition } from '~/composables/useAdminEdition'
import { useAdminEditionStore } from '~/composables/useAdminEditionStore'
import { ADMIN_CLOSING_ASYNC_KEY } from '~/consts/edition-closing-view.const'
import type { CLOSING_FAILURE } from '~/enums/edition-closing-view.enum'
import { EditionService } from '~/services/edition.service'
import { fromAsyncDataError, toAsyncDataError } from '~/utils/async-data-error.util'
import { computeClosingPreview } from '~/utils/edition-closing.util'
import { toClosingFailure } from '~/utils/edition-closing-failure.util'
import { buildClosingView } from '~/utils/edition-closing-view.util'

/*********************************************************
 * useEditionClosing
 *
 * @description
 * Page de clôture de l'édition active (F-26, B-14). L'aperçu des points vient de `computeClosingPreview`, la même fonction que celle qui fige les
 * points côté serveur (CLOSE-PREVIEW) : aucun endpoint d'aperçu, aucun calcul recopié. La clôture est `POST /editions/{id}/cloture` (idempotent,
 * sans `If-Match`) ; le serveur reste la source de vérité : en cas d'échec on relit l'édition (`verify`), on ne présume de rien. Clé de cache fixe
 * (même raison que `useMatchQueue`) : le changement d'édition relance la requête. Contexte Nuxt : `useRequestFetch` et `useAsyncData` avant le premier `await`.
 ********************************************************/
export const useEditionClosing = async () => {
  const service = new EditionService({ fetcher: useRequestFetch() })
  const store = useAdminEditionStore()
  const adminEdition = useAdminEdition()
  const editionId = computed(() => store.editionId)

  const request = useAsyncData(
    ADMIN_CLOSING_ASYNC_KEY,
    async () => {
      await adminEdition
      if (!editionId.value) {
        return null
      }
      try {
        return await service.detail(editionId.value)
      } catch (cause) {
        throw toAsyncDataError(cause)
      }
    },
    { watch: [editionId], default: () => null }
  )
  await Promise.all([adminEdition, request])

  const edition = computed(() => request.data.value ?? null)
  const preview = computed(() => edition.value ? computeClosingPreview(edition.value) : null)
  const view = computed(() => edition.value && preview.value ? buildClosingView(edition.value, preview.value) : null)
  const pageError = computed(() => request.error.value ? fromAsyncDataError(request.error.value) : null)

  const failure = ref<CLOSING_FAILURE | null>(null)
  const closing = ref(false)
  const justClosed = ref(false)

  const verify = async () => {
    failure.value = null
    await request.refresh()
  }

  const close = async (): Promise<boolean> => {
    if (!editionId.value || closing.value || view.value === null || preview.value?.blockedBy !== null) {
      return false
    }
    closing.value = true
    failure.value = null
    try {
      await service.close(editionId.value)
      justClosed.value = true
      await Promise.all([request.refresh(), refreshNuxtData('editions')])
      return true
    } catch (cause) {
      failure.value = toClosingFailure(cause)
      return false
    } finally {
      closing.value = false
    }
  }

  return { edition, preview, view, pageError, pending: request.pending, failure, closing, justClosed, verify, close }
}

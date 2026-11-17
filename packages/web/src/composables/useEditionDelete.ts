import { ref } from 'vue'
import { useAdminEditionStore } from '~/composables/useAdminEditionStore'
import { ADMIN_EDITIONS_CACHE_KEY, ADMIN_EDITIONS_LIST_CACHE_KEY, ADMIN_EDITION_DELETED_STATE_KEY } from '~/consts/admin-editions.const'
import { ROUTES } from '~/consts/routes.const'
import type { IAdminFailure } from '~/interfaces/admin-failure.interface'
import type { IEditionSummary } from '~/interfaces/edition.interface'
import { EditionService } from '~/services/edition.service'
import { toEditionFailure } from '~/utils/admin-editions.util'

/*********************************************************
 * useEditionDelete
 *
 * @description
 * Suppression d'une édition créée dans l'appli (`DELETE /editions/{id}`, B-28 ; F-60). Succès : les listes se rechargent, l'édition
 * active du sélecteur est remise à `null` si c'était elle (la règle par défaut s'applique alors), le code supprimé est posé dans
 * `useState` pour le snackbar de la liste, et l'admin y est renvoyé. Échec (409 archive, 404, 403…) : `failure`, la fiche reste.
 ********************************************************/
export const useEditionDelete = () => {
  const service = new EditionService({ fetcher: useRequestFetch() })
  const store = useAdminEditionStore()
  const deletedCode = useState<string | null>(ADMIN_EDITION_DELETED_STATE_KEY, () => null)
  const deleting = ref(false)
  const failure = ref<IAdminFailure | null>(null)

  const remove = async (edition: Pick<IEditionSummary, 'id' | 'code'>): Promise<boolean> => {
    if (deleting.value) {
      return false
    }
    deleting.value = true
    failure.value = null
    try {
      await service.remove(edition.id)
      if (store.editionId === edition.id) {
        store.editionId = null
      }
      deletedCode.value = edition.code
      await Promise.all([refreshNuxtData(ADMIN_EDITIONS_CACHE_KEY), refreshNuxtData(ADMIN_EDITIONS_LIST_CACHE_KEY)])
      await navigateTo(ROUTES.ADMIN_EDITIONS)
      return true
    } catch (cause) {
      failure.value = toEditionFailure(cause, edition.code)
      return false
    } finally {
      deleting.value = false
    }
  }

  return { remove, deleting, failure, deletedCode }
}

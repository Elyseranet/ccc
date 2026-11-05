import { ref } from 'vue'
import { ADMIN_EDITIONS_CACHE_KEY } from '~/consts/admin-editions.const'
import type { IEditionFormValues } from '~/interfaces/admin-editions.interface'
import type { IAdminFailure } from '~/interfaces/admin-failure.interface'
import type { IEditionSummary } from '~/interfaces/edition.interface'
import { EditionService } from '~/services/edition.service'
import { toCreateEditionRequest, toEditionFailure } from '~/utils/admin-editions.util'

/*********************************************************
 * useEditionCreate
 *
 * @description
 * Création d'une édition (`POST /editions`). Le code est généré par le serveur (CE-1) et rendu dans `created`. Un envoi à
 * la fois. La liste des éditions (et le sélecteur de la coque) est rechargée après la création.
 ********************************************************/
export const useEditionCreate = () => {
  const service = new EditionService({ fetcher: useRequestFetch() })
  const pending = ref(false)
  const failure = ref<IAdminFailure | null>(null)
  const created = ref<IEditionSummary | null>(null)

  const create = async (values: IEditionFormValues): Promise<boolean> => {
    if (pending.value) {
      return false
    }
    pending.value = true
    failure.value = null
    try {
      created.value = await service.create(toCreateEditionRequest(values))
      await refreshNuxtData(ADMIN_EDITIONS_CACHE_KEY)
      return true
    } catch (cause) {
      failure.value = toEditionFailure(cause)
      return false
    } finally {
      pending.value = false
    }
  }

  const reset = () => {
    created.value = null
    failure.value = null
  }

  return { create, reset, pending, failure, created }
}

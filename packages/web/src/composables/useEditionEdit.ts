import type { MaybeRefOrGetter } from 'vue'
import { computed, ref } from 'vue'
import { useEdition } from '~/composables/useEdition'
import { ADMIN_EDITIONS_CACHE_KEY } from '~/consts/admin-editions.const'
import { API_ERROR_CODE } from '~/enums/api-error-code.enum'
import type { IEditionFormValues } from '~/interfaces/admin-editions.interface'
import type { IAdminFailure } from '~/interfaces/admin-failure.interface'
import { EditionService } from '~/services/edition.service'
import { fromAsyncDataError } from '~/utils/async-data-error.util'
import { isEditionClosed, toEditionFailure, toUpdateEditionRequest } from '~/utils/admin-editions.util'
import { ApiRequestError } from '~/utils/api-request-error.util'

/*********************************************************
 * useEditionEdit
 *
 * @description
 * Lecture (`GET /editions/{code}`) et modification (`PATCH /editions/{code}`) d'une édition : nom, date, lieu et
 * description (R-9). Une édition clôturée est en lecture seule ; si elle l'est devenue entre-temps, le 409 `EDITION_CLOSED`
 * recharge la fiche pour afficher son état réel.
 ********************************************************/
export const useEditionEdit = (code: MaybeRefOrGetter<string>) => {
  const service = new EditionService({ fetcher: useRequestFetch() })
  const { data: edition, pending: loading, error, refresh } = useEdition(code)
  const saving = ref(false)
  const saved = ref(false)
  const failure = ref<IAdminFailure | null>(null)

  const loadFailure = computed(() => error.value ? fromAsyncDataError(error.value) : null)
  const isClosed = computed(() => edition.value ? isEditionClosed(edition.value) : false)

  const reload = async () => {
    await Promise.all([refresh(), refreshNuxtData(ADMIN_EDITIONS_CACHE_KEY)])
  }

  const update = async (values: IEditionFormValues): Promise<boolean> => {
    const current = edition.value
    if (!current || saving.value) {
      return false
    }
    saving.value = true
    saved.value = false
    failure.value = null
    try {
      await service.update(current.id, toUpdateEditionRequest(values))
      await reload()
      saved.value = true
      return true
    } catch (cause) {
      failure.value = toEditionFailure(cause, current.code)
      if (cause instanceof ApiRequestError && cause.error.code === API_ERROR_CODE.EDITION_CLOSED) {
        await reload()
      }
      return false
    } finally {
      saving.value = false
    }
  }

  return { edition, loading, loadFailure, isClosed, update, saving, saved, failure, refresh }
}

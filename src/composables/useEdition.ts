import type { MaybeRefOrGetter } from 'vue'
import { EditionService } from '~/services/edition.service'
import { toAsyncDataError } from '~/utils/async-data-error.util'

/*********************************************************
 * useEdition
 *
 * @description
 * Détail d'une édition (`GET /editions/{id}`), clé de cache stable par identifiant. Le statut réel d'une erreur (404…) est conservé pour l'écran.
 ********************************************************/
export const useEdition = (id: MaybeRefOrGetter<string>) => {
  const service = new EditionService({ fetcher: useRequestFetch() })
  return useAsyncData(`edition:${toValue(id)}`, async () => {
    try {
      return await service.detail(toValue(id))
    } catch (cause) {
      throw toAsyncDataError(cause)
    }
  }, { watch: [() => toValue(id)] })
}

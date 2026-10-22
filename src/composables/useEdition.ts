import type { MaybeRefOrGetter } from 'vue'
import { EditionService } from '~/services/edition.service'

/*********************************************************
 * useEdition
 *
 * @description
 * Détail d'une édition (`GET /editions/{id}`), clé de cache stable par identifiant.
 ********************************************************/
export const useEdition = (id: MaybeRefOrGetter<string>) => {
  const service = new EditionService({ fetcher: useRequestFetch() })
  return useAsyncData(`edition:${toValue(id)}`, () => service.detail(toValue(id)), { watch: [() => toValue(id)] })
}

import type { MaybeRefOrGetter } from 'vue'
import { useFixtureVariant } from '~/composables/useFixtureVariant'
import { EditionService } from '~/services/edition.service'

/*********************************************************
 * useEdition
 *
 * @description
 * Détail d'une édition (`GET /editions/{id}`), clé de cache stable par identifiant.
 ********************************************************/
export const useEdition = (id: MaybeRefOrGetter<string>) => {
  const variant = useFixtureVariant()
  const service = new EditionService({ variant })
  return useAsyncData(`edition:${variant}:${toValue(id)}`, () => service.detail(toValue(id)), { watch: [() => toValue(id)] })
}

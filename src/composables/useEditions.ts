import { useFixtureVariant } from '~/composables/useFixtureVariant'
import { EditionService } from '~/services/edition.service'

/*********************************************************
 * useEditions
 *
 * @description
 * Liste des éditions (`GET /editions`), clé de cache stable.
 ********************************************************/
export const useEditions = () => {
  const variant = useFixtureVariant()
  const service = new EditionService({ variant })
  return useAsyncData(`editions:${variant}`, () => service.list())
}

/*********************************************************
 * useArchiveStats
 *
 * @description
 * Compteurs d'archive (`GET /stats`, C1).
 ********************************************************/
export const useArchiveStats = () => {
  const variant = useFixtureVariant()
  const service = new EditionService({ variant })
  return useAsyncData(`stats:${variant}`, () => service.stats())
}

import { EditionService } from '~/services/edition.service'

/*********************************************************
 * useEditions
 *
 * @description
 * Liste des éditions (`GET /editions`), clé de cache stable.
 ********************************************************/
export const useEditions = () => {
  const service = new EditionService({ fetcher: useRequestFetch() })
  return useAsyncData(`editions`, () => service.list())
}

/*********************************************************
 * useArchiveStats
 *
 * @description
 * Compteurs d'archive (`GET /stats`, C1).
 ********************************************************/
export const useArchiveStats = () => {
  const service = new EditionService({ fetcher: useRequestFetch() })
  return useAsyncData(`stats`, () => service.stats())
}

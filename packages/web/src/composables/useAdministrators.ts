import type { IAdminAccount } from '~/interfaces/administrator.interface'
import { AdministratorService } from '~/services/administrator.service'

/*********************************************************
 * useAdministrators
 *
 * @description
 * Comptes administrateurs (`GET /admin/administrateurs`, B-31), lus côté navigateur seulement (`server: false`) : une panne passagère n'est pas figée dans
 * le rendu serveur, et `refresh` la relit. Une erreur laisse `administrators` à `null` une fois `status` à `success` (avant, `null` veut dire « pas encore lu ») ; l'écran qui s'en sert (F-69) le dit dans la boîte.
 ********************************************************/
export const useAdministrators = () => {
  const service = new AdministratorService({ fetcher: useRequestFetch() })
  const { data: administrators, pending, status, refresh } = useAsyncData<IAdminAccount[] | null>(
    'admin-administrators',
    async () => {
      try {
        return await service.list()
      } catch {
        return null
      }
    },
    { server: false }
  )
  return { administrators, pending, status, refresh }
}

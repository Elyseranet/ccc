import { ME_STATE_KEY } from '~/consts/auth-session.const'
import { HTTP_STATUS_UNAUTHORIZED } from '~/consts/http-status.const'
import type { IMe } from '~/interfaces/me.interface'
import { MeService } from '~/services/me.service'
import { useAuthStore } from '~/composables/useAuthStore'
import { ApiRequestError } from '~/utils/api-request-error.util'

/*********************************************************
 * useMe
 *
 * @description
 * Charge la session (`GET /moi`, B-08) et alimente le store d'authentification avec l'`IMe` reçu. Sans session, l'API répond
 * 401 : le visiteur est anonyme (`null`), ce n'est pas une erreur. Toute autre erreur reste exposée par `useAsyncData`.
 ********************************************************/
export const useMe = async () => {
  const auth = useAuthStore(useNuxtApp().$pinia)
  const service = new MeService({ fetcher: useRequestFetch() })
  const asyncData = await useAsyncData(ME_STATE_KEY, async (): Promise<IMe | null> => {
    try {
      return await service.me()
    } catch (cause) {
      if (cause instanceof ApiRequestError && cause.error.statusCode === HTTP_STATUS_UNAUTHORIZED) {
        return null
      }
      throw cause
    }
  })
  auth.setMe(asyncData.data.value ?? null)
  return asyncData
}

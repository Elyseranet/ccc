import { ANONYMOUS_SESSION } from '~/consts/auth.const'
import { HTTP_STATUS_UNAUTHORIZED } from '~/consts/async-state.const'
import type { ISessionIdentity } from '~/interfaces/session.interface'
import { MeService } from '~/services/me.service'
import { useAuthStore } from '~/stores/auth.store'
import { ApiRequestError } from '~/utils/api-request-error.util'
import { toSessionIdentity } from '~/utils/session.util'

/*********************************************************
 * useMe
 *
 * @description
 * Charge la session (`GET /moi`, B-08) et alimente le store d'authentification. Sans session, l'API répond 401 :
 * le visiteur est anonyme, ce n'est pas une erreur. Toute autre erreur reste exposée par `useAsyncData`.
 ********************************************************/
export const useMe = async () => {
  const auth = useAuthStore(useNuxtApp().$pinia)
  const service = new MeService({ fetcher: useRequestFetch() })
  const asyncData = await useAsyncData('me', async (): Promise<ISessionIdentity> => {
    try {
      return toSessionIdentity(await service.me())
    } catch (cause) {
      if (cause instanceof ApiRequestError && cause.error.statusCode === HTTP_STATUS_UNAUTHORIZED) {
        return ANONYMOUS_SESSION
      }
      throw cause
    }
  })
  auth.setSession(asyncData.data.value ?? ANONYMOUS_SESSION)
  return asyncData
}

import { useFixtureRole, useFixtureVariant } from '~/composables/useFixtureVariant'
import { MeService } from '~/services/me.service'
import { useAuthStore } from '~/stores/auth.store'

/*********************************************************
 * useMe
 *
 * @description
 * Charge la session (`GET /moi`) et alimente le store d'authentification.
 ********************************************************/
export const useMe = async () => {
  const auth = useAuthStore(useNuxtApp().$pinia)
  const service = new MeService({ variant: useFixtureVariant(), fixtureRole: useFixtureRole() })
  const asyncData = await useAsyncData('me', () => service.me())
  auth.setSession(asyncData.data.value ?? { role: null, initials: null })
  return asyncData
}

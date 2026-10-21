import { useFixtureVariant } from '~/composables/useFixtureVariant'
import { ROUTES } from '~/consts/routes.const'
import { AuthService } from '~/services/auth.service'
import { useAuthStore } from '~/stores/auth.store'

/*********************************************************
 * useLogout
 *
 * @description
 * Déconnexion : `POST /auth/logout`, puis la session locale est vidée et l'utilisateur est renvoyé vers l'espace public.
 * Si l'appel échoue, la session serveur est peut-être encore valide : on ne vide pas la session locale et `failed` passe à vrai,
 * pour que l'écran le dise au lieu de laisser croire à une déconnexion.
 ********************************************************/
export const useLogout = () => {
  const auth = useAuthStore()
  const service = new AuthService({ variant: useFixtureVariant() })
  const pending = ref(false)
  const failed = ref(false)

  const logout = async () => {
    pending.value = true
    failed.value = false
    try {
      await service.logout()
    } catch {
      failed.value = true
      pending.value = false
      return
    }
    auth.clear()
    pending.value = false
    await navigateTo(ROUTES.HOME)
  }

  return { logout, pending, failed }
}

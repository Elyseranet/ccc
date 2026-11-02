import { ref } from 'vue'
import { useAuthStore } from '~/composables/useAuthStore'
import { ROUTES } from '~/consts/routes.const'
import type { ACCOUNT_ERROR } from '~/enums/account.enum'
import type { ILoginRequest } from '~/interfaces/auth.interface'
import { AuthService } from '~/services/auth.service'
import { toAccountError } from '~/utils/account-error.util'

/*********************************************************
 * useLogin
 *
 * @description
 * Connexion : `POST /auth/login` renvoie le compte (`IMe`), que le store garde. Le serveur pose le cookie de session
 * (httpOnly) : le navigateur n'en lit ni n'en stocke rien. Un administrateur arrive sur son espace, un participant sur son
 * profil (E-d). Toute cause d'échec devient une `ACCOUNT_ERROR` affichable ; le formulaire ne vide jamais le mot de passe
 * de force, c'est au composant de le faire.
 ********************************************************/
export const useLogin = () => {
  const auth = useAuthStore()
  const service = new AuthService({ fetcher: useRequestFetch() })
  const pending = ref(false)
  const error = ref<ACCOUNT_ERROR | null>(null)

  const login = async (credentials: ILoginRequest) => {
    pending.value = true
    error.value = null
    try {
      const me = await service.login(credentials)
      auth.setMe(me)
      await navigateTo(auth.isAdmin ? ROUTES.ADMIN : ROUTES.PROFILE)
    } catch (cause) {
      error.value = toAccountError(cause)
    } finally {
      pending.value = false
    }
  }

  return { login, pending, error }
}

import { useAuthStore } from '~/composables/useAuthStore'
import { useLoginRedirect } from '~/composables/useLoginRedirect'

/*********************************************************
 * Middleware authenticated
 *
 * @description
 * `/profil` exige une session, quel que soit le rôle. Sans session, on renvoie vers `/connexion`. L'état connecté vient
 * de `GET /moi` (plugin `session`), jamais d'un cookie lu côté navigateur : il est httpOnly.
 ********************************************************/
export default defineNuxtRouteMiddleware(() => {
  const redirectToLogin = useLoginRedirect()
  const auth = useAuthStore(useNuxtApp().$pinia)

  if (auth.isAuthenticated) {
    return
  }
  return redirectToLogin()
})

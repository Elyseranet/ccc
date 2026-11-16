import { useAuthStore } from '~/composables/useAuthStore'
import { useLoginRedirect } from '~/composables/useLoginRedirect'

/*********************************************************
 * Middleware admin
 *
 * @description
 * `/admin/**` exige le rôle administrateur (Spec fonctionnelle, « Droits »).
 * Sans session ou sans ce rôle, on renvoie vers `/connexion`.
 *
 * @description
 * Cause racine d'une instabilité e2e (access.spec, 1 échec sur 100 environ) : voir `useLoginRedirect`, qui capture
 * l'évènement de la requête au début du middleware. Le store est aussi résolu avec le `pinia` de cette requête, jamais
 * avec le pinia actif global.
 ********************************************************/
export default defineNuxtRouteMiddleware(() => {
  const redirectToLogin = useLoginRedirect()
  const auth = useAuthStore(useNuxtApp().$pinia)

  if (auth.isAdmin) {
    return
  }
  return redirectToLogin()
})

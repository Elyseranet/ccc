import { sendRedirect } from 'h3'
import { ROUTES } from '~/consts/routes.const'
import { useAuthStore } from '~/stores/auth.store'

/*********************************************************
 * Middleware admin
 *
 * @description
 * `/admin/**` exige le rôle administrateur (Spec fonctionnelle, « Droits »).
 * Sans session ou sans ce rôle, on renvoie vers `/connexion`.
 *
 * @description
 * Cause racine d'une instabilité e2e (access.spec, 1 échec sur 100 environ) : côté serveur, `navigateTo` retrouve
 * l'évènement de requête par le contexte global de Nuxt. Sous requêtes concurrentes du serveur de dev, la redirection
 * d'une requête sans session s'est écrite sur la réponse d'une requête administrateur (le serveur voyait pourtant le
 * bon rôle). On capture donc l'évènement de la requête au tout début du middleware et on redirige explicitement dessus ;
 * le store est aussi résolu avec le `pinia` de cette requête, jamais avec le pinia actif global.
 ********************************************************/
export default defineNuxtRouteMiddleware(() => {
  const nuxtApp = useNuxtApp()
  const event = import.meta.server ? useRequestEvent() : undefined
  const auth = useAuthStore(nuxtApp.$pinia)

  if (auth.isAdmin) {
    return
  }
  if (event) {
    return sendRedirect(event, ROUTES.LOGIN, 302)
  }
  return navigateTo(ROUTES.LOGIN)
})

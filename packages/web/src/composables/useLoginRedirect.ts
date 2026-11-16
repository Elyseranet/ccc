import { sendRedirect } from 'h3'
import { ROUTES } from '~/consts/routes.const'

/*********************************************************
 * useLoginRedirect
 *
 * @description
 * Renvoie vers `/connexion`, depuis un middleware de route. Côté serveur, `navigateTo` retrouve l'évènement de requête par le
 * contexte global de Nuxt : sous requêtes concurrentes (serveur de dev), la redirection d'une requête sans session s'est
 * écrite sur la réponse d'une autre. On capture donc l'évènement au tout début du middleware et on redirige explicitement
 * dessus. Le composable doit donc être appelé en tête du middleware, avant tout `await`.
 ********************************************************/
export const useLoginRedirect = () => {
  const event = import.meta.server ? useRequestEvent() : undefined
  return () => event ? sendRedirect(event, ROUTES.LOGIN, 302) : navigateTo(ROUTES.LOGIN)
}

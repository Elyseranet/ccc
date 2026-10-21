import { isPageAccessible } from '~/utils/page-delivery.util'

/*********************************************************
 * Middleware de livraison des pages (OPS-3)
 *
 * @description
 * En production, une page non livrée (`PAGE_DELIVERY`) répond 404. Le middleware est global et tourne avant
 * `admin` : une page admin non livrée ne révèle ni redirection ni existence. `throw createError` (et non
 * `navigateTo`) pour que la réponse HTTP soit un vrai 404 en SSR. Les routes ne sont pas retirées du build :
 * le routage reste identique en dev et en production.
 ********************************************************/
export default defineNuxtRouteMiddleware((to) => {
  const record = to.matched.at(-1)
  if (!record || isPageAccessible(record.path)) {
    return
  }
  throw createError({ statusCode: 404, statusMessage: 'Not Found', fatal: true })
})

import { API_ERROR_MESSAGE } from '../../consts/api-error.const'
import { notFound } from '../../utils/http/api-error.util'

/** Toute route inconnue sous /api/v1 répond en JSON (IApiError), jamais par la page d'erreur Nuxt. */
export default defineEventHandler(() => {
  throw notFound(API_ERROR_MESSAGE.ROUTE_NOT_FOUND)
})

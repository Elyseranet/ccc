import { notFound } from '../../utils/http/api-error.util'

/** Toute route inconnue sous /api/v1 répond en JSON (IApiError), jamais par la page d'erreur Nuxt. */
export default defineEventHandler(() => {
  throw notFound('Route not found')
})

import { ApiRequestError, toApiRequestError } from '../utils/api-request-error.util.js'

/*********************************************************
 * Erreur d'un `useAsyncData`
 *
 * @description
 * Selon la version de Nuxt, l'erreur lue dans `useAsyncData` est l'`ApiRequestError` lancée par le service, ou une
 * `NuxtError` qui la porte dans `cause`. `AsyncState` attend toujours un `ApiRequestError`.
 ********************************************************/
export const unwrapAsyncError = (raw: unknown): ApiRequestError | null => {
  if (raw === null || raw === undefined) {
    return null
  }
  if (raw instanceof ApiRequestError) {
    return raw
  }
  const cause = (raw as { cause?: unknown }).cause
  return cause instanceof ApiRequestError ? cause : toApiRequestError(raw)
}

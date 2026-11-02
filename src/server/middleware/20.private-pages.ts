import { getCookie, setResponseHeader } from 'h3'
import { API_PREFIX } from '../../consts/request.const'
import { getSessionCookieName } from '../../utils/session-token.util'

/**
 * Une page rendue pour un visiteur qui présente un cookie de session embarque son compte (`IMe`, dont l'email) dans le payload SSR :
 * un cache partagé ne doit jamais la servir à quelqu'un d'autre (F-10, revue de sécurité L3). Les routes `/api` posent leur propre
 * `Cache-Control`. Sans cookie, la page reste cachable comme avant.
 */
export default defineEventHandler((event) => {
  if (event.path?.startsWith(API_PREFIX)) {
    return
  }
  const { auth } = useRuntimeConfig()
  if (getCookie(event, getSessionCookieName(auth))) {
    setResponseHeader(event, 'Cache-Control', 'private, no-store')
  }
})

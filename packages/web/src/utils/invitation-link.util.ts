import { INVITATION_LINK_PATH, SITE_URL_ERROR } from '../consts/invitation.const.js'

/** Valide `siteUrl` et renvoie son origine. Seul http(s) est accepté. */
export const resolveSiteOrigin = (siteUrl: string): string => {
  let base: URL
  try {
    base = new URL(siteUrl)
  } catch {
    throw new Error(SITE_URL_ERROR)
  }
  if (base.protocol !== 'https:' && base.protocol !== 'http:') {
    throw new Error(SITE_URL_ERROR)
  }
  return base.origin
}

/**
 * Lien de première connexion : `<origine de siteUrl>/invitation/<jeton>`. `siteUrl` vient de
 * `runtimeConfig.public.siteUrl`, jamais de l'en-tête `Host` (qu'un client peut forger pour faire pointer le lien
 * vers un autre domaine). Autonome : la commande `user:create-admin` le compile aussi.
 */
export const buildInvitationLink = (siteUrl: string, token: string): string =>
  `${resolveSiteOrigin(siteUrl)}${INVITATION_LINK_PATH}${token}`

/** Clé de l'état partagé qui annonce la déconnexion sur l'accueil (`useState`). */
export const LOGGED_OUT_STATE_KEY = 'logged-out'

/** Clé du `useAsyncData` de `GET /moi` (plugin `session`) : à invalider à la déconnexion et à l'expiration de la session. */
export const ME_STATE_KEY = 'me'

/** Clé fixe du `useAsyncData` de la page d'invitation : le jeton n'entre jamais dans une clé (revue de sécurité L2). */
export const INVITATION_STATE_KEY = 'invitation'

import { useMe } from '~/composables/useMe'

/*********************************************************
 * Session
 *
 * @description
 * Charge la session (`GET /moi`) au démarrage, côté serveur comme côté client, pour que le middleware
 * `admin` et l'en-tête public connaissent le rôle avant le premier rendu.
 ********************************************************/
export default defineNuxtPlugin(async () => {
  await useMe()
})

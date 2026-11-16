import { defineStore } from 'pinia'
import { ADMIN_EDITION_COOKIE } from '~/consts/edition-status.const'

/*********************************************************
 * Admin edition store
 *
 * @description
 * Édition active de l'espace admin : contexte global de toutes les pages `/admin/**`.
 * Persistée dans un cookie (`ccc_admin_edition`) plutôt que dans l'URL : les URL admin ne portent pas d'identifiant d'édition
 * (`/admin`, `/admin/matchs`…), et le choix doit survivre au rechargement et à la navigation.
 ********************************************************/
export const useAdminEditionStore = defineStore('admin-edition', () => {
  const cookie = useCookie<string | null>(ADMIN_EDITION_COOKIE, { default: () => null, sameSite: 'lax' })
  const editionId = ref<string | null>(cookie.value)

  watch(editionId, (value) => {
    cookie.value = value
  })

  return { editionId }
})

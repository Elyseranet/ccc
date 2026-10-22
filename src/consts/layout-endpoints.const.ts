import { API_ENDPOINT } from '../enums/api-endpoint.enum.js'
import { LAYOUT } from '../enums/layout.enum.js'

/*********************************************************
 * Endpoints consommés par chaque layout
 *
 * @description
 * Déclarés une seule fois, ils s'ajoutent aux endpoints de chaque page qui utilise le layout.
 * `ME` : le plugin `session` l'appelle à chaque page. `EDITIONS` : le layout admin appelle `useAdminEdition()`
 * (sélecteur d'édition) sur toutes les pages admin.
 ********************************************************/
export const LAYOUT_ENDPOINTS: Record<LAYOUT, API_ENDPOINT[]> = {
  [LAYOUT.DEFAULT]: [API_ENDPOINT.ME],
  [LAYOUT.ADMIN]: [API_ENDPOINT.ME, API_ENDPOINT.EDITIONS]
}

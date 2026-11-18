import { API_ENDPOINT } from '../enums/api-endpoint.enum.js'

/*********************************************************
 * Endpoints sans page (ARCH-11 bis)
 *
 * @description
 * Liste explicite des endpoints qu'aucune page n'appelle, chacun avec sa raison. Le test « chaque endpoint est rattaché à une
 * page » les accepte et reste strict pour tous les autres. Un endpoint listé ici qu'une page déclare est signalé : la liste ne
 * doit contenir que des endpoints réellement sans page.
 ********************************************************/
export const ENDPOINTS_WITHOUT_PAGE: Partial<Record<API_ENDPOINT, string>> = {
  [API_ENDPOINT.EDITION_POOLS]: 'données redondantes avec GET /editions/{code}, API publique prévue par la Spec API',
  [API_ENDPOINT.EDITION_DRAWS]: 'données redondantes avec GET /editions/{code}, API publique prévue par la Spec API',
  [API_ENDPOINT.EDITION_ROUNDS]: 'données redondantes avec GET /editions/{code} (`rounds`), API publique prévue par la Spec API ; l\'accueil n\'appelle que le détail et les matchs',
  // B-31 : routes livrées avant l'écran « Administrateurs » (F-68), qui retirera ces entrées en les déclarant dans PAGE_DELIVERY.
  [API_ENDPOINT.ADMINS]: 'écran Administrateurs (F-68), pas encore livré',
  [API_ENDPOINT.ADMIN_INVITE]: 'écran Administrateurs (F-68), pas encore livré',
  [API_ENDPOINT.ADMIN_INVITATION_RESEND]: 'écran Administrateurs (F-68), pas encore livré',
  [API_ENDPOINT.ADMIN_EMAIL_UPDATE]: 'écran Administrateurs (F-68), pas encore livré',
  [API_ENDPOINT.ADMIN_REVOKE]: 'écran Administrateurs (F-68), pas encore livré'
}

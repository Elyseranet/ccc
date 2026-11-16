import { AVATAR_URL_BASE } from '../consts/avatar.const.js'

/** `/api/v1/competiteurs/{id}/avatar?v={empreinte}` : l'URL change à chaque nouvel avatar. `null` sans avatar. */
export const buildAvatarUrl = (competitorId: string, version: string | null): string | null =>
  version ? `${AVATAR_URL_BASE}/${competitorId}/avatar?v=${version}` : null

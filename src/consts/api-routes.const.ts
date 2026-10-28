import { API_ENDPOINT } from '../enums/api-endpoint.enum.js'
import type { IApiRoute } from '../interfaces/api-route.interface.js'

/*********************************************************
 * Table endpoint -> route Nitro (ARCH-8, ARCH-11, OPS-3)
 *
 * @description
 * Toujours l'API réelle : plus aucune fixture. Chaque endpoint consommé par le front nomme le fichier de sa route
 * sous `src/server/api/v1`. Tant que la route n'existe pas, `pendingTicket` nomme le ticket back qui la livre : l'écran
 * répond en erreur (état AsyncState), ses e2e sont marqués en attente, et une page livrée qui en dépend bloque la
 * release (`npm run test:release`). Un test vérifie que chaque fichier existe si et seulement si `pendingTicket` est
 * absent : à la livraison d'une route, on retire son `pendingTicket` dans le même commit.
 ********************************************************/
export const API_ROUTES: Record<API_ENDPOINT, IApiRoute> = {
  [API_ENDPOINT.ME]: { file: 'moi.get.ts' },
  [API_ENDPOINT.ME_UPDATE]: { file: 'moi.patch.ts' },
  [API_ENDPOINT.STATS]: { file: 'stats.get.ts' },
  [API_ENDPOINT.EDITIONS]: { file: 'editions/index.get.ts' },
  [API_ENDPOINT.EDITION]: { file: 'editions/[id]/index.get.ts' },
  [API_ENDPOINT.EDITION_MATCHES]: { file: 'editions/[id]/matchs.get.ts' },
  [API_ENDPOINT.EDITION_PARTICIPANTS]: { file: 'editions/[id]/participants.get.ts' },
  [API_ENDPOINT.EDITION_POOLS]: { file: 'editions/[id]/poules.get.ts' },
  [API_ENDPOINT.EDITION_ROUNDS]: { file: 'editions/[id]/tours.get.ts' },
  [API_ENDPOINT.EDITION_DRAWS]: { file: 'editions/[id]/tirages.get.ts' },
  [API_ENDPOINT.COMPETITORS]: { file: 'competiteurs/index.get.ts' },
  [API_ENDPOINT.COMPETITOR]: { file: 'competiteurs/[id].get.ts' },
  [API_ENDPOINT.HEAD_TO_HEAD]: { file: 'competiteurs/[id]/face-a-face.get.ts' },
  [API_ENDPOINT.RANKING_ACP]: { file: 'classements/acp.get.ts' },
  [API_ENDPOINT.RANKING_ALL_TIME]: { file: 'classements/all-time.get.ts' },
  [API_ENDPOINT.RANKING_EVOLUTION]: { file: 'classements/evolution.get.ts' },
  [API_ENDPOINT.AUTH_LOGIN]: { file: 'auth/login.post.ts' },
  [API_ENDPOINT.AUTH_LOGOUT]: { file: 'auth/logout.post.ts' },
  [API_ENDPOINT.INVITATION_CHECK]: { file: 'auth/invitation/[jeton].get.ts' },
  [API_ENDPOINT.INVITATION_ACCEPT]: { file: 'auth/invitation/[jeton].post.ts' },
  [API_ENDPOINT.EDITION_PARTICIPANT_ADD]: { file: 'editions/[id]/participants.post.ts' },
  [API_ENDPOINT.EDITION_PARTICIPANT_REMOVE]: { file: 'editions/[id]/participants/[participationId].delete.ts' },
  [API_ENDPOINT.ADMIN_DRAWS]: { file: 'admin/editions/[id]/tirages.get.ts', pendingTicket: 'B-11' },
  [API_ENDPOINT.DRAW_SEEDS]: { file: 'editions/[id]/tetes-de-serie.get.ts', pendingTicket: 'B-11' },
  [API_ENDPOINT.DRAW_POOLS_CREATE]: { file: 'editions/[id]/tirages/poules.post.ts', pendingTicket: 'B-11' },
  [API_ENDPOINT.DRAW_ASSIGNMENTS]: { file: 'tirages/[id]/affectations.put.ts', pendingTicket: 'B-11' },
  [API_ENDPOINT.DRAW_VALIDATION]: { file: 'tirages/[id]/validation.post.ts', pendingTicket: 'B-11' },
  [API_ENDPOINT.ADMIN_MATCHES]: { file: 'admin/editions/[id]/matchs.get.ts' },
  [API_ENDPOINT.MATCH_SCORE]: { file: 'matchs/[id]/score.put.ts' },
  [API_ENDPOINT.MATCH_VALIDATION]: { file: 'matchs/[id]/validation.post.ts' },
  [API_ENDPOINT.ME_AVATAR_UPLOAD]: { file: 'moi/avatar.put.ts' },
  [API_ENDPOINT.ME_AVATAR_DELETE]: { file: 'moi/avatar.delete.ts' },
  [API_ENDPOINT.COMPETITOR_AVATAR_UPLOAD]: { file: 'competiteurs/[id]/avatar.put.ts' }
}

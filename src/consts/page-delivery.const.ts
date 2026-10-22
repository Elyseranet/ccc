import { ROUTES } from './routes.const.js'
import { API_ENDPOINT } from '../enums/api-endpoint.enum.js'
import { LAYOUT } from '../enums/layout.enum.js'
import type { IPageDelivery } from '../interfaces/page-delivery.interface.js'

/*********************************************************
 * Table page -> livraison et endpoints (garde de release, OPS-3)
 *
 * @description
 * Une page `delivered: false` répond 404 en production et disparaît de la navigation. Une page `delivered: true`
 * ne doit consommer aucun endpoint dont la route n'existe pas encore (`API_ROUTES`, `pendingTicket`) :
 * `npm run test:release` échoue sinon, donc le build de l'image aussi. Toutes les routes sont pré-déclarées : un
 * ticket F-xx ne change que SA ligne, et passe `delivered` à `true` quand l'écran est branché sur l'API réelle.
 *
 * `endpoints` ne liste que les endpoints propres à la page (composables et services compris). Ceux du layout
 * (`LAYOUT_ENDPOINTS` : `ME`, et `EDITIONS` pour l'admin) s'y ajoutent. La liste est une première affectation,
 * à confirmer par le ticket de chaque écran avant de le livrer.
 ********************************************************/
export const PAGE_DELIVERY: Record<string, IPageDelivery> = {
  [ROUTES.HOME]: {
    delivered: false,
    layout: LAYOUT.DEFAULT,
    endpoints: [
      API_ENDPOINT.STATS,
      API_ENDPOINT.EDITIONS,
      API_ENDPOINT.EDITION,
      API_ENDPOINT.EDITION_ROUNDS,
      API_ENDPOINT.EDITION_MATCHES,
      API_ENDPOINT.RANKING_ACP
    ]
  },
  [ROUTES.HALL_OF_FAME]: {
    delivered: false,
    layout: LAYOUT.DEFAULT,
    endpoints: [API_ENDPOINT.EDITIONS, API_ENDPOINT.RANKING_ALL_TIME, API_ENDPOINT.RANKING_EVOLUTION]
  },
  [ROUTES.EDITIONS]: {
    delivered: false,
    layout: LAYOUT.DEFAULT,
    endpoints: [API_ENDPOINT.EDITIONS]
  },
  [ROUTES.EDITION]: {
    delivered: false,
    layout: LAYOUT.DEFAULT,
    endpoints: [
      API_ENDPOINT.EDITIONS,
      API_ENDPOINT.EDITION,
      API_ENDPOINT.EDITION_MATCHES,
      API_ENDPOINT.EDITION_PARTICIPANTS,
      API_ENDPOINT.EDITION_POOLS,
      API_ENDPOINT.EDITION_ROUNDS,
      API_ENDPOINT.EDITION_DRAWS,
      API_ENDPOINT.RANKING_ACP
    ]
  },
  [ROUTES.PLAYERS]: {
    delivered: false,
    layout: LAYOUT.DEFAULT,
    endpoints: [API_ENDPOINT.EDITIONS, API_ENDPOINT.COMPETITORS, API_ENDPOINT.STATS]
  },
  [ROUTES.PLAYER]: {
    delivered: false,
    layout: LAYOUT.DEFAULT,
    endpoints: [API_ENDPOINT.COMPETITOR, API_ENDPOINT.HEAD_TO_HEAD]
  },
  [ROUTES.HEAD_TO_HEAD]: {
    delivered: false,
    layout: LAYOUT.DEFAULT,
    endpoints: [API_ENDPOINT.COMPETITORS, API_ENDPOINT.COMPETITOR, API_ENDPOINT.HEAD_TO_HEAD]
  },
  [ROUTES.RULES]: {
    delivered: false,
    layout: LAYOUT.DEFAULT,
    endpoints: []
  },
  [ROUTES.LOGIN]: {
    delivered: false,
    layout: LAYOUT.DEFAULT,
    endpoints: [API_ENDPOINT.AUTH_LOGIN]
  },
  [ROUTES.INVITATION]: {
    delivered: false,
    layout: LAYOUT.DEFAULT,
    endpoints: [API_ENDPOINT.INVITATION_CHECK, API_ENDPOINT.INVITATION_ACCEPT]
  },
  [ROUTES.PROFILE]: {
    delivered: false,
    layout: LAYOUT.DEFAULT,
    endpoints: [
      API_ENDPOINT.ME_UPDATE,
      API_ENDPOINT.ME_AVATAR_UPLOAD,
      API_ENDPOINT.ME_AVATAR_DELETE,
      API_ENDPOINT.AUTH_LOGOUT
    ]
  },
  [ROUTES.ADMIN]: {
    delivered: false,
    layout: LAYOUT.ADMIN,
    endpoints: [
      API_ENDPOINT.EDITION,
      API_ENDPOINT.EDITION_PARTICIPANTS,
      API_ENDPOINT.ADMIN_MATCHES,
      API_ENDPOINT.ADMIN_DRAWS
    ]
  },
  [ROUTES.ADMIN_PARTICIPANTS]: {
    delivered: false,
    layout: LAYOUT.ADMIN,
    endpoints: [
      API_ENDPOINT.EDITION,
      API_ENDPOINT.EDITION_PARTICIPANTS,
      API_ENDPOINT.COMPETITORS,
      API_ENDPOINT.EDITION_PARTICIPANT_ADD,
      API_ENDPOINT.EDITION_PARTICIPANT_REMOVE,
      API_ENDPOINT.COMPETITOR_AVATAR_UPLOAD
    ]
  },
  [ROUTES.ADMIN_DRAWS]: {
    delivered: false,
    layout: LAYOUT.ADMIN,
    endpoints: [
      API_ENDPOINT.ADMIN_DRAWS,
      API_ENDPOINT.DRAW_SEEDS,
      API_ENDPOINT.DRAW_POOLS_CREATE,
      API_ENDPOINT.DRAW_ASSIGNMENTS,
      API_ENDPOINT.DRAW_VALIDATION
    ]
  },
  [ROUTES.ADMIN_MATCHES]: {
    delivered: false,
    layout: LAYOUT.ADMIN,
    endpoints: [
      API_ENDPOINT.ADMIN_MATCHES,
      API_ENDPOINT.MATCH_SCORE,
      API_ENDPOINT.MATCH_VALIDATION
    ]
  },
  [ROUTES.ADMIN_MORE]: {
    delivered: false,
    layout: LAYOUT.ADMIN,
    endpoints: [API_ENDPOINT.AUTH_LOGOUT]
  }
}

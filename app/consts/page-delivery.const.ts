import { ROUTES } from '~/consts/routes.const'
import { API_ENDPOINT } from '~/enums/api-endpoint.enum'
import type { IPageDelivery } from '~/interfaces/page-delivery.interface'

/*********************************************************
 * Table page -> livraison et endpoints (garde de release, OPS-3)
 *
 * @description
 * Une page `delivered: false` répond 404 en production et disparaît de la navigation. Une page `delivered: true`
 * ne doit consommer aucun endpoint en `API_SOURCE.FIXTURE` : `npm run test:release` échoue sinon, donc le build
 * de l'image aussi. Toutes les routes sont pré-déclarées : un ticket F-xx ne change que SA ligne, et passe
 * `delivered` à `true` dans le même commit qui bascule ses endpoints en LIVE.
 *
 * Les endpoints listés sont ceux de la page, composables, services et session compris. `ME` figure partout :
 * le plugin `session` l'appelle à chaque page. La liste est une première affectation, à confirmer par le ticket
 * de chaque écran avant de le livrer.
 ********************************************************/
export const PAGE_DELIVERY: Record<string, IPageDelivery> = {
  [ROUTES.HOME]: {
    delivered: false,
    endpoints: [API_ENDPOINT.ME, API_ENDPOINT.STATS, API_ENDPOINT.EDITIONS, API_ENDPOINT.RANKING_ACP]
  },
  [ROUTES.HALL_OF_FAME]: {
    delivered: false,
    endpoints: [API_ENDPOINT.ME, API_ENDPOINT.RANKING_ALL_TIME, API_ENDPOINT.RANKING_EVOLUTION]
  },
  [ROUTES.EDITIONS]: {
    delivered: false,
    endpoints: [API_ENDPOINT.ME, API_ENDPOINT.EDITIONS]
  },
  [ROUTES.EDITION]: {
    delivered: false,
    endpoints: [
      API_ENDPOINT.ME,
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
    endpoints: [API_ENDPOINT.ME, API_ENDPOINT.COMPETITORS]
  },
  [ROUTES.PLAYER]: {
    delivered: false,
    endpoints: [API_ENDPOINT.ME, API_ENDPOINT.COMPETITOR, API_ENDPOINT.RANKING_EVOLUTION]
  },
  [ROUTES.HEAD_TO_HEAD]: {
    delivered: false,
    endpoints: [API_ENDPOINT.ME, API_ENDPOINT.COMPETITORS, API_ENDPOINT.HEAD_TO_HEAD]
  },
  [ROUTES.RULES]: {
    delivered: false,
    endpoints: [API_ENDPOINT.ME]
  },
  [ROUTES.LOGIN]: {
    delivered: false,
    endpoints: [API_ENDPOINT.ME, API_ENDPOINT.AUTH_LOGIN]
  },
  [ROUTES.INVITATION]: {
    delivered: false,
    endpoints: [API_ENDPOINT.ME, API_ENDPOINT.INVITATION_CHECK, API_ENDPOINT.INVITATION_ACCEPT]
  },
  [ROUTES.PROFILE]: {
    delivered: false,
    endpoints: [
      API_ENDPOINT.ME,
      API_ENDPOINT.ME_UPDATE,
      API_ENDPOINT.ME_AVATAR_UPLOAD,
      API_ENDPOINT.ME_AVATAR_DELETE,
      API_ENDPOINT.AUTH_LOGOUT
    ]
  },
  [ROUTES.ADMIN]: {
    delivered: false,
    endpoints: [
      API_ENDPOINT.ME,
      API_ENDPOINT.EDITIONS,
      API_ENDPOINT.EDITION,
      API_ENDPOINT.EDITION_PARTICIPANTS,
      API_ENDPOINT.ADMIN_MATCHES,
      API_ENDPOINT.ADMIN_DRAWS
    ]
  },
  [ROUTES.ADMIN_PARTICIPANTS]: {
    delivered: false,
    endpoints: [
      API_ENDPOINT.ME,
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
    endpoints: [
      API_ENDPOINT.ME,
      API_ENDPOINT.ADMIN_DRAWS,
      API_ENDPOINT.DRAW_SEEDS,
      API_ENDPOINT.DRAW_POOLS_CREATE,
      API_ENDPOINT.DRAW_ASSIGNMENTS,
      API_ENDPOINT.DRAW_VALIDATION
    ]
  },
  [ROUTES.ADMIN_MATCHES]: {
    delivered: false,
    endpoints: [
      API_ENDPOINT.ME,
      API_ENDPOINT.ADMIN_MATCHES,
      API_ENDPOINT.MATCH_SCORE,
      API_ENDPOINT.MATCH_VALIDATION
    ]
  },
  [ROUTES.ADMIN_MORE]: {
    delivered: false,
    endpoints: [API_ENDPOINT.ME, API_ENDPOINT.AUTH_LOGOUT]
  }
}

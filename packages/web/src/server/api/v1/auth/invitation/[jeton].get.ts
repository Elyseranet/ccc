import { getRouterParam, setResponseHeader } from 'h3'
import type { IInvitationPreview } from '../../../../../interfaces/invitation.interface'
import { RATE_LIMIT_ROUTE_KEY } from '../../../../../consts/rate-limit.const'
import { previewInvitation } from '../../../../../services/invitation.service'
import { notFound } from '../../../../../utils/api-error.util'
import { useDataSource } from '../../../../../utils/database.util'
import { isWellFormedInvitationToken } from '../../../../../utils/invitation-token.util'
import { enforceRateLimit } from '../../../../../utils/rate-limit.util'

/** GET /api/v1/auth/invitation/{jeton} (public) : prénom et pseudo à pré-remplir ; 404 jeton inconnu, 410 expiré ou consommé. */
export default defineEventHandler(async (event): Promise<IInvitationPreview> => {
  setResponseHeader(event, 'Cache-Control', 'no-store')
  enforceRateLimit(event, RATE_LIMIT_ROUTE_KEY.INVITATION_TOKEN)
  const token = getRouterParam(event, 'jeton')
  if (!isWellFormedInvitationToken(token)) {
    throw notFound()
  }
  return previewInvitation(await useDataSource(), token)
})

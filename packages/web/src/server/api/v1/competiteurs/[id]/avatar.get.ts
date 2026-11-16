import { RATE_LIMIT_ROUTE_KEY } from '../../../../../consts/rate-limit.const'
import { findAvatar } from '../../../../../services/avatar.service'
import { serveAvatar } from '../../../../../utils/avatar-response.util'
import { competitorIdParamsSchema } from '../../../../schemas/competitor.schema'
import { notFound } from '../../../../../utils/api-error.util'
import { useDataSource } from '../../../../../utils/database.util'
import { enforceRateLimit } from '../../../../../utils/rate-limit.util'
import { getParamsWithSchema } from '../../../../../utils/validation.util'

/** GET /api/v1/competiteurs/{id}/avatar : public (P5.4), octets de l'image ; 404 sans avatar. */
export default defineEventHandler(async (event) => {
  enforceRateLimit(event, RATE_LIMIT_ROUTE_KEY.PUBLIC_READ)
  const { id } = await getParamsWithSchema(event, competitorIdParamsSchema)
  const avatar = await findAvatar(await useDataSource(), id)
  if (!avatar) {
    throw notFound()
  }
  return serveAvatar(event, avatar)
})

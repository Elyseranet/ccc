import { setResponseHeader } from 'h3'
import { USER_ROLE } from '../../../../../enums/user.enum.js'
import type { ISeedProposal } from '../../../../../interfaces/draw.interface.js'
import { loadSeedProposal } from '../../../../../services/draw.service.js'
import { useDataSource } from '../../../../../utils/database.util.js'
import { requireRole } from '../../../../../utils/require-role.util.js'
import { getParamsWithSchema, getQueryWithSchema } from '../../../../../utils/validation.util.js'
import { seedProposalQuerySchema } from '../../../../schemas/draw.schema.js'
import { editionParamsSchema } from '../../../../schemas/edition.schema.js'

/** GET /api/v1/editions/{id}/tetes-de-serie?poules={n} (administrateur) : propose les n têtes de série (RG9, RG10). */
export default defineEventHandler(async (event): Promise<ISeedProposal> => {
  requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id } = await getParamsWithSchema(event, editionParamsSchema)
  const { poules } = await getQueryWithSchema(event, seedProposalQuerySchema)
  return loadSeedProposal(await useDataSource(), id, poules)
})

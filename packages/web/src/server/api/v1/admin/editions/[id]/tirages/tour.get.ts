import { setResponseHeader } from 'h3'
import { USER_ROLE } from '../../../../../../../enums/user.enum.js'
import type { IRoundDrawPreview } from '../../../../../../../interfaces/qualification.interface.js'
import { loadRoundDrawPreview } from '../../../../../../../services/draw.service.js'
import { useDataSource } from '../../../../../../../utils/database.util.js'
import { requireRole } from '../../../../../../../utils/require-role.util.js'
import { getParamsWithSchema } from '../../../../../../../utils/validation.util.js'
import { editionParamsSchema } from '../../../../../../schemas/edition.schema.js'

/** GET /api/v1/admin/editions/{id}/tirages/tour (administrateur) : le prochain tirage de tour (tour, vivier, blocage), sans rien écrire. */
export default defineEventHandler(async (event): Promise<IRoundDrawPreview> => {
  requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id } = await getParamsWithSchema(event, editionParamsSchema)
  return loadRoundDrawPreview(await useDataSource(), id)
})

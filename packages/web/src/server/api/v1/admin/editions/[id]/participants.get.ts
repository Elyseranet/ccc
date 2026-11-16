import { setResponseHeader } from 'h3'
import { USER_ROLE } from '../../../../../../enums/user.enum'
import type { IAdminParticipant } from '../../../../../../interfaces/edition.interface'
import { editionParamsSchema } from '../../../../../schemas/edition.schema'
import { loadAdminParticipants } from '../../../../../../services/edition.service'
import { useDataSource } from '../../../../../../utils/database.util'
import { requireRole } from '../../../../../../utils/require-role.util'
import { getParamsWithSchema } from '../../../../../../utils/validation.util'

/** GET /api/v1/admin/editions/{id}/participants : inscrits avec éditions jouées et état du compte (aucun email ni téléphone). */
export default defineEventHandler(async (event): Promise<IAdminParticipant[]> => {
  requireRole(event, USER_ROLE.ADMIN)
  setResponseHeader(event, 'Cache-Control', 'no-store')
  const { id } = await getParamsWithSchema(event, editionParamsSchema)
  return loadAdminParticipants(await useDataSource(), id)
})
